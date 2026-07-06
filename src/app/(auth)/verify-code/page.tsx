"use client";

import { useEffect, useRef, useState } from "react";
import { motion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Mail, RotateCcw, ArrowLeft, ShieldCheck } from "lucide-react";
import axios, { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { ApiResponse } from "@/types/ApiResponse";

const containerVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 260, damping: 22 },
    },
};

function OtpSlot({
    value,
    isFocused,
    isError,
    isSuccess,
}: {
    value: string;
    isFocused: boolean;
    isError: boolean;
    isSuccess: boolean;
}) {
    return (
        <motion.div
            animate={
                isError
                    ? { x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.4 } }
                    : {}
            }
            className={[
                "relative w-12 h-14 flex items-center justify-center pointer-events-none",
                "rounded-xl border text-2xl font-bold transition-all duration-200 select-none",
                isSuccess
                    ? "border-success bg-success/5 text-success"
                    : isError
                        ? "border-danger bg-danger/5 text-danger"
                        : isFocused
                            ? "border-accent bg-accent/5 text-foreground shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
                            : value
                                ? "border-border-hover bg-surface-secondary text-foreground"
                                : "border-border bg-surface text-foreground",
            ].join(" ")}
        >
            {isFocused && !value && (
                <motion.div
                    className="w-px h-6 bg-accent absolute"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                />
            )}
            {value}
            {(isFocused || value) && !isError && !isSuccess && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-accent" />
            )}
        </motion.div>
    );
}

export default function VerifyCodePage() {
    const router = useRouter();
    const [email, setEmail] = useState<string>("");

    const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
    const [focusedIndex, setFocusedIndex] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
    const [resendCooldown, setResendCooldown] = useState(0);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        const storedEmail = localStorage.getItem("verify_email");
        if (!storedEmail) {
            router.replace("/sign-in");
        } else {
            setEmail(storedEmail);
        }
    }, [router]);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const id = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
        return () => clearTimeout(id);
    }, [resendCooldown]);

    useEffect(() => {
        if (otp.every((d) => d !== "") && status === "idle") {
            handleVerify(otp.join(""));
        }
    }, [otp]);

    const focusSlot = (i: number) => {
        const idx = Math.max(0, Math.min(5, i));
        setFocusedIndex(idx);
        inputRefs.current[idx]?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
        if (e.key === "Backspace") {
            if (otp[idx]) {
                const next = [...otp];
                next[idx] = "";
                setOtp(next);
                setStatus("idle");
            } else if (idx > 0) {
                const next = [...otp];
                next[idx - 1] = "";
                setOtp(next);
                setStatus("idle");
                focusSlot(idx - 1);
            }
        } else if (e.key === "ArrowLeft") {
            focusSlot(idx - 1);
        } else if (e.key === "ArrowRight") {
            focusSlot(idx + 1);
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
        const raw = e.target.value.replace(/\D/g, "").slice(-1);
        if (!raw) return;

        const next = [...otp];
        next[idx] = raw;
        setOtp(next);
        setStatus("idle");

        if (idx < 5) focusSlot(idx + 1);
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!pasted) return;
        const next = Array(6).fill("");
        pasted.split("").forEach((ch, i) => { next[i] = ch; });
        setOtp(next);
        setStatus("idle");
        focusSlot(Math.min(pasted.length, 5));
    };

    const handleVerify = async (code: string) => {
        if (isLoading || !email) return;
        setIsLoading(true);
        setStatus("idle");

        try {
            const res = await axios.post<ApiResponse>("/api/verify", { email, code });
            if (res.data.success) {
                setStatus("success");
                toast.success("Email verified!", {
                    description: "Redirecting you to sign in…",
                });
                localStorage.removeItem("verify_email");
                setTimeout(() => router.replace("/sign-in"), 1800);
            }
        } catch (err) {
            const axErr = err as AxiosError<ApiResponse>;
            const msg = axErr.response?.data?.error || "Verification failed. Please try again.";
            setStatus("error");
            toast.error("Verification failed", { description: msg });
            setTimeout(() => {
                setOtp(Array(6).fill(""));
                setStatus("idle");
                focusSlot(0);
            }, 1200);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (isResending || resendCooldown > 0 || !email) return;
        setIsResending(true);
        try {
            await axios.post<ApiResponse>("/api/signup", {
                email,
                _resendOnly: true,
            });
            toast.success("New code sent!", { description: `Check ${email}` });
            setResendCooldown(60);
        } catch {
            toast.error("Couldn't resend code", {
                description: "Please try again in a moment.",
            });
        } finally {
            setIsResending(false);
        }
    };

    const code = otp.join("");
    const isComplete = code.length === 6;

    return (
        <div className="min-h-screen w-full bg-background flex items-center justify-center p-4 relative overflow-hidden">
            <div
                className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none"
                style={{ background: "color-mix(in srgb, var(--color-accent) 6%, transparent)" }}
            />
            <div
                className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-[100px] pointer-events-none"
                style={{ background: "color-mix(in srgb, var(--color-brand-purple) 5%, transparent)" }}
            />

            <Link
                href="/sign-up"
                className="absolute top-6 left-6 flex items-center gap-1.5 text-foreground-disabled hover:text-foreground-muted text-sm transition-colors group"
            >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                Back to sign up
            </Link>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="w-full max-w-md"
            >
                <motion.div variants={itemVariants} className="flex items-center justify-center gap-3 mb-10">
                    <Image
                        src="/logo.png"
                        width={36}
                        height={36}
                        alt="AnvayaLab logo"
                        className="w-9 h-9 object-contain"
                    />
                    <span className="text-foreground font-bold text-lg tracking-tight">AnvayaLab</span>
                </motion.div>

                <motion.div variants={itemVariants} className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface border border-border mb-5 relative">
                        <Mail className="h-7 w-7 text-accent" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                            <span className="w-1.5 h-1.5 bg-white rounded-full" />
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">
                        Check your inbox
                    </h1>
                    <p className="text-sm text-foreground-disabled leading-relaxed">
                        We sent a 6-digit verification code to
                    </p>
                    <p className="text-sm font-medium text-foreground-muted mt-0.5 truncate max-w-xs mx-auto">
                        {email}
                    </p>
                </motion.div>

                <motion.div variants={itemVariants} className="mb-6">
                    <p className="text-xs font-semibold text-foreground-disabled uppercase tracking-widest text-center mb-4">
                        Enter verification code
                    </p>

                    <div className="flex items-center justify-center gap-3" onPaste={handlePaste}>
                        {Array(6)
                            .fill(null)
                            .map((_, i) => (
                                <div
                                    key={i}
                                    className="relative cursor-text"
                                    onClick={() => focusSlot(i)}
                                >
                                    <input
                                        ref={(el) => { inputRefs.current[i] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={otp[i]}
                                        disabled={isLoading || status === "success"}
                                        onFocus={() => setFocusedIndex(i)}
                                        onBlur={() => setFocusedIndex(-1)}
                                        onChange={(e) => handleInput(e, i)}
                                        onKeyDown={(e) => handleKeyDown(e, i)}
                                        className="absolute inset-0 opacity-0 cursor-text"
                                        aria-label={`Digit ${i + 1}`}
                                        autoComplete="one-time-code"
                                    />
                                    <OtpSlot
                                        value={otp[i]}
                                        isFocused={focusedIndex === i}
                                        isError={status === "error"}
                                        isSuccess={status === "success"}
                                    />
                                </div>
                            ))}
                    </div>

                    <p className="text-center text-xs text-foreground-disabled mt-4">
                        You can also{" "}
                        <span className="text-foreground-muted">paste</span> the code directly
                    </p>
                </motion.div>

                <motion.div variants={itemVariants} className="mb-5">
                    <Button
                        onClick={() => handleVerify(code)}
                        disabled={!isComplete || isLoading || status === "success"}
                        className="w-full h-11 bg-accent! hover:bg-accent-hover! text-white! font-semibold rounded-xl transition-all disabled:opacity-40"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : status === "success" ? (
                            <ShieldCheck className="h-4 w-4 mr-2" />
                        ) : null}
                        {status === "success"
                            ? "Verified — redirecting…"
                            : isLoading
                                ? "Verifying…"
                                : "Verify Email"}
                    </Button>
                </motion.div>

                <motion.div variants={itemVariants} className="text-center">
                    <p className="text-sm text-foreground-disabled mb-1">Didn&apos;t receive the code?</p>
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={isResending || resendCooldown > 0}
                        className="inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed group"
                    >
                        <RotateCcw
                            className={[
                                "h-3.5 w-3.5 group-hover:-rotate-180 transition-transform duration-500",
                                isResending ? "animate-spin" : "",
                            ].join(" ")}
                        />
                        {resendCooldown > 0
                            ? `Resend in ${resendCooldown}s`
                            : isResending
                                ? "Sending…"
                                : "Resend code"}
                    </button>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="mt-12 flex flex-col gap-1.5 opacity-20"
                >
                    <div className="h-[3px] rounded-full bg-brand-cyan w-[40%]" />
                    <div className="h-[3px] rounded-full bg-brand-orange w-[60%]" />
                    <div className="h-[3px] rounded-full bg-brand-purple w-[50%]" />
                    <div className="h-[3px] rounded-full bg-brand-blue w-[30%]" />
                </motion.div>
            </motion.div>
        </div>
    );
}
