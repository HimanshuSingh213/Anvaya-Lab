import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { createWorkspaceSchema } from "@/validations/workspace.validation";
import WorkspaceModel from "@/models/Workspace.model";
import CollectionModel from "@/models/Collection.model";
import RequestModel from "@/models/Request.model";
import RequestHistoryModel from "@/models/RequestHistory.model";
import WorkspaceStatsModel from "@/models/WorkspaceStats.model";
import { NextResponse } from "next/server";

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
        const validationResult = createWorkspaceSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json({
                success: false,
                error: validationResult.error.issues[0]?.message || "Invalid input format"
            }, { status: 400 });
        }

        const { name } = validationResult.data;

        const existingWorkspace = await WorkspaceModel.findOne({ name, ownerId: session.user.id });
        if (existingWorkspace) {
            return NextResponse.json({
                success: false,
                error: "Workspace with this name already exists"
            }, { status: 400 });
        }

        const newWorkspace = await WorkspaceModel.create({
            name,
            ownerId: session.user.id
        });

        return NextResponse.json({
            success: true,
            message: "Workspace created successfully",
            data: newWorkspace
        }, { status: 201 });

    } catch (err: any) {
        console.error("Create Workspace error:", err);
        return NextResponse.json({
            success: false,
            error: "An unexpected error occurred while creating workspace"
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

        const workspaces = await WorkspaceModel.find({ ownerId: session.user.id }).sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            message: "Workspaces retrieved successfully",
            data: workspaces
        }, { status: 200 });

    } catch (err: any) {
        console.error("Get Workspaces error:", err);
        return NextResponse.json({
            success: false,
            error: "An unexpected error occurred while retrieving workspaces"
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
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({
                success: false,
                error: "Workspace ID is required"
            }, { status: 400 });
        }

        // Verify workspace exists and belongs to the owner first
        const workspace = await WorkspaceModel.findOne({ _id: id, ownerId: session.user.id });
        if (!workspace) {
            return NextResponse.json({
                success: false,
                error: "Workspace not found"
            }, { status: 404 });
        }

        // finding all the collections associated with this account
        const collections = await CollectionModel.find({ workspaceId: id });
        const collectionIds = collections.map((col) => col._id);

        // Deleting all Requests in those collections
        if (collectionIds.length > 0) {
            await RequestModel.deleteMany({ collectionId: { $in: collectionIds } });
        }

        // Deleting all Collections inside this workspace
        await CollectionModel.deleteMany({ workspaceId: id });

        // Deleting all history logs and stats associated with this workspace
        await RequestHistoryModel.deleteMany({ workspaceId: id });
        await WorkspaceStatsModel.deleteMany({ workspaceId: id });

        // Deleting the workspace itself
        await WorkspaceModel.deleteOne({ _id: id });

        return NextResponse.json({
            success: true,
            message: "Workspace and all associated collections and requests deleted successfully."
        }, { status: 200 });

    } catch (err: any) {
        console.error("Workspace delete error:", err);
        return NextResponse.json({
            success: false,
            error: "An unexpected error occurred while deleting workspace"
        }, { status: 500 });
    }
}