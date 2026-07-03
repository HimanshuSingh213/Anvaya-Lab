import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import RequestHistoryModel from "@/models/RequestHistory.model";
import { NextResponse } from "next/server";
import z from "zod";

const createHistorySchema = z.object({
    workspaceId: z.string().min(1, "Workspace ID is required"),
    method: z.string().min(1, "HTTP Method is required"),
    url: z.string().url("Invalid URL"),
    headers: z.string().optional().default("{}"),
    body: z.string().optional().default(""),
    status: z.number(),
    responseTime: z.number(),
    response: z.string().optional().default("")
});

export async function POST(req: Request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({
                success: false,
                error: "Unauthorized"
            }, { status: 401 });
        }

        const body = await req.json();
        const validationResult = createHistorySchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json({
                success: false,
                error: validationResult.error.issues[0]?.message || "Invalid input format"
            }, { status: 400 });
        }

        const data = validationResult.data;

        const newHistory = await RequestHistoryModel.create({
            ...data,
            userId: session.user.id
        });

        return NextResponse.json({
            success: true,
            message: "Request history logged successfully",
            data: newHistory
        }, { status: 201 });

    } catch (err: any) {
        console.error("Create Request History error:", err);
        return NextResponse.json({
            success: false,
            error: err.message || "An unexpected error occurred while logging history"
        }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({
                success: false,
                error: "Unauthorized"
            }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const workspaceId = searchParams.get("workspaceId");

        if (!workspaceId) {
            return NextResponse.json({
                success: false,
                error: "Workspace ID is required"
            }, { status: 400 });
        }

        const history = await RequestHistoryModel.find({
            userId: session.user.id,
            workspaceId
        }).sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            message: "Request history retrieved successfully",
            data: history
        }, { status: 200 });

    } catch (err: any) {
        console.error("Get Request History error:", err);
        return NextResponse.json({
            success: false,
            error: err.message || "An unexpected error occurred while retrieving history"
        }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({
                success: false,
                error: "Unauthorized"
            }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const workspaceId = searchParams.get("workspaceId");

        if (!workspaceId) {
            return NextResponse.json({
                success: false,
                error: "Workspace ID is required to clear history"
            }, { status: 400 });
        }

        await RequestHistoryModel.deleteMany({
            workspaceId,
            userId: session.user.id
        });

        return NextResponse.json({
            success: true,
            message: "Request history cleared successfully"
        }, { status: 200 });

    } catch (err: any) {
        console.error("Delete Request History error:", err);
        return NextResponse.json({
            success: false,
            error: err.message || "An unexpected error occurred while clearing history"
        }, { status: 500 });
    }
}
