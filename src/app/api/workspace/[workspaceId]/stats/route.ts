import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import DailyWorkspaceAnalyticsModel from "@/models/WorkspaceStats.model";
import { ApiResponse } from "@/types/ApiResponse";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ workspaceId: string }> }
) {

    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: "Unauthorized"
            }, { status: 401 });
        }

        const { workspaceId } = await params;

        if (!workspaceId || !mongoose.isValidObjectId(workspaceId)) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: "Valid Workspace ID is required"
            }, { status: 400 });
        }

        const statsList = await DailyWorkspaceAnalyticsModel.find({
            workspaceId: new mongoose.Types.ObjectId(workspaceId) as any
        });

        if (!statsList || statsList.length === 0) {
            return NextResponse.json<ApiResponse>({
                success: true,
                data: {
                    totalRequests: 0,
                    averageLatency: 0,
                    methods: { GET: 0, POST: 0, PUT: 0, PATCH: 0, DELETE: 0 },
                    methodStats: { GET: 0, POST: 0, PUT: 0, PATCH: 0, DELETE: 0 },
                    statusCodes: { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 }
                }
            }, { status: 200 });
        }

        // Aggregate statistics across all days
        let totalRequests = 0;
        let totalLatency = 0;
        const methods = { GET: 0, POST: 0, PUT: 0, DELETE: 0, PATCH: 0 };
        const statusCodes = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 };

        for (const day of statsList) {
            totalRequests += day.totalRequests || 0;
            totalLatency += day.totalLatency || 0;
            if (day.methods) {
                methods.GET += day.methods.GET || 0;
                methods.POST += day.methods.POST || 0;
                methods.PUT += day.methods.PUT || 0;
                methods.DELETE += day.methods.DELETE || 0;
                methods.PATCH += day.methods.PATCH || 0;
            }
            if (day.statusCodes) {
                statusCodes["2xx"] += day.statusCodes["2xx"] || 0;
                statusCodes["3xx"] += day.statusCodes["3xx"] || 0;
                statusCodes["4xx"] += day.statusCodes["4xx"] || 0;
                statusCodes["5xx"] += day.statusCodes["5xx"] || 0;
            }
        }

        const averageLatency = totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0;

        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                totalRequests,
                averageLatency,
                methods,
                methodStats: methods,
                statusCodes
            }
        }, { status: 200 });

    } catch (err: any) {
        console.error("Error fetching workspace stats:", err);
        return NextResponse.json<ApiResponse>({
            success: false,
            error: err.message || "Internal server error"
        }, { status: 500 });
    }
}