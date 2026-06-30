import mongoose, { Schema, model, models } from "mongoose";

export interface Collection {
    name: string;
    workspaceId: mongoose.Types.ObjectId
}

const CollectionSchema: Schema<Collection> = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workspace",
        required: true
    }
}, { timestamps: true })

const CollectionModel = models.Collection as mongoose.Model<Collection> || model<Collection>("Collection", CollectionSchema)

export default CollectionModel