import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User.model";
import { verifyCodeModel } from "@/models/verifyCode.model";
import { ApiResponse } from "@/types/ApiResponse";
import { verifySchema } from "@/validations/auth.validation";
import { NextResponse } from "next/server";

export async function POST(req: Request): Promise<NextResponse<ApiResponse>> {
    try {
        const { code, email } = await req.json();

        const validationResult = verifySchema.safeParse({ code });

        if (!validationResult.success) {
            return NextResponse.json({
                success: false,
                error: validationResult.error.issues[0]?.message || "Invalid OTP format"
            }, { status: 400 });
        }

        const validatedVerifyCode = validationResult.data.code;

        await dbConnect();

        const isOtpExists = await verifyCodeModel.findOne({ email, purpose: "verify-email" });

        if (!isOtpExists) {
            return NextResponse.json({
                success: false,
                error: "Verification code does not exist"
            }, { status: 404 });
        }

        const isOtpValid = isOtpExists.verifyCode === validatedVerifyCode;
        const isCodeNotExpired = new Date(isOtpExists.expiresAt) > new Date();

        if (!isOtpValid) {
            return NextResponse.json({
                success: false,
                error: "Verification code is incorrect"
            }, { status: 400 });
        }

        if (!isCodeNotExpired) {
            return NextResponse.json({
                success: false,
                error: "Verification code has expired, please try again"
            }, { status: 400 });
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return NextResponse.json({
                success: false,
                error: `User linked to this ${email} not found`
            }, { status: 404 });
        }

        user.isEmailVerified = true;
        await user.save();

        await verifyCodeModel.deleteOne({ _id: isOtpExists._id });

        return NextResponse.json({
            success: true,
            message: "Email verified successfully"
        }, { status: 200 });

    } catch (err: any) {
        console.error("Verification error:", err);
        return NextResponse.json({
            success: false,
            error: err.message || "Error verifying user"
        }, { status: 500 });
    }
}