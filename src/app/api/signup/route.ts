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

        // 1. Validate request body against schema
        const validationResult = signUpSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json({
                success: false,
                error: validationResult.error.issues[0]?.message || "Invalid input format"
            }, { status: 400 });
        }

        const { email, name, password } = validationResult.data;

        // 2. Connect to the database
        await dbConnect();

        // 3. Check if user already exists
        const existingUser = await UserModel.findOne({ email });

        // Generate a 6-digit verification code
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expires in 15 mins

        if (existingUser) {
            // Case A: User exists and is verified -> Return error
            if (existingUser.isEmailVerified) {
                return NextResponse.json({
                    success: false,
                    error: "Email is already registered and verified. Please login."
                }, { status: 400 });
            }

            // Case B: User exists but is NOT verified -> Update details and generate new code
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            existingUser.name = name;
            existingUser.passwordHash = hashedPassword;
            await existingUser.save();

            // Upsert the verification code
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

        // Case C: New user -> Hash password, create user, generate code, send email
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

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
