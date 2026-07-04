"use client";

import { motion, Variants } from "framer-motion";
import {
    Code2,
    FolderTree,
    Github,
    History,
    KeyRound,
    Zap,
    LucideIcon,
} from "lucide-react";

interface Feature {
    icon: LucideIcon;
    title: string;
    description: string;
    iconClass: string;
    chipClass: string;
}

const FEATURES: Feature[] = [
    {
        icon: FolderTree,
        title: "Workspaces & collections",
        description:
            "Group requests into collections inside dedicated workspaces, so nothing gets lost between projects.",
        iconClass: "text-accent-blue",
        chipClass: "bg-accent-blue/10 border-accent-blue/20",
    },
    {
        icon: Zap,
        title: "Every HTTP method",
        description:
            "Build and send GET, POST, PUT, PATCH, and DELETE requests with params, headers, and body in one editor.",
        iconClass: "text-success",
        chipClass: "bg-success/10 border-success/20",
    },
    {
        icon: Code2,
        title: "Instant code export",
        description:
            "Copy any request straight into cURL, fetch, Axios, Python, or Go — no manual translation required.",
        iconClass: "text-brand-sky",
        chipClass: "bg-brand-indigo/10 border-brand-indigo/25",
    },
    {
        icon: KeyRound,
        title: "Built-in authentication",
        description:
            "Attach Bearer tokens, Basic auth, or API keys to a request without leaving the builder.",
        iconClass: "text-warning",
        chipClass: "bg-warning/10 border-warning/20",
    },
    {
        icon: History,
        title: "Full request history",
        description:
            "Every call is logged with status, response time, and size, so you can trace what happened and when.",
        iconClass: "text-method-patch",
        chipClass: "bg-method-patch/10 border-method-patch/20",
    },
    {
        icon: Github,
        title: "Sign in your way",
        description:
            "Continue with GitHub, Google, or an email and password — verified in seconds, secured with bcrypt.",
        iconClass: "text-text-white",
        chipClass: "bg-white/8 border-border-hover",
    },
];

const containerVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
};

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } },
};

export default function Features() {
    return (
        <section id="features" className="relative border-t border-border-dark">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28">
                <div className="max-w-xl mb-14">
                    <span className="text-[12px] font-mono text-accent-blue tracking-wide">
                        {"// features"}
                    </span>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-foreground tracking-tight text-balance">
                        Everything an API needs, nothing it doesn&apos;t.
                    </h2>
                    <p className="mt-4 text-text-grey leading-relaxed">
                        AnvayaLab keeps the request lifecycle — build, send, inspect, export — in one dark,
                        distraction-free workspace built for developers who move fast.
                    </p>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-80px" }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    {FEATURES.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={feature.title}
                                variants={cardVariants}
                                className="group rounded-2xl border border-border-dark bg-panel-charcoal p-6 hover:border-border-hover transition-colors"
                            >
                                <div
                                    className={`inline-flex items-center justify-center size-10 rounded-xl border ${feature.chipClass}`}
                                >
                                    <Icon className={`size-4.5 ${feature.iconClass}`} />
                                </div>
                                <h3 className="mt-4 text-[15px] font-semibold text-text-white">
                                    {feature.title}
                                </h3>
                                <p className="mt-1.5 text-[13px] text-text-muted leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
