import mongoose, { Schema, model, models } from "mongoose";

export interface RequestHistory {
    userId: mongoose.Types.ObjectId;
    workspaceId: mongoose.Types.ObjectId;
    method: string;
    url: string;
    headers: string;
    body: string;
    status: number;
    responseTime: number;
    responseSize: number;
    response: string;
    createdAt: Date;
    updatedAt: Date;
}

const RequestHistorySchema: Schema<RequestHistory> = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workspace",
        required: true
    },
    method: {
        type: String,
        required: [true, "HTTP Method is required"],
        trim: true,
        uppercase: true
    },
    url: {
        type: String,
        required: [true, "Request URL is required"],
        trim: true
    },
    headers: {
        type: String,
        default: "{}"
    },
    body: {
        type: String,
        default: ""
    },
    status: {
        type: Number,
        required: [true, "Response HTTP status code is required"]
    },
    responseTime: {
        type: Number,
        required: [true, "Response latency is required"]
    },
    responseSize: {
        type: Number,
        default: 0
    },
    response: {
        type: String,
        default: ""
    }
}, { timestamps: true });

const RequestHistoryModel = models.RequestHistory as mongoose.Model<RequestHistory> || model<RequestHistory>("RequestHistory", RequestHistorySchema);

export default RequestHistoryModel;
