import mongoose, { ObjectIdExpression, Schema, model } from "mongoose";

export interface VerificationToken {
    UserId: ObjectIdExpression;
    otp: string;
    ExpiresAt: Date;
}