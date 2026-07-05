import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import WorkspaceStatsModel from "@/models/WorkspaceStats.model";
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

        const aggregatedStats = await WorkspaceStatsModel.aggregate([
            {
                $match: {
                    workspaceId: new mongoose.Types.ObjectId(workspaceId)
                }
            },
            {
                $group: {
                    _id: null,
                    totalRequests: {
                        $sum: "$totalRequests"
                    },
                    totalLatency: {
                        $sum: "$totalLatency"
                    },

                    // Methods
                    methods_GET: {
                        $sum: "$methods.GET"
                    },
                    methods_POST: {
                        $sum: "$methods.POST"
                    },
                    methods_PUT: {
                        $sum: "$methods.PUT"
                    },
                    methods_PATCH: {
                        $sum: "$methods.PATCH"
                    },
                    methods_DELETE: {
                        $sum: "$methods.DELETE"
                    },

                    // Status codes
                    statusCodes_2xx: {
                        $sum: "$statusCodes.2xx"
                    },
                    statusCodes_3xx: {
                        $sum: "$statusCodes.3xx"
                    },
                    statusCodes_4xx: {
                        $sum: "$statusCodes.4xx"
                    },
                    statusCodes_5xx: {
                        $sum: "$statusCodes.5xx"
                    }
                }
            }
        ]);

        const dailyStatsList = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];
            dailyStatsList.push({
                date: dateStr,
                totalRequests: 0,
                averageLatency: 0
            });
        }

        const dailyDocs = await WorkspaceStatsModel.find({
            workspaceId: new mongoose.Types.ObjectId(workspaceId),
            date: { $in: dailyStatsList.map(d => d.date) }
        });

        const dailyDocsMap = new Map();
        dailyDocs.forEach(doc => {
            dailyDocsMap.set(doc.date, doc);
        });

        const dailyStats = dailyStatsList.map(item => {
            const doc = dailyDocsMap.get(item.date);
            if (doc) {
                return {
                    date: item.date,
                    totalRequests: doc.totalRequests || 0,
                    averageLatency: doc.totalRequests > 0 ? Math.round(doc.totalLatency / doc.totalRequests) : 0
                };
            }
            return item;
        });

        if (!aggregatedStats || aggregatedStats.length === 0) {
            return NextResponse.json<ApiResponse>({
                success: true,
                data: {
                    totalRequests: 0,
                    averageLatency: 0,
                    methods: { GET: 0, POST: 0, PUT: 0, PATCH: 0, DELETE: 0 },
                    statusCodes: { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 },
                    dailyStats
                }
            }, { status: 200 });
        }

        const stats = aggregatedStats[0];

        const averageLatency = stats.totalRequests > 0 ? Math.round(stats.totalLatency / stats.totalRequests) : 0;

        const methods = {
            GET: stats.methods_GET || 0,
            POST: stats.methods_POST || 0,
            PUT: stats.methods_PUT || 0,
            PATCH: stats.methods_PATCH || 0,
            DELETE: stats.methods_DELETE || 0,
        };

        const statusCodes = {
            "2xx": stats.statusCodes_2xx || 0,
            "3xx": stats.statusCodes_3xx || 0,
            "4xx": stats.statusCodes_4xx || 0,
            "5xx": stats.statusCodes_5xx || 0,
        };


        return NextResponse.json<ApiResponse>({
            success: true,
            data: {
                totalRequests: stats.totalRequests,
                averageLatency,
                methods,
                statusCodes,
                dailyStats
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