import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import UserModel from "@/models/User.model";
import WorkspaceModel from "@/models/Workspace.model";
import CollectionModel from "@/models/Collection.model";
import RequestModel from "@/models/Request.model";
import RequestHistoryModel from "@/models/RequestHistory.model";
import WorkspaceStatsModel from "@/models/WorkspaceStats.model";
import { verifyCodeModel } from "@/models/verifyCode.model";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({
                success: false,
                error: "Unauthorized"
            }, { status: 401 });
        }

        const userId = session.user.id;
        const userEmail = session.user.email;

        // Finding all workspaces owned by the user
        const workspaces = await WorkspaceModel.find({ ownerId: userId });
        const workspaceIds = workspaces.map(ws => ws._id);

        // Finding all collections belonging to those workspaces
        const collections = await CollectionModel.find({ workspaceId: { $in: workspaceIds } });
        const collectionIds = collections.map(col => col._id);

        // Deleting all Requests in those collections
        if (collectionIds.length > 0) {
            await RequestModel.deleteMany({ collectionId: { $in: collectionIds } });
        }

        // Deleting all Collections in those workspaces
        if (workspaceIds.length > 0) {
            await CollectionModel.deleteMany({ workspaceId: { $in: workspaceIds } });
        }

        // Deleting all Request History records for this user
        await RequestHistoryModel.deleteMany({ userId: userId });

        // Deleting all Stats records for these workspaces
        if (workspaceIds.length > 0) {
            await WorkspaceStatsModel.deleteMany({ workspaceId: { $in: workspaceIds } });
        }

        // Deleting all Workspaces owned by the user
        await WorkspaceModel.deleteMany({ ownerId: userId });

        // Deleting all verification codes matching the user's email
        if (userEmail) {
            await verifyCodeModel.deleteMany({ email: userEmail });
        }

        // Deleting the User record itself
        await UserModel.deleteOne({ _id: userId });

        return NextResponse.json({
            success: true,
            message: "User account and all associated data deleted successfully."
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error deleting user account:", error);
        return NextResponse.json({
            success: false,
            error: "Internal Server Error",
            details: error.message
        }, { status: 500 });
    }
}
