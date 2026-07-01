import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User.model";
import { verifyCodeModel } from "@/models/verifyCode.model";
import { signUpSchema } from "@/validations/auth.validation";
import SendVerificationEmail from "@/helpers/SendVerificationEmail";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { ApiResponse } from "@/types/ApiResponse";

export async function POST(req: Request): Promise<NextResponse<ApiResponse>> {
    try {
        const body = await req.json();

        const validationResult = signUpSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json({
                success: false,
                error: validationResult.error.issues[0]?.message || "Invalid input format"
            }, { status: 400 });
        }

        const { email, name, password } = validationResult.data;

        await dbConnect();

        const existingUser = await UserModel.findOne({ email });

        // Generating a 6-digit verification code
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expires in 15 mins

        if (existingUser) {
            if (existingUser.isEmailVerified) {
                return NextResponse.json({
                    success: false,
                    error: "Email is already registered and verified. Please login."
                }, { status: 400 });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            existingUser.name = name;
            existingUser.passwordHash = hashedPassword;
            await existingUser.save();

            await verifyCodeModel.findOneAndUpdate(
                { email, purpose: "verify-email" },
                {
                    verifyCode: otp,
                    expiresAt,
                    attempts: 0
                },
                { upsert: true, new: true }
            );

            // Send verification email
            const emailResult = await SendVerificationEmail(name, email, otp);
            if (!emailResult.success) {
                return NextResponse.json({
                    success: false,
                    error: emailResult.error || "Failed to send verification email"
                }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: "User already exists but is unverified. A new verification code has been sent."
            }, { status: 200 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new UserModel({
            name,
            email,
            passwordHash: hashedPassword,
            provider: "email",
            isEmailVerified: false
        });

        await newUser.save();

        // Save verification code
        await verifyCodeModel.create({
            email,
            verifyCode: otp,
            purpose: "verify-email",
            expiresAt,
            attempts: 0
        });

        // Send verification email
        const emailResult = await SendVerificationEmail(name, email, otp);
        if (!emailResult.success) {
            return NextResponse.json({
                success: false,
                error: emailResult.error || "Failed to send verification email"
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "User registered successfully. Verification code sent."
        }, { status: 201 });

    } catch (err: any) {
        console.error("Signup error:", err);
        return NextResponse.json({
            success: false,
            error: err.message || "An unexpected error occurred during signup."
        }, { status: 500 });
    }
}
