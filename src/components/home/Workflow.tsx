"use client";

import { motion, Variants } from "framer-motion";
import { FolderPlus, History, Layers, Send, LucideIcon } from "lucide-react";

interface Step {
    number: string;
    icon: LucideIcon;
    title: string;
    description: string;
}

const STEPS: Step[] = [
    {
        number: "01",
        icon: FolderPlus,
        title: "Create a workspace",
        description: "Spin up a workspace for a project or client in a couple of seconds.",
    },
    {
        number: "02",
        icon: Layers,
        title: "Add a collection",
        description: "Group related requests together so your API surface stays organized.",
    },
    {
        number: "03",
        icon: Send,
        title: "Build & send requests",
        description: "Set the method, params, headers, auth, and body — then hit send.",
    },
    {
        number: "04",
        icon: History,
        title: "Track the history",
        description: "Every response is logged with status, timing, and size for later reference.",
    },
];

const containerVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
};

const stepVariants: Variants = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 250, damping: 24 } },
};

export default function Workflow() {
    return (
        <section id="workflow" className="relative border-t border-border-dark">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28">
                <div className="max-w-xl mb-14">
                    <span className="text-[12px] font-mono text-accent-blue tracking-wide">
                        {"// how it works"}
                    </span>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-foreground tracking-tight text-balance">
                        From empty workspace to logged response.
                    </h2>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-80px" }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border-dark rounded-2xl overflow-hidden border border-border-dark"
                >
                    {STEPS.map((step) => {
                        const Icon = step.icon;
                        return (
                            <motion.div
                                key={step.number}
                                variants={stepVariants}
                                className="bg-panel-charcoal p-6"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-mono text-text-disabled">
                                        {step.number}
                                    </span>
                                    <Icon className="size-4 text-text-muted" />
                                </div>
                                <h3 className="mt-4 text-[15px] font-semibold text-text-white">
                                    {step.title}
                                </h3>
                                <p className="mt-1.5 text-[13px] text-text-muted leading-relaxed">
                                    {step.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
