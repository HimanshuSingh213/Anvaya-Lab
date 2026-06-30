import VerificationEmail from "@/email/VerificationEmail";
import { resend } from "@/lib/resend";
import { ApiResponse } from "@/types/ApiResponse";

export default async function SendVerificationEmail(
    name: string,
    email: string,
    verifyCode: string
): Promise<ApiResponse> {
    try {
        await resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Anvaya Lab | Email Verification",
            react: <VerificationEmail userName={name} otp={verifyCode} />
        });

        return { success: true, message: "Verification email sent successfully" };

    } catch (err: any) {
        console.error("SendVerificationEmail error:", err);
        return { success: false, error: err?.message || "Failed to send verification email" };
    }
}