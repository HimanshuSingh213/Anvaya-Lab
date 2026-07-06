import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User.model";
import { verifyCodeModel } from "@/models/verifyCode.model";
import { signUpSchema } from "@/validations/auth.validation";
import SendVerificationEmail from "@/helpers/SendVerificationEmail";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { ApiResponse } from "@/types/ApiResponse";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: Request): Promise<NextResponse<ApiResponse>> {
    try {
        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
        const limitResult = rateLimit(ip, 5, 5 * 60 * 1000);
        if (!limitResult.success) {
            return NextResponse.json({
                success: false,
                error: "Too many registration attempts. Please try again later."
            }, {
                status: 429,
                headers: { "Retry-After": Math.ceil((limitResult.reset - Date.now()) / 1000).toString() }
            });
        }

        const body = await req.json();

        if(body._resendOnly && body.email){
            await dbConnect();
            const user = await UserModel.findOne({ email: body.email });

            if(!user || user.isEmailVerified){
                return NextResponse.json({
                    success: false,
                    error: "Invalid Request"
                }, {status: 400})
            }

            // Generating a 6-digit verification code
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expires in 15 mins

            await verifyCodeModel.findOneAndUpdate(
                {email: body.email, purpose: "verify-email"},
                {verifyCode: otp, expiresAt, attempts: 0},
                {upsert: true}
            )

            const emailResult = await SendVerificationEmail(user?.name, body.email, otp);
            if (!emailResult.success) {
                return NextResponse.json({
                    success: false,
                    error: emailResult.error || "Failed to send verification email"
                }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: "A new verification code has been resent."
            }, { status: 200 });

        }

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
            if (existingUser.provider === "google" || existingUser.provider === "github") {
                return NextResponse.json({
                    success: false,
                    error: `This email is already registered using ${existingUser.provider === "google" ? "Google" : "GitHub"}. Please log in using that provider.`
                }, { status: 400 });
            }

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
            error: "An unexpected error occurred during signup."
        }, { status: 500 });
    }
}
