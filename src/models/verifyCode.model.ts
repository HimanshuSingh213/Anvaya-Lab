import mongoose, { Schema, model, models } from "mongoose";

export interface verifyCode {
    email: string;
    verifyCode: string; 
    purpose: "verify-email" | "forgot-password";
    expiresAt: Date;
    attempts: number;
    createdAt: Date;
}

const verifyCodeSchema = new Schema<verifyCode>(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },

        verifyCode: {
            type: String,
            required: true,
        },

        purpose: {
            type: String,
            enum: ["verify-email", "forgot-password"],
            required: true,
        },

        expiresAt: {
            type: Date,
            required: true,
        },

        attempts: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false,
        },
    }
);

verifyCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const verifyCodeModel = models.verifyCode as mongoose.Model<verifyCode> || model<verifyCode>("verifyCode", verifyCodeSchema)