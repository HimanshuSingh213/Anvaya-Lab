import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { requestSchema } from "@/validations/request.validation";
import RequestModel from "@/models/Request.model";
import CollectionModel from "@/models/Collection.model";
import WorkspaceModel from "@/models/Workspace.model";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/types/ApiResponse";

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({
                success: false,
                error: "Unauthorized"
            }, { status: 401 });
        }

        const searchParams = req.nextUrl.searchParams;
        const collectionId = searchParams.get("collectionId");

        if (!collectionId) {
            return NextResponse.json({
                success: false,
                error: "Collection ID is required"
            }, { status: 400 });
        }

        // Verify collection ownership
        const collection = await CollectionModel.findById(collectionId);
        if (!collection) {
            return NextResponse.json({
                success: false,
                error: "Collection not found"
            }, { status: 404 });
        }

        const workspace = await WorkspaceModel.findOne({ _id: collection.workspaceId, ownerId: session.user.id });
        if (!workspace) {
            return NextResponse.json({
                success: false,
                error: "Unauthorized access to this collection"
            }, { status: 403 });
        }

        const requests = await RequestModel.find({ collectionId });

        return NextResponse.json({
            success: true,
            message: "Requests retrieved successfully",
            data: requests
        }, { status: 200 });

    } catch (err: any) {
        console.error("Get Requests error:", err);
        return NextResponse.json({
            success: false,
            error: err.message || "An unexpected error occurred while retrieving requests"
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
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
        const validationResult = requestSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json({
                success: false,
                error: validationResult.error.issues[0]?.message || "Invalid input format"
            }, { status: 400 });
        }

        const requestData = validationResult.data;

        // Verify collection ownership (Collection -> Workspace -> User)
        const collection = await CollectionModel.findById(requestData.collectionId);
        if (!collection) {
            return NextResponse.json({
                success: false,
                error: "Collection not found"
            }, { status: 404 });
        }

        const workspace = await WorkspaceModel.findOne({ _id: collection.workspaceId, ownerId: session.user.id });
        if (!workspace) {
            return NextResponse.json({
                success: false,
                error: "Unauthorized access to this collection"
            }, { status: 403 });
        }

        const newRequest = await RequestModel.create(requestData);

        return NextResponse.json({
            success: true,
            message: "Request created successfully",
            data: newRequest
        }, { status: 201 });

    } catch (err: any) {
        console.error("Create Request error:", err);
        return NextResponse.json({
            success: false,
            error: err.message || "An unexpected error occurred while creating request"
        }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest): Promise<NextResponse<ApiResponse>> {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({
                success: false,
                error: "Unauthorized"
            }, { status: 401 });
        }

        const searchParams = req.nextUrl.searchParams;
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({
                success: false,
                error: "Request ID is required"
            }, { status: 400 });
        }

        // Finding the existing request
        const existingRequest = await RequestModel.findById(id);
        if (!existingRequest) {
            return NextResponse.json({
                success: false,
                error: "Request not found"
            }, { status: 404 });
        }

        // Verify ownership (Request -> Collection -> Workspace -> User)
        const collection = await CollectionModel.findById(existingRequest.collectionId);
        if (!collection) {
            return NextResponse.json({
                success: false,
                error: "Associated collection not found"
            }, { status: 404 });
        }

        const workspace = await WorkspaceModel.findOne({ _id: collection.workspaceId, ownerId: session.user.id });
        if (!workspace) {
            return NextResponse.json({
                success: false,
                error: "Unauthorized access to this request"
            }, { status: 403 });
        }

        const body = await req.json();
        
        // Zod validation for optional update
        const updateSchema = requestSchema.partial();
        const validationResult = updateSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json({
                success: false,
                error: validationResult.error.issues[0]?.message || "Invalid input format"
            }, { status: 400 });
        }

        const updatedRequest = await RequestModel.findByIdAndUpdate(
            id,
            { $set: validationResult.data },
            { new: true }
        );

        return NextResponse.json({
            success: true,
            message: "Request updated successfully",
            data: updatedRequest
        }, { status: 200 });

    } catch (err: any) {
        console.error("Update Request error:", err);
        return NextResponse.json({
            success: false,
            error: err.message || "An unexpected error occurred while updating request"
        }, { status: 500 });
    }
}

// DELETE: Delete a Request
export async function DELETE(req: NextRequest): Promise<NextResponse<ApiResponse>> {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({
                success: false,
                error: "Unauthorized"
            }, { status: 401 });
        }

        const searchParams = req.nextUrl.searchParams;
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({
                success: false,
                error: "Request ID is required"
            }, { status: 400 });
        }

        // Find Request to verify ownership
        const existingRequest = await RequestModel.findById(id);
        if (!existingRequest) {
            return NextResponse.json({
                success: false,
                error: "Request not found"
            }, { status: 404 });
        }

        const collection = await CollectionModel.findById(existingRequest.collectionId);
        if (!collection) {
            return NextResponse.json({
                success: false,
                error: "Associated collection not found"
            }, { status: 404 });
        }

        const workspace = await WorkspaceModel.findOne({ _id: collection.workspaceId, ownerId: session.user.id });
        if (!workspace) {
            return NextResponse.json({
                success: false,
                error: "Unauthorized access to this request"
            }, { status: 403 });
        }

        await RequestModel.deleteOne({ _id: id });

        return NextResponse.json({
            success: true,
            message: "Request deleted successfully"
        }, { status: 200 });

    } catch (err: any) {
        console.error("Delete Request error:", err);
        return NextResponse.json({
            success: false,
            error: err.message || "An unexpected error occurred while deleting request"
        }, { status: 500 });
    }
}
