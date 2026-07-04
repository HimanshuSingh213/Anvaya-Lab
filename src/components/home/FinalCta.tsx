"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { HomeUser } from "./types";

function firstName(name?: string | null) {
    if (!name) return null;
    return name.trim().split(" ")[0];
}

export default function FinalCta({ user }: { user: HomeUser | null }) {
    const name = firstName(user?.name);

    return (
        <section className="relative border-t border-border-dark overflow-hidden">
            <div
                aria-hidden
                className="absolute left-1/2 top-0 -translate-x-1/2 w-[560px] h-[280px] rounded-full blur-[120px] opacity-20 pointer-events-none"
                style={{ background: "var(--color-brand-indigo)" }}
            />
            <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-24 sm:py-28 text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 240, damping: 22 }}
                    className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight text-balance"
                >
                    {user
                        ? `Welcome back${name ? `, ${name}` : ""}.`
                        : "Your next API call deserves a better client."}
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 240, damping: 22, delay: 0.05 }}
                    className="mt-4 text-text-grey text-base leading-relaxed"
                >
                    {user
                        ? "Pick up right where you left off — your collections and history are waiting."
                        : "Free to start. No credit card, no tab-switching — just a workspace built for testing APIs."}
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 240, damping: 22, delay: 0.1 }}
                    className="mt-8 flex flex-wrap items-center justify-center gap-3"
                >
                    <Link
                        href={user ? "/my-workspace" : "/sign-up"}
                        className="group inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-6 text-sm font-semibold text-background hover:bg-foreground/85 transition-colors"
                    >
                        {user ? "Open my workspace" : "Create your free account"}
                        <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                    {!user && (
                        <Link
                            href="/sign-in"
                            className="inline-flex h-11 items-center rounded-lg border border-border-dark px-6 text-sm font-medium text-text-white hover:border-border-hover hover:bg-panel-hover transition-colors"
                        >
                            Sign in
                        </Link>
                    )}
                </motion.div>
            </div>
        </section>
    );
}
