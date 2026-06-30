import mongoose, { Schema, model, models } from "mongoose";

export interface Workspace {
    name: string;
    ownerId: mongoose.Types.ObjectId
}

const WorkspaceSchema: Schema<Workspace> = new Schema({
    name: {
        type: String,
        required: [true, "Workspace name is required"],
        trim: true,
        maxlength: 100,
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true })

const WorkspaceModel = models.Workspace as mongoose.Model<Workspace> || model<Workspace>("Workspace", WorkspaceSchema)

export default WorkspaceModel