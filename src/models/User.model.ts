import mongoose, { Schema, model, models } from "mongoose";

interface User {
    name: string;
    email: string;
    passwordHash: string | null;
    avatar: string | null;
    provider: "google" | "github" | "email";
    isEmailVerified: boolean
}

const UserSchema: Schema<User> = new Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        unique: true,
        lowercase: true
    },
    passwordHash: {
        type: String,
        default: null
    },
    avatar: {
        type: String,
        default: null
    },
    provider: {
        type: String,
        enum: ["google", "github", "email"],
        required: true
    },
    isEmailVerified: {
        type: Boolean,
        required: true,
        default: false
    }

}, {timestamps: true})

const UserModel = models.User as mongoose.Model<User> || model<User>("User", UserSchema)

export default UserModel