import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { createCollectionSchema } from "@/validations/collection.validation";
import CollectionModel from "@/models/Collection.model";
import WorkspaceModel from "@/models/Workspace.model";
import RequestModel from "@/models/Request.model";
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
        const validationResult = createCollectionSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json({
                success: false,
                error: validationResult.error.issues[0]?.message || "Invalid input format"
            }, { status: 400 });
        }

        const { name, workspaceId } = validationResult.data;

        // Verify workspace ownership
        const workspace = await WorkspaceModel.findOne({ _id: workspaceId, ownerId: session.user.id });
        if (!workspace) {
            return NextResponse.json({
                success: false,
                error: "Workspace not found or unauthorized access"
            }, { status: 404 });
        }

        // Check for duplicates inside this workspace
        const existingCollection = await CollectionModel.findOne({ name, workspaceId });
        if (existingCollection) {
            return NextResponse.json({
                success: false,
                error: "Collection with this name already exists in this workspace"
            }, { status: 400 });
        }

        const newCollection = await CollectionModel.create({
            name,
            workspaceId
        });

        return NextResponse.json({
            success: true,
            message: "Collection created successfully",
            data: newCollection
        }, { status: 201 });

    } catch (err: any) {
        console.error("Create Collection error:", err);
        return NextResponse.json({
            success: false,
            error: err.message || "An unexpected error occurred while creating collection"
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

        // Verify workspace ownership
        const workspace = await WorkspaceModel.findOne({ _id: workspaceId, ownerId: session.user.id });
        if (!workspace) {
            return NextResponse.json({
                success: false,
                error: "Parent Workspace not found or unauthorized access"
            }, { status: 404 });
        }

        const collections = await CollectionModel.find({ workspaceId });

        return NextResponse.json({
            success: true,
            message: "Collections retrieved successfully",
            data: collections
        }, { status: 200 });

    } catch (err: any) {
        console.error("Get Collections error:", err);
        return NextResponse.json({
            success: false,
            error: err.message || "An unexpected error occurred while retrieving collections"
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
                error: "Collection ID is required"
            }, { status: 400 });
        }

        // Find the collection to check workspace link
        const collection = await CollectionModel.findById(id);
        if (!collection) {
            return NextResponse.json({
                success: false,
                error: "Collection not found"
            }, { status: 404 });
        }

        // Verify workspace ownership to check auth
        const workspace = await WorkspaceModel.findOne({ _id: collection.workspaceId, ownerId: session.user.id });
        if (!workspace) {
            return NextResponse.json({
                success: false,
                error: "Unauthorized access to delete this collection"
            }, { status: 403 });
        }

        // Removing all Requests inside this collection first
        await RequestModel.deleteMany({ collectionId: id });

        // Deleting the collection itself
        await CollectionModel.deleteOne({ _id: id });

        return NextResponse.json({
            success: true,
            message: "Collection and all associated requests deleted successfully"
        }, { status: 200 });

    } catch (err: any) {
        console.error("Delete Collection error:", err);
        return NextResponse.json({
            success: false,
            error: err.message || "An unexpected error occurred while deleting collection"
        }, { status: 500 });
    }
}