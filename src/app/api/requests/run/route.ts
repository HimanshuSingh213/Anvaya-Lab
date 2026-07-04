import mongoose from "mongoose";
import DailyWorkspaceAnalyticsModel from "@/models/WorkspaceStats.model";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";
import { ApiResponse } from "@/types/ApiResponse";
import { runRequestSchema } from "@/validations/runRequest.validation";
import axios from "axios";
import dbConnect from "@/lib/dbConnect";

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
    try {
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

        const { workspaceId, url, method, queryParams, headers, authentication, body } = validationResult.data;

        // completing the url
        const urlObj = new URL(url);
        queryParams.forEach((param) => {
            if (param.isEnabled && param.key) {
                urlObj.searchParams.append(param.key, param.value || "");
            }
        });

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
                timeout: 15000,
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

                await DailyWorkspaceAnalyticsModel.findOneAndUpdate(
                    { workspaceId: new mongoose.Types.ObjectId(workspaceId) as any, date: currentDate },
                    updateQuery,
                    {
                        upsert: true,
                        new: true
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
            error: err.message || "An unexpected error occurred while running the request"
        }, { status: 500 });
    }
}