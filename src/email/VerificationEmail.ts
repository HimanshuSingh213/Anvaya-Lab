export function getVerificationEmailHtml(
    userName: string,
    otp: string,
    expiresInMinutes: number = 15
): string {
    const otpDigits = otp.split("");
    const fontStack = "'Inter', system-ui, -apple-system, sans-serif";

    const otpCellsHtml = otpDigits
        .map(
            (digit) => `
            <td
                align="center"
                style="
                    width: 50px;
                    height: 56px;
                    background-color: #18181b;
                    border: 1px solid #27272a;
                    border-bottom: 2px solid #2563eb;
                    border-radius: 8px;
                    font-size: 24px;
                    font-weight: 800;
                    color: #6ea8fe;
                    font-family: monospace;
                    line-height: 56px;
                "
            >
                ${digit}
            </td>
        `
        )
        .join("");

    return `
        <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="
                background-color: #09090b;
                margin: 0;
                padding: 40px 10px;
                width: 100%;
            "
        >
            <tbody>
                <tr>
                    <td align="center">
                        <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="
                                max-width: 560px;
                                background-color: #111113;
                                border: 1px solid #27272a;
                                border-radius: 16px;
                                border-collapse: separate;
                                overflow: hidden;
                            "
                        >
                            <tbody>
                                <!-- ── Header ── -->
                                <tr>
                                    <td
                                        align="center"
                                        style="
                                            background: linear-gradient(135deg, #111113 0%, #18181b 60%, #1e1e2e 100%);
                                            padding: 36px 40px 28px;
                                            border-bottom: 1px solid #27272a;
                                        "
                                    >
                                        <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                                            <tbody>
                                                <tr>
                                                    <td style="padding-right: 12px; vertical-align: middle;">
                                                        <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <defs>
                                                                <linearGradient id="aGrad" x1="20" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
                                                                    <stop offset="0%" stop-color="#e2e8f0" />
                                                                    <stop offset="100%" stop-color="#94a3b8" />
                                                                </linearGradient>
                                                                <linearGradient id="lGrad" x1="60" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                                                                    <stop offset="0%" stop-color="#818cf8" />
                                                                    <stop offset="100%" stop-color="#6366f1" />
                                                                </linearGradient>
                                                            </defs>
                                                            <path d="M10 78 L38 22 L50 47 L38 47" stroke="url(#aGrad)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                                                            <path d="M50 47 L62 22 L50 47" stroke="url(#aGrad)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                                                            <rect x="34" y="52" width="8" height="4" rx="2" fill="#06b6d4" />
                                                            <rect x="44" y="52" width="12" height="4" rx="2" fill="#f59e0b" />
                                                            <rect x="32" y="59" width="10" height="4" rx="2" fill="#94a3b8" />
                                                            <rect x="44" y="59" width="8" height="4" rx="2" fill="#6366f1" />
                                                            <rect x="30" y="66" width="18" height="4" rx="2" fill="#64748b" />
                                                            <path d="M64 22 L64 72 Q64 78 70 78 L88 78" stroke="url(#lGrad)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                                                        </svg>
                                                    </td>
                                                    <td style="vertical-align: middle;">
                                                        <span
                                                            style="
                                                                font-family: ${fontStack};
                                                                font-size: 22px;
                                                                font-weight: 800;
                                                                letter-spacing: -0.5px;
                                                                color: #fafafa;
                                                            "
                                                        >
                                                            Anvaya<span style="color: #6ea8fe;">Lab</span>
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <div
                                            style="
                                                font-family: ${fontStack};
                                                font-size: 11px;
                                                color: #52525b;
                                                letter-spacing: 0.08em;
                                                text-transform: uppercase;
                                                font-weight: 600;
                                                margin-top: 8px;
                                            "
                                        >
                                            Email Verification
                                        </div>
                                    </td>
                                </tr>

                                <!-- ── Body ── -->
                                <tr>
                                    <td style="padding: 36px 40px;">
                                        <p style="font-family: ${fontStack}; font-size: 14px; color: #71717a; margin: 0 0 6px 0;">
                                            Hey there 
                                        </p>
                                        <div
                                            style="
                                                display: inline-block;
                                                font-family: ${fontStack};
                                                font-size: 24px;
                                                font-weight: 800;
                                                color: #fafafa;
                                                letter-spacing: -0.5px;
                                                margin: 0 0 20px 0;
                                                padding: 6px 16px 6px 14px;
                                                border-left: 3px solid #2563eb;
                                                background-color: rgba(37,99,235,0.06);
                                                border-radius: 0 6px 6px 0;
                                            "
                                        >
                                            ${userName}
                                        </div>

                                        <p style="font-family: ${fontStack}; font-size: 14px; color: #a1a1aa; line-height: 1.7; margin: 0 0 32px 0;">
                                            Welcome to Anvaya Lab — your intelligent API workspace. To activate your account and access your workspace, please verify your email address using the one-time code below.
                                        </p>

                                        <p
                                            style="
                                                font-family: ${fontStack};
                                                font-size: 11px;
                                                font-weight: 600;
                                                color: #52525b;
                                                text-transform: uppercase;
                                                letter-spacing: 0.1em;
                                                margin: 0 0 12px 0;
                                                text-align: center;
                                            "
                                        >
                                            Your verification code
                                        </p>

                                        <table align="center" cellpadding="0" cellspacing="6" border="0" style="margin: 0 auto 12px auto;">
                                            <tbody>
                                                <tr>
                                                    ${otpCellsHtml}
                                                </tr>
                                            </tbody>
                                        </table>

                                        <p style="font-family: ${fontStack}; font-size: 12px; color: #52525b; text-align: center; margin: 0 0 32px 0;">
                                            This code expires in <span style="color: #f59e0b; font-weight: 600;">${expiresInMinutes} minutes</span>. Do not share it with anyone.
                                        </p>

                                        <!-- Decorative code lines -->
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <div style="height: 3px; border-radius: 999px; background: #06b6d4; width: 45%; margin-bottom: 6px;"></div>
                                                        <div style="height: 3px; border-radius: 999px; background: #f59e0b; width: 65%; margin-bottom: 6px;"></div>
                                                        <div style="height: 3px; border-radius: 999px; background: #8b5cf6; width: 55%; margin-bottom: 6px;"></div>
                                                        <div style="height: 3px; border-radius: 999px; background: #64748b; width: 35%;"></div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        <hr style="border: none; border-top: 1px solid #27272a; margin: 0 0 28px 0;" />

                                        <!-- Info Box -->
                                        <table
                                            width="100%"
                                            cellpadding="0"
                                            cellspacing="0"
                                            border="0"
                                            style="
                                                background-color: #18181b;
                                                border: 1px solid #27272a;
                                                border-left: 3px solid #2563eb;
                                                border-radius: 8px;
                                            "
                                        >
                                            <tbody>
                                                <tr>
                                                    <td style="padding: 14px 16px;">
                                                        <p style="font-family: ${fontStack}; font-size: 13px; color: #71717a; line-height: 1.6; margin: 0;">
                                                            <strong style="color: #a1a1aa;">Didn't request this?</strong> If you didn't sign up for Anvaya Lab, you can safely ignore this email. Your account will not be created unless the code is verified.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>

                                <!-- ── Footer ── -->
                                <tr>
                                    <td
                                        align="center"
                                        style="
                                            background-color: #0d0d0f;
                                            border-top: 1px solid #27272a;
                                            padding: 24px 40px;
                                        "
                                    >
                                        <p style="font-family: ${fontStack}; font-size: 11px; color: #3f3f46; margin: 0 0 4px 0; line-height: 1.5;">
                                            © ${new Date().getFullYear()} Anvaya Lab. All rights reserved.
                                        </p>
                                        <p style="font-family: ${fontStack}; font-size: 11px; color: #3f3f46; margin: 0 0 12px 0; line-height: 1.5;">
                                            This is an automated message. Please do not reply to this email.
                                        </p>
                                        <p style="font-family: ${fontStack}; font-size: 10px; color: #27272a; font-style: italic; letter-spacing: 0.02em; margin: 0;">
                                            created by @Himanshu Singh Dangi
                                        </p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
            </tbody>
        </table>
    `;
}
