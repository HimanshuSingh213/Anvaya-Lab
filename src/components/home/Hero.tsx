"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import RequestMockup from "./RequestMockup";
import { HomeUser } from "./types";

const containerVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } },
};

const METHOD_LEGEND = [
    { label: "GET", className: "bg-method-get" },
    { label: "POST", className: "bg-method-post" },
    { label: "PUT", className: "bg-method-put" },
    { label: "PATCH", className: "bg-method-patch" },
    { label: "DELETE", className: "bg-method-delete" },
];

function firstName(name?: string | null) {
    if (!name) return null;
    return name.trim().split(" ")[0];
}

export default function Hero({ user }: { user: HomeUser | null }) {
    const name = firstName(user?.name);

    return (
        <section className="relative overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
                <div className="grid lg:grid-cols-2 gap-14 lg:gap-10 items-center">
                    <motion.div variants={containerVariants} initial="hidden" animate="show">
                        <motion.div
                            variants={itemVariants}
                            className="inline-flex items-center gap-2 rounded-full border border-border-dark bg-panel-charcoal px-3 py-1 mb-6"
                        >
                            <span className="size-1.5 rounded-full bg-accent-blue" />
                            <span className="text-[12px] font-mono text-text-grey">
                                The API client that speaks your language
                            </span>
                        </motion.div>

                        <motion.h1
                            variants={itemVariants}
                            className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-foreground leading-[1.08] tracking-tight text-balance"
                        >
                            {user ? (
                                <>
                                    Welcome back{name ? `, ${name}` : ""}.<br />
                                    <span className="text-text-grey">Your workspace is right here.</span>
                                </>
                            ) : (
                                <>
                                    Send the request.
                                    <br />
                                    <span className="text-text-grey">Get the code, too.</span>
                                </>
                            )}
                        </motion.h1>

                        <motion.p
                            variants={itemVariants}
                            className="mt-5 text-base sm:text-lg text-text-grey leading-relaxed max-w-lg"
                        >
                            {user
                                ? "Pick up where you left off — your workspaces, collections, and request history are all waiting."
                                : "AnvayaLab turns every request into ready-to-paste cURL, fetch, Axios, Python, and Go — while you organize collections, track history, and test any HTTP method in one focused, dark workspace."}
                        </motion.p>

                        <motion.div variants={itemVariants} className="mt-8 flex flex-wrap items-center gap-3">
                            {user ? (
                                <Link
                                    href="/my-workspace"
                                    className="group inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-5 text-sm font-semibold text-background hover:bg-foreground/85 transition-colors"
                                >
                                    Open my workspace
                                    <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/sign-up"
                                        className="group inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-5 text-sm font-semibold text-background hover:bg-foreground/85 transition-colors"
                                    >
                                        Get started free
                                        <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                                    </Link>
                                    <Link
                                        href="/sign-in"
                                        className="inline-flex h-11 items-center rounded-lg border border-border-dark px-5 text-sm font-medium text-text-white hover:border-border-hover hover:bg-panel-hover transition-colors"
                                    >
                                        I have an account
                                    </Link>
                                </>
                            )}
                        </motion.div>

                        <motion.div
                            variants={itemVariants}
                            className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2"
                        >
                            {METHOD_LEGEND.map((m) => (
                                <span key={m.label} className="flex items-center gap-1.5">
                                    <span className={`size-1.5 rounded-full ${m.className}`} />
                                    <span className="text-[11px] font-mono text-text-muted tracking-wide">
                                        {m.label}
                                    </span>
                                </span>
                            ))}
                            <span className="text-[11px] text-text-disabled">— every method, one client</span>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                    >
                        <RequestMockup />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
