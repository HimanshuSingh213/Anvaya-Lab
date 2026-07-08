import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";
import { ApiResponse } from "@/types/ApiResponse";
import { runRequestSchema } from "@/validations/runRequest.validation";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";
import WorkspaceStatsModel from "@/models/WorkspaceStats.model";
import WorkspaceModel from "@/models/Workspace.model";
import dns from "dns";
import { promisify } from "util";
import { rateLimit } from "@/lib/rateLimit";

const dnsLookup = promisify(dns.lookup);

function isPrivateIp(ip: string): boolean {
    // Loopback addresses (IPv4 & IPv6)
    if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("127.")) {
        return true;
    }
    // Link-local / Cloud metadata (169.254.x.x)
    if (ip.startsWith("169.254.")) {
        return true;
    }
    
    // RFC 1918 Private IPv4 address ranges
    const parts = ip.split(".").map(Number);
    if (parts.length === 4) {
        // 10.0.0.0/8
        if (parts[0] === 10) return true;
        // 172.16.0.0/12
        if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
        // 192.168.0.0/16
        if (parts[0] === 192 && parts[1] === 168) return true;
    }
    
    // IPv6 Unique Local Address (fc00::/7) or link-local (fe80::/10)
    const lowerIp = ip.toLowerCase();
    if (lowerIp.startsWith("fc") || lowerIp.startsWith("fd") || lowerIp.startsWith("fe8")) {
        return true;
    }
    
    return false;
}


export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
    try {
        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
        const limitResult = rateLimit(ip, 30, 60 * 1000);
        if (!limitResult.success) {
            return NextResponse.json({
                success: false,
                error: "Too many request runs. Please try again later."
            }, {
                status: 429,
                headers: { "Retry-After": Math.ceil((limitResult.reset - Date.now()) / 1000).toString() }
            });
        }

        await dbConnect();
        // verifying session
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({
                success: false,
                error: "Unauthorized"
            }, { status: 401 });
        }

        // validating req with zod
        const jsonBody = await req.json();
        const validationResult = runRequestSchema.safeParse(jsonBody);

        if (!validationResult.success) {
            return NextResponse.json({
                success: false,
                error: validationResult.error.issues[0]?.message || "Invalid inputs"
            }, { status: 400 });
        }

        const { workspaceId, url, method, queryParams, headers, authentication, body, settings } = validationResult.data;

        if (workspaceId) {
            if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
                return NextResponse.json({
                    success: false,
                    error: "Invalid Workspace ID format"
                }, { status: 400 });
            }
            const workspace = await WorkspaceModel.findOne({ _id: workspaceId, ownerId: session.user.id });
            if (!workspace) {
                return NextResponse.json({
                    success: false,
                    error: "Workspace not found or unauthorized access"
                }, { status: 404 });
            }
        }

        let targetUrl = url;
        if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = "http://" + targetUrl;
        }

        // completing the url
        const urlObj = new URL(targetUrl);
        queryParams.forEach((param) => {
            if (param.isEnabled && param.key) {
                urlObj.searchParams.append(param.key, param.value || "");
            }
        });

        // SSRF protection - enforce strictly HTTP/HTTPS
        if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
            return NextResponse.json({
                success: false,
                error: "Invalid protocol. Only HTTP and HTTPS requests are permitted."
            }, { status: 400 });
        }

        try {
            // Resolve Hostname to IP address
            const { address: resolvedIp } = await dnsLookup(urlObj.hostname);

            // Check if IP falls into private/local network
            if (isPrivateIp(resolvedIp)) {
                return NextResponse.json({
                    success: false,
                    error: "Access to private or local network resources is restricted."
                }, { status: 400 });
            }
        } catch (dnsErr) {
            return NextResponse.json({
                success: false,
                error: "Could not resolve hostname target."
            }, { status: 400 });
        }

        const finalUrl = urlObj.toString();

        // mapping active headers 
        const requestHeaders: Record<string, string> = {};
        headers.forEach((header) => {
            if (header.isEnabled && header.key) {
                requestHeaders[header.key] = header.value || ""
            }
        });

        // Handling Authentication configurations
        if (authentication && authentication.type !== "none") {
            if (authentication.type === "bearer" && authentication.value) {
                requestHeaders["Authorization"] = `Bearer ${authentication.value}`;
            }
            else if (authentication.type === "basic") {
                const username = authentication.username || "";
                const password = authentication.password || "";
                const credentials = Buffer.from(`${username}:${password}`).toString("base64");
                requestHeaders["Authorization"] = `Basic ${credentials}`;
            }
            else if (authentication.type === "apikey" && authentication.key && authentication.value) {
                requestHeaders[authentication.key] = authentication.value;
            }
        }

        // Handling req body configurations
        let requestData: any = null;
        if (body && body.type !== "none") {
            if (body.type === "json") {
                requestHeaders["Content-Type"] = "application/json";
                try {
                    requestData = JSON.parse(body.content || "{}");
                } catch {
                    requestData = body.content;
                }
            } else if (body.type === "x-www-form-urlencoded") {
                requestHeaders["Content-Type"] = "application/x-www-form-urlencoded";
                requestData = body.content || "";
            } else {
                requestHeaders["Content-Type"] = "text/plain";
                requestData = body.content || "";
            }
        }

        // Measuring req latency and executing req
        const startTime = performance.now();

        let response;
        try {
            response = await axios({
                url: finalUrl,
                method,
                headers: requestHeaders,
                data: requestData,
                timeout: settings?.timeout ?? 8000,
                maxRedirects: settings?.followRedirects === false ? 0 : 5,
                validateStatus: () => true,
                responseType: "text",
            });
        } catch (err: any) {
            const endTime = performance.now();
            return NextResponse.json({
                success: true,
                data: {
                    status: 0,
                    statusText: "Network Error",
                    time: Math.round(endTime - startTime),
                    size: 0,
                    headers: {},
                    body: err.message || "Failed to execute target request"
                }
            }, { status: 200 });
        }

        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        // Calculating the response payload size
        const responseBodyStr = typeof response.data === "string" ? response.data : JSON.stringify(response.data || "")

        const headerSize = Object.entries(response.headers).reduce(
            (acc, [key, val]) => acc + key.length + String(val).length, 0
        );
        const payloadSize = Buffer.byteLength(responseBodyStr, "utf-8") + headerSize;

        // Enforce max response size limit
        const limitSizeMB = settings?.maxSize ?? 10;
        if (payloadSize > limitSizeMB * 1024 * 1024) {
            return NextResponse.json({
                success: true,
                data: {
                    status: 413,
                    statusText: "Payload Too Large",
                    time: duration,
                    size: payloadSize,
                    headers: response.headers,
                    body: `Response size limit exceeded: response was larger than the configured ${limitSizeMB}MB limit.`
                }
            }, { status: 200 });
        }

        // Auto-parsing JSON response if possible
        let finalBody = responseBodyStr;
        try {
            finalBody = JSON.parse(responseBodyStr);
        } catch { }

        const statusCode = response.status;
        const statusGroup = statusCode >= 200 && statusCode < 300 ? "2xx" :
                            statusCode >= 300 && statusCode < 400 ? "3xx" :
                            statusCode >= 400 && statusCode < 500 ? "4xx" : "5xx";
        const currentDate = new Date().toISOString().split("T")[0];

        try {
            if (workspaceId && mongoose.Types.ObjectId.isValid(workspaceId)) {
                const updateQuery: any = {
                    $inc: {
                        totalRequests: 1,
                        totalLatency: duration,
                        [`methods.${method.toUpperCase()}`]: 1,
                        [`statusCodes.${statusGroup}`]: 1
                    }
                };

                await WorkspaceStatsModel.findOneAndUpdate(
                    { workspaceId: new mongoose.Types.ObjectId(workspaceId) as any, date: currentDate },
                    updateQuery,
                    {
                        upsert: true
                    }
                )
            }

        } catch (err) {
            console.error("Failed to update workspace stats:", err);
        }

        // Returning response metadata
        return NextResponse.json({
            success: true,
            message: "Request executed successfully",
            data: {
                status: response.status,
                statusText: response.statusText,
                time: duration,
                size: payloadSize,
                headers: response.headers,
                body: finalBody
            }
        }, { status: 200 });


    }
    catch (err: any) {
        console.error("Runner Error:", err);
        return NextResponse.json({
            success: false,
            error: "An unexpected error occurred while running the request"
        }, { status: 500 });
    }
}