"use client";

import { motion, Variants } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { Github, Mail, Loader2, ArrowRight, AlertTriangle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { signUpSchema } from "@/validations/auth.validation";
import { useEffect, Suspense } from "react";

type SignUpFormValues = z.infer<typeof signUpSchema>;

const formVariants: Variants = {
    hidden: { opacity: 0, x: 24 },
    show: {
        opacity: 1,
        x: 0,
        transition: { staggerChildren: 0.06, delayChildren: 0.1 },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 280, damping: 22 },
    },
};

const CODE_LINES = [
    { color: "#06b6d4", width: "52%" },
    { color: "#f59e0b", width: "68%" },
    { color: "#8b5cf6", width: "44%" },
    { color: "#3b82f6", width: "60%" },
    { color: "#3e3e4a", width: "36%" },
];

export function SignUpPageContent() {
    const router = useRouter();
    const form = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpSchema),
        mode: "onSubmit",
        reValidateMode: "onChange",
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const searchParams = useSearchParams();

    useEffect(() => {
        const error = searchParams.get("error");
        if(error){
            if(error === "AccessDenied" || error === "OAuthCallback"){
                toast.error("Sign-in Cancelled",{
                    description: "You Cancelled the authentication request.",
                });
            }
            else{
                toast.error("Auth Error", {
                    description: `Something went wrong: ${error}`,
                });
            }
        }
    }, [searchParams])

    async function onSubmit(data: SignUpFormValues) {
        try {
            const response = await axios.post("/api/signup", {
                name: data.name,
                email: data.email,
                password: data.password,
                confirmPassword: data.confirmPassword,
            });

            if (response.data.success) {
                toast.success("Verification Code Sent", {
                    description: response.data.message || "Please check your email.",
                });
                localStorage.setItem("verify_email", data.email);
                router.push("/verify-code");
            }
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.error || error.message || "Registration failed.";

            if (errorMessage.toLowerCase().includes("email is already registered")) {
                form.setError("email", { message: errorMessage });
            } else {
                toast.error("Registration Failed", { description: errorMessage });
            }
        }
    }

    return (
        <div className="min-h-screen flex bg-background select-none">

            {/* ── Left panel: branding ── */}
            <motion.div
                className="hidden lg:flex lg:w-[45%] flex-col justify-between p-10 border-r border-border relative overflow-hidden"
                initial="hidden"
                animate="show"
                variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
                }}
            >
                {/* Top-left logo mark */}
                <motion.div
                    className="flex items-center gap-3"
                    variants={{
                        hidden: { opacity: 0, y: -16 },
                        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } },
                    }}
                >
                    <Image
                        src="/logo.png"
                        width={36}
                        height={36}
                        alt="AnvayaLab logo"
                        className="w-9 h-9 object-contain"
                    />
                    <span className="text-foreground font-bold text-lg tracking-tight">AnvayaLab</span>
                </motion.div>

                {/* Center content */}
                <div className="space-y-8">
                    {/* Headline */}
                    <motion.div
                        className="space-y-4"
                        variants={{
                            hidden: { opacity: 0, y: 24 },
                            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 240, damping: 22 } },
                        }}
                    >
                        <h2 className="text-4xl font-bold text-foreground leading-tight tracking-tight">
                            Your API workspace,<br />
                            <span className="text-foreground-muted">all in one place.</span>
                        </h2>
                        <p className="text-foreground-disabled text-base leading-relaxed max-w-sm">
                            Design, test, and document APIs without switching tabs. AnvayaLab is built for developers who move fast.
                        </p>
                    </motion.div>

                    <motion.div
                        className="space-y-2"
                        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
                    >
                        {CODE_LINES.map((line, i) => (
                            <motion.div
                                key={i}
                                className="h-[3px] rounded-full opacity-75"
                                style={{ background: line.color }}
                                variants={{
                                    hidden: { width: "0%", opacity: 0 },
                                    show: {
                                        width: line.width,
                                        opacity: 0.75,
                                        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: i * 0.06 },
                                    },
                                }}
                            />
                        ))}
                    </motion.div>

                    {/* Feature list */}
                    <motion.div
                        className="space-y-3"
                        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
                    >
                        {[
                            "Send requests with any HTTP method",
                            "Organize APIs into collections",
                            "Built-in auth: Bearer, Basic, API Key",
                            "Real-time response time & size metrics",
                        ].map((feature) => (
                            <motion.div
                                key={feature}
                                className="flex items-center gap-3"
                                variants={{
                                    hidden: { opacity: 0, x: -14 },
                                    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 260, damping: 22 } },
                                }}
                            >
                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--color-accent)" }} />
                                <span className="text-foreground-muted text-sm">{feature}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* Bottom credit */}
                <motion.p
                    className="text-border-hover text-xs"
                    variants={{
                        hidden: { opacity: 0 },
                        show: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
                    }}
                >
                    © {new Date().getFullYear()} AnvayaLab. Built for developers.
                </motion.p>

                {/* Subtle background glow */}
                <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none" style={{ background: "color-mix(in srgb, var(--color-accent) 8%, transparent)" }} />

            </motion.div>

            {/* ── Right panel: form ── */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">

                {/* Mobile-only logo */}
                <div className="flex items-center gap-2 mb-10 lg:hidden">
                    <Image
                        src="/logo.png"
                        width={36}
                        height={36}
                        alt="AnvayaLab logo"
                        className="w-9 h-9 object-contain"
                    />
                    <span className="text-foreground font-bold text-base tracking-tight">AnvayaLab</span>
                </div>

                <motion.div
                    variants={formVariants}
                    initial="hidden"
                    animate="show"
                    className="w-full max-w-sm"
                >
                    <motion.div variants={itemVariants} className="mb-8">
                        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">
                            Create your account
                        </h1>
                        <p className="text-sm text-foreground-disabled">
                            Already have one?{" "}
                            <Link href="/sign-in" className="text-foreground hover:underline underline-offset-4">
                                Sign in
                            </Link>
                        </p>
                    </motion.div>

                    {/* OAuth */}
                    <motion.div variants={itemVariants} className="flex flex-col gap-2.5 mb-6">
                        <Button
                            type="button"
                            onClick={() =>{ 
                                localStorage.setItem("auth_flow", "signup")
                                signIn("github", { callbackUrl: "/" })
                            }}
                            className="w-full h-10 bg-surface hover:bg-surface-secondary border border-border hover:border-border-hover text-foreground-secondary hover:text-foreground transition-all rounded-lg text-sm font-normal"
                        >
                            <svg fill="#ffffff" viewBox="0 -0.5 25 25" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="m12.301 0h.093c2.242 0 4.34.613 6.137 1.68l-.055-.031c1.871 1.094 3.386 2.609 4.449 4.422l.031.058c1.04 1.769 1.654 3.896 1.654 6.166 0 5.406-3.483 10-8.327 11.658l-.087.026c-.063.02-.135.031-.209.031-.162 0-.312-.054-.433-.144l.002.001c-.128-.115-.208-.281-.208-.466 0-.005 0-.01 0-.014v.001q0-.048.008-1.226t.008-2.154c.007-.075.011-.161.011-.249 0-.792-.323-1.508-.844-2.025.618-.061 1.176-.163 1.718-.305l-.076.017c.573-.16 1.073-.373 1.537-.642l-.031.017c.508-.28.938-.636 1.292-1.058l.006-.007c.372-.476.663-1.036.84-1.645l.009-.035c.209-.683.329-1.468.329-2.281 0-.045 0-.091-.001-.136v.007c0-.022.001-.047.001-.072 0-1.248-.482-2.383-1.269-3.23l.003.003c.168-.44.265-.948.265-1.479 0-.649-.145-1.263-.404-1.814l.011.026c-.115-.022-.246-.035-.381-.035-.334 0-.649.078-.929.216l.012-.005c-.568.21-1.054.448-1.512.726l.038-.022-.609.384c-.922-.264-1.981-.416-3.075-.416s-2.153.152-3.157.436l.081-.02q-.256-.176-.681-.433c-.373-.214-.814-.421-1.272-.595l-.066-.022c-.293-.154-.64-.244-1.009-.244-.124 0-.246.01-.364.03l.013-.002c-.248.524-.393 1.139-.393 1.788 0 .531.097 1.04.275 1.509l-.01-.029c-.785.844-1.266 1.979-1.266 3.227 0 .025 0 .051.001.076v-.004c-.001.039-.001.084-.001.13 0 .809.12 1.591.344 2.327l-.015-.057c.189.643.476 1.202.85 1.693l-.009-.013c.354.435.782.793 1.267 1.062l.022.011c.432.252.933.465 1.46.614l.046.011c.466.125 1.024.227 1.595.284l.046.004c-.431.428-.718 1-.784 1.638l-.001.012c-.207.101-.448.183-.699.236l-.021.004c-.256.051-.549.08-.85.08-.022 0-.044 0-.066 0h.003c-.394-.008-.756-.136-1.055-.348l.006.004c-.371-.259-.671-.595-.881-.986l-.007-.015c-.198-.336-.459-.614-.768-.827l-.009-.006c-.225-.169-.49-.301-.776-.38l-.016-.004-.32-.048c-.023-.002-.05-.003-.077-.003-.14 0-.273.028-.394.077l.007-.003q-.128.072-.08.184c.039.086.087.16.145.225l-.001-.001c.061.072.13.135.205.19l.003.002.112.08c.283.148.516.354.693.603l.004.006c.191.237.359.505.494.792l.01.024.16.368c.135.402.38.738.7.981l.005.004c.3.234.662.402 1.057.478l.016.002c.33.064.714.104 1.106.112h.007c.045.002.097.002.15.002.261 0 .517-.021.767-.062l-.027.004.368-.064q0 .609.008 1.418t.008.873v.014c0 .185-.08.351-.208.466h-.001c-.119.089-.268.143-.431.143-.075 0-.147-.011-.214-.032l.005.001c-4.929-1.689-8.409-6.283-8.409-11.69 0-2.268.612-4.393 1.681-6.219l-.032.058c1.094-1.871 2.609-3.386 4.422-4.449l.058-.031c1.739-1.034 3.835-1.645 6.073-1.645h.098-.005zm-7.64 17.666q.048-.112-.112-.192-.16-.048-.208.032-.048.112.112.192.144.096.208-.032zm.497.545q.112-.08-.032-.256-.16-.144-.256-.048-.112.08.032.256.159.157.256.047zm.48.72q.144-.112 0-.304-.128-.208-.272-.096-.144.08 0 .288t.272.112zm.672.673q.128-.128-.064-.304-.192-.192-.32-.048-.144.128.064.304.192.192.32.044zm.913.4q.048-.176-.208-.256-.24-.064-.304.112t.208.24q.24.097.304-.096zm1.009.08q0-.208-.272-.176-.256 0-.256.176 0 .208.272.176.256.001.256-.175zm.929-.16q-.032-.176-.288-.144-.256.048-.224.24t.288.128.225-.224z"></path></g></svg>
                            Continue with GitHub
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                localStorage.setItem("auth_flow", "signup")
                                signIn("google", { callbackUrl: "/" })
                            }}
                            className="w-full h-10 bg-surface hover:bg-surface-secondary border border-border hover:border-border-hover text-foreground-secondary hover:text-foreground transition-all rounded-lg text-sm font-normal"
                        >
                            <svg viewBox="-0.5 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>Google-color</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Icons" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd"> <g id="Color-" transform="translate(-401.000000, -860.000000)"> <g id="Google" transform="translate(401.000000, 860.000000)"> <path d="M9.82727273,24 C9.82727273,22.4757333 10.0804318,21.0144 10.5322727,19.6437333 L2.62345455,13.6042667 C1.08206818,16.7338667 0.213636364,20.2602667 0.213636364,24 C0.213636364,27.7365333 1.081,31.2608 2.62025,34.3882667 L10.5247955,28.3370667 C10.0772273,26.9728 9.82727273,25.5168 9.82727273,24" id="Fill-1" fill="#FBBC05"> </path> <path d="M23.7136364,10.1333333 C27.025,10.1333333 30.0159091,11.3066667 32.3659091,13.2266667 L39.2022727,6.4 C35.0363636,2.77333333 29.6954545,0.533333333 23.7136364,0.533333333 C14.4268636,0.533333333 6.44540909,5.84426667 2.62345455,13.6042667 L10.5322727,19.6437333 C12.3545909,14.112 17.5491591,10.1333333 23.7136364,10.1333333" id="Fill-2" fill="#EB4335"> </path> <path d="M23.7136364,37.8666667 C17.5491591,37.8666667 12.3545909,33.888 10.5322727,28.3562667 L2.62345455,34.3946667 C6.44540909,42.1557333 14.4268636,47.4666667 23.7136364,47.4666667 C29.4455,47.4666667 34.9177955,45.4314667 39.0249545,41.6181333 L31.5177727,35.8144 C29.3995682,37.1488 26.7323182,37.8666667 23.7136364,37.8666667" id="Fill-3" fill="#34A853"> </path> <path d="M46.1454545,24 C46.1454545,22.6133333 45.9318182,21.12 45.6113636,19.7333333 L23.7136364,19.7333333 L23.7136364,28.8 L36.3181818,28.8 C35.6879545,31.8912 33.9724545,34.2677333 31.5177727,35.8144 L39.0249545,41.6181333 C43.3393409,37.6138667 46.1454545,31.6490667 46.1454545,24" id="Fill-4" fill="#4285F4"> </path> </g> </g> </g> </g></svg>
                            Continue with Google
                        </Button>
                    </motion.div>

                    {/* Divider */}
                    <motion.div variants={itemVariants} className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-background px-3 text-xs text-border-active uppercase tracking-widest">
                                or
                            </span>
                        </div>
                    </motion.div>

                    {/* Form */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <motion.div variants={itemVariants}>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground-muted text-xs font-medium">Full Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="your full name"
                                                    autoComplete="off"
                                                    className="h-10 bg-surface border-border text-foreground placeholder:text-border-active focus-visible:ring-0 focus-visible:border-border-active rounded-lg text-sm transition-colors"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs text-danger" />
                                        </FormItem>
                                    )}
                                />
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground-muted text-xs font-medium">Email Address</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder="your email"
                                                    className="h-10 bg-surface border-border text-foreground placeholder:text-border-active focus-visible:ring-0 focus-visible:border-border-active rounded-lg text-sm transition-colors"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs text-danger" />
                                        </FormItem>
                                    )}
                                />
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground-muted text-xs font-medium">Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="Min. 8 characters"
                                                    className="h-10 bg-surface border-border text-foreground placeholder:text-border-active focus-visible:ring-0 focus-visible:border-border-active rounded-lg text-sm transition-colors"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs text-danger" />
                                        </FormItem>
                                    )}
                                />
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground-muted text-xs font-medium">Confirm Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="Re-enter password"
                                                    className="h-10 bg-surface border-border text-foreground placeholder:text-border-active focus-visible:ring-0 focus-visible:border-border-active rounded-lg text-sm transition-colors"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-xs text-danger" />
                                        </FormItem>
                                    )}
                                />
                            </motion.div>

                            <motion.div variants={itemVariants} className="flex gap-2.5 pt-2">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            type="button"
                                            className="w-1/3 h-10 bg-transparent border border-border hover:border-border-hover text-foreground-disabled hover:text-foreground-muted hover:bg-surface transition-all rounded-lg text-sm font-normal"
                                        >
                                            Discard
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-surface! border border-[#27272a] text-text-white rounded-xl shadow-2xl max-w-sm">
                                        <AlertDialogHeader>
                                            <div className="flex items-center gap-2 text-danger">
                                                <AlertTriangle className="h-5 w-5 shrink-0" />
                                                <AlertDialogTitle className="text-text-white text-base font-semibold">
                                                    Discard changes?
                                                </AlertDialogTitle>
                                            </div>
                                            <AlertDialogDescription className="text-foreground-disabled text-sm mt-1.5 text-left">
                                                This will clear all fields. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="bg-surface-secondary! border-t border-[#27272a] -mx-4 -mb-4 px-4 py-3 rounded-b-xl flex flex-row justify-end gap-2">
                                            <AlertDialogCancel className="h-9 px-4 bg-transparent border border-[#27272a] text-foreground-muted hover:bg-surface-hover hover:text-text-white hover:border-border-hover rounded-lg text-sm font-normal transition-all">
                                                Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => form.reset()}
                                                className="h-9 px-4 bg-[#ef4444]! hover:bg-[#dc2626]! text-white! rounded-lg text-sm font-medium transition-all border-0"
                                            >
                                                Clear Fields
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                                <Button
                                    type="submit"
                                    disabled={form.formState.isSubmitting}
                                    className="w-2/3 h-10 bg-foreground hover:bg-foreground-secondary text-background font-semibold rounded-lg text-sm transition-all group"
                                >
                                    {form.formState.isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            Create Account
                                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </motion.div>

                            <motion.p variants={itemVariants} className="text-center text-xs text-border-active pt-1">
                                By creating an account you agree to our{" "}
                                <Link href="/terms" className="text-foreground-disabled hover:text-foreground-muted underline underline-offset-4 transition-colors">
                                    Terms of Service
                                </Link>
                            </motion.p>
                        </form>
                    </Form>
                </motion.div>
            </div>
        </div>
    );
}

export default function SignUpPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-6 w-6 animate-spin text-accent-blue" />
            </div>
        }>
            <SignUpPageContent />
        </Suspense>
    );
}