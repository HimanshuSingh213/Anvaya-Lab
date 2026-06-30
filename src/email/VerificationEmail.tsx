import * as React from "react";

interface VerificationEmailProps {
    userName: string;
    otp: string;
    expiresInMinutes?: number;
}

export function VerificationEmail({
    userName,
    otp,
    expiresInMinutes = 15,
}: VerificationEmailProps) {
    const otpDigits = otp.split("");

    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Verify your email – Anvaya Lab</title>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

                    * { margin: 0; padding: 0; box-sizing: border-box; }

                    body {
                        background-color: #09090b;
                        font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
                        -webkit-font-smoothing: antialiased;
                    }

                    .wrapper {
                        background-color: #09090b;
                        padding: 40px 20px;
                        min-height: 100vh;
                    }

                    .card {
                        max-width: 560px;
                        margin: 0 auto;
                        background-color: #111113;
                        border: 1px solid #27272a;
                        border-radius: 16px;
                        overflow: hidden;
                    }

                    /* ── Header ── */
                    .header {
                        background: linear-gradient(135deg, #111113 0%, #18181b 60%, #1e1e2e 100%);
                        padding: 36px 40px 28px;
                        border-bottom: 1px solid #27272a;
                        text-align: center;
                        position: relative;
                    }

                    .header::before {
                        content: '';
                        position: absolute;
                        top: 0; left: 0; right: 0;
                        height: 3px;
                        background: linear-gradient(90deg, #2563eb 0%, #7c3aed 50%, #2563eb 100%);
                    }

                    .logo-row {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 12px;
                        margin-bottom: 8px;
                    }

                    /* Inline SVG logo replicating the AL mark */
                    .logo-svg {
                        width: 44px;
                        height: 44px;
                        flex-shrink: 0;
                    }

                    .brand-name {
                        font-size: 22px;
                        font-weight: 800;
                        letter-spacing: -0.5px;
                        color: #fafafa;
                    }

                    .brand-name span {
                        background: linear-gradient(135deg, #6ea8fe 0%, #7c3aed 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }

                    .header-sub {
                        font-size: 12px;
                        color: #52525b;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                        font-weight: 500;
                        margin-top: 4px;
                    }

                    /* ── Body ── */
                    .body {
                        padding: 36px 40px;
                    }

                    .greeting {
                        font-size: 15px;
                        font-weight: 500;
                        color: #71717a;
                        margin-bottom: 8px;
                    }

                    .name-badge {
                        display: inline-block;
                        font-size: 26px;
                        font-weight: 800;
                        color: #fafafa;
                        letter-spacing: -0.5px;
                        margin-bottom: 20px;
                        padding: 6px 16px 6px 0;
                        border-left: 3px solid #2563eb;
                        padding-left: 14px;
                        background: linear-gradient(90deg, rgba(37,99,235,0.08) 0%, transparent 100%);
                        border-radius: 0 6px 6px 0;
                    }

                    .description {
                        font-size: 14px;
                        color: #a1a1aa;
                        line-height: 1.7;
                        margin-bottom: 32px;
                    }

                    /* ── OTP Block ── */
                    .otp-label {
                        font-size: 11px;
                        font-weight: 600;
                        color: #52525b;
                        text-transform: uppercase;
                        letter-spacing: 0.1em;
                        margin-bottom: 12px;
                    }

                    .otp-container {
                        display: flex;
                        gap: 8px;
                        justify-content: center;
                        margin-bottom: 12px;
                    }

                    .otp-digit {
                        width: 52px;
                        height: 60px;
                        background-color: #18181b;
                        border: 1px solid #27272a;
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 26px;
                        font-weight: 800;
                        color: #6ea8fe;
                        font-family: 'Inter', ui-monospace, monospace;
                        position: relative;
                    }

                    .otp-digit::after {
                        content: '';
                        position: absolute;
                        bottom: 0; left: 10%; right: 10%;
                        height: 2px;
                        background: linear-gradient(90deg, #2563eb, #7c3aed);
                        border-radius: 999px;
                    }

                    .otp-expiry {
                        font-size: 12px;
                        color: #52525b;
                        text-align: center;
                        margin-bottom: 32px;
                    }

                    .otp-expiry span {
                        color: #f59e0b;
                        font-weight: 600;
                    }

                    /* ── Info Box ── */
                    .info-box {
                        background-color: #18181b;
                        border: 1px solid #27272a;
                        border-left: 3px solid #2563eb;
                        border-radius: 8px;
                        padding: 14px 16px;
                        margin-bottom: 28px;
                    }

                    .info-box p {
                        font-size: 13px;
                        color: #71717a;
                        line-height: 1.6;
                    }

                    .info-box p strong {
                        color: #a1a1aa;
                    }

                    /* ── Divider ── */
                    .divider {
                        border: none;
                        border-top: 1px solid #27272a;
                        margin: 0 -40px 28px;
                    }

                    /* ── Code decorative lines ── */
                    .code-lines {
                        display: flex;
                        flex-direction: column;
                        gap: 6px;
                        margin-bottom: 28px;
                        opacity: 0.4;
                    }

                    .code-line {
                        height: 4px;
                        border-radius: 999px;
                    }

                    /* ── Footer ── */
                    .footer {
                        background-color: #0d0d0f;
                        border-top: 1px solid #27272a;
                        padding: 24px 40px;
                        text-align: center;
                    }

                    .footer p {
                        font-size: 12px;
                        color: #3f3f46;
                        line-height: 1.6;
                        margin-bottom: 4px;
                    }

                    .footer .creator {
                        font-size: 10px;
                        color: #27272a;
                        margin-top: 12px;
                        font-style: italic;
                        letter-spacing: 0.02em;
                    }
                `}</style>
            </head>
            <body>
                <div className="wrapper">
                    <div className="card">

                        {/* ── Header ── */}
                        <div className="header">
                            <div className="logo-row">
                                {/* Inline SVG replicating the AL logo mark */}
                                <svg className="logo-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <linearGradient id="aGrad" x1="20" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
                                            <stop offset="0%" stopColor="#e2e8f0" />
                                            <stop offset="100%" stopColor="#94a3b8" />
                                        </linearGradient>
                                        <linearGradient id="lGrad" x1="60" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                                            <stop offset="0%" stopColor="#818cf8" />
                                            <stop offset="100%" stopColor="#6366f1" />
                                        </linearGradient>
                                    </defs>
                                    {/* A letter */}
                                    <path d="M10 78 L38 22 L50 47 L38 47" stroke="url(#aGrad)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                    <path d="M50 47 L62 22 L50 47" stroke="url(#aGrad)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                    {/* Code dash lines inside A */}
                                    <rect x="34" y="52" width="8" height="4" rx="2" fill="#06b6d4" />
                                    <rect x="44" y="52" width="12" height="4" rx="2" fill="#f59e0b" />
                                    <rect x="32" y="59" width="10" height="4" rx="2" fill="#94a3b8" />
                                    <rect x="44" y="59" width="8" height="4" rx="2" fill="#6366f1" />
                                    <rect x="30" y="66" width="18" height="4" rx="2" fill="#64748b" />
                                    {/* L letter */}
                                    <path d="M64 22 L64 72 Q64 78 70 78 L88 78" stroke="url(#lGrad)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                </svg>

                                <div>
                                    <div className="brand-name">
                                        Anvaya<span>Lab</span>
                                    </div>
                                </div>
                            </div>
                            <div className="header-sub">Email Verification</div>
                        </div>

                        {/* ── Body ── */}
                        <div className="body">

                            <p className="greeting">Hey there 👋</p>
                            <div className="name-badge">{userName}</div>

                            <p className="description">
                                Welcome to Anvaya Lab — your intelligent API workspace. To activate your
                                account and get access to your workspace, please verify your email address
                                using the one-time code below.
                            </p>

                            <p className="otp-label">Your verification code</p>

                            <div className="otp-container">
                                {otpDigits.map((digit, i) => (
                                    <div key={i} className="otp-digit">{digit}</div>
                                ))}
                            </div>

                            <p className="otp-expiry">
                                This code expires in <span>{expiresInMinutes} minutes</span>. Do not share it with anyone.
                            </p>

                            {/* Decorative code lines — mirroring logo aesthetic */}
                            <div className="code-lines">
                                <div className="code-line" style={{ width: "45%", background: "#06b6d4" }} />
                                <div className="code-line" style={{ width: "65%", background: "#f59e0b" }} />
                                <div className="code-line" style={{ width: "55%", background: "#6366f1" }} />
                                <div className="code-line" style={{ width: "35%", background: "#64748b" }} />
                            </div>

                            <hr className="divider" />

                            <div className="info-box">
                                <p>
                                    <strong>Didn&apos;t request this?</strong> If you didn&apos;t sign up for
                                    Anvaya Lab, you can safely ignore this email. Your account will not be
                                    created unless the code is verified.
                                </p>
                            </div>

                        </div>

                        {/* ── Footer ── */}
                        <div className="footer">
                            <p>© {new Date().getFullYear()} Anvaya Lab. All rights reserved.</p>
                            <p>This is an automated message. Please do not reply to this email.</p>
                            <p className="creator">created by himanshu singh dangi</p>
                        </div>

                    </div>
                </div>
            </body>
        </html>
    );
}

export default VerificationEmail;
