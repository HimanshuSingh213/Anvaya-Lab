import nodemailer from "nodemailer";
import { getVerificationEmailHtml } from "@/email/VerificationEmail";
import { ApiResponse } from "@/types/ApiResponse";

// Create Nodemailer SMTP transporter using Gmail credentials
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
});

export default async function SendVerificationEmail(
    name: string,
    email: string,
    verifyCode: string
): Promise<ApiResponse> {
    try {
        // Log the code to console for easy local testing
        console.log(`\n🔑 [Verification Code for ${email}]: ${verifyCode}\n`);

        // Generate static HTML string directly without react-dom/server
        const html = getVerificationEmailHtml(name, verifyCode);

        // Send transactional email
        await transporter.sendMail({
            from: `"Anvaya Lab" <${process.env.SMTP_EMAIL}>`,
            to: email,
            subject: "Anvaya Lab | Email Verification",
            html: html,
        });

        return { success: true, message: "Verification email sent successfully" };

    } catch (err: any) {
        console.error("SendVerificationEmail error:", err);
        return { success: false, error: err?.message || "Failed to send verification email" };
    }
}
