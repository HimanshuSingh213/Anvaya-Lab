import mongoose, { Schema, model, models } from "mongoose";

export interface WorkspaceStats {
    workspaceId: mongoose.Types.ObjectId;
    date: string;
    totalRequests: number;
    totalLatency: number;
    methods: {
        GET: number;
        POST: number;
        PUT: number;
        DELETE: number;
        PATCH: number;
    };
    statusCodes: {
        "2xx": number;
        "3xx": number;
        "4xx": number;
        "5xx": number;
    };
}

const WorkspaceStatsSchema = new Schema<WorkspaceStats>({
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    date: { type: String, required: true }, 
    totalRequests: { type: Number, default: 0 },
    totalLatency: { type: Number, default: 0 },
    methods: {
        GET: { type: Number, default: 0 },
        POST: { type: Number, default: 0 },
        PUT: { type: Number, default: 0 },
        DELETE: { type: Number, default: 0 },
        PATCH: { type: Number, default: 0 }
    },
    statusCodes: {
        "2xx": { type: Number, default: 0 },
        "3xx": { type: Number, default: 0 },
        "4xx": { type: Number, default: 0 },
        "5xx": { type: Number, default: 0 }
    }
}, { timestamps: true });

// compound index to ensure one document per day per workspace
WorkspaceStatsSchema.index({ workspaceId: 1, date: 1 }, { unique: true });

const WorkspaceStatsModel = models.WorkspaceStats as mongoose.Model<WorkspaceStats> || model<WorkspaceStats>("WorkspaceStats", WorkspaceStatsSchema);

export default WorkspaceStatsModel;