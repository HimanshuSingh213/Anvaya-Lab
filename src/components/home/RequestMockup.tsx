"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Database, Loader2 } from "lucide-react";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const METHODS: { method: Method; text: string; bg: string; border: string }[] = [
    { method: "GET", text: "text-method-get", bg: "bg-method-get/10", border: "border-method-get/25" },
    { method: "POST", text: "text-method-post", bg: "bg-method-post/10", border: "border-method-post/25" },
    { method: "PUT", text: "text-method-put", bg: "bg-method-put/10", border: "border-method-put/25" },
    { method: "PATCH", text: "text-method-patch", bg: "bg-method-patch/10", border: "border-method-patch/25" },
    { method: "DELETE", text: "text-method-delete", bg: "bg-method-delete/10", border: "border-method-delete/25" },
];

const TABS = ["Params", "Headers", "Body", "Auth"];

const RESPONSE_JSON = `{
  "login": "octocat",
  "id": 583231,
  "name": "The Octocat",
  "public_repos": 8,
  "followers": 20514
}`;

export default function RequestMockup() {
    const [index, setIndex] = useState(0);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReducedMotion) return;

        const cycle = setInterval(() => {
            setSending(true);
            window.setTimeout(() => {
                setIndex((i) => (i + 1) % METHODS.length);
                setSending(false);
            }, 550);
        }, 3200);

        return () => clearInterval(cycle);
    }, []);

    const active = METHODS[index];

    return (
        <div className="relative w-full max-w-md mx-auto lg:mx-0">
            {/* Ambient glow — the one bold, contained moment */}
            <div
                aria-hidden
                className="absolute -top-16 -right-10 w-64 h-64 rounded-full blur-[100px] opacity-30 pointer-events-none"
                style={{ background: "var(--color-brand-indigo)" }}
            />
            <div
                aria-hidden
                className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full blur-[100px] opacity-20 pointer-events-none"
                style={{ background: "var(--color-accent-blue)" }}
            />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
                className="relative rounded-2xl border border-border-dark bg-panel-charcoal shadow-2xl shadow-black/60 overflow-hidden"
            >
                {/* Window chrome */}
                <div className="flex items-center gap-1.5 h-9 px-4 border-b border-border-dark bg-[#050506]">
                    <span className="size-2 rounded-full bg-border-hover" />
                    <span className="size-2 rounded-full bg-border-hover" />
                    <span className="size-2 rounded-full bg-border-hover" />
                    <span className="ml-2 text-[10px] font-mono text-text-disabled tracking-wide">
                        AnvayaLab — API Client
                    </span>
                </div>

                {/* URL bar */}
                <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={active.method}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                transition={{ duration: 0.2 }}
                                className={`shrink-0 text-[10px] font-extrabold uppercase px-2 py-1.5 rounded-md border ${active.text} ${active.bg} ${active.border}`}
                            >
                                {active.method}
                            </motion.span>
                        </AnimatePresence>
                        <div className="flex-1 min-w-0 h-7 px-2.5 flex items-center rounded-md bg-panel-active border border-border-dark">
                            <span className="text-[12px] font-mono text-text-grey truncate">
                                api.github.com/users/octocat
                            </span>
                        </div>
                        <span className="shrink-0 flex items-center justify-center size-7 rounded-md bg-accent-blue text-white">
                            {sending ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" className="size-3.5">
                                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </span>
                    </div>

                    {/* Tab strip */}
                    <div className="flex items-center gap-3 border-b border-border-dark">
                        {TABS.map((tab, i) => (
                            <span
                                key={tab}
                                className={`text-[11px] pb-2 border-b-2 -mb-px transition-colors ${
                                    i === 1
                                        ? "text-text-white border-accent-blue"
                                        : "text-text-muted border-transparent"
                                }`}
                            >
                                {tab}
                            </span>
                        ))}
                    </div>

                    {/* Fake headers rows */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                            <span className="text-text-muted w-20 truncate">Accept</span>
                            <span className="text-text-grey">application/vnd.github+json</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                            <span className="text-text-muted w-20 truncate">User-Agent</span>
                            <span className="text-text-grey">AnvayaLab/1.0</span>
                        </div>
                    </div>
                </div>

                {/* Response panel */}
                <div className="border-t border-border-dark bg-[#020203] p-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold text-success bg-[#0e2a18] border border-[#1e522e]">
                            200 OK
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-text-muted">
                            <Clock className="size-3" />
                            142 ms
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-text-muted">
                            <Database className="size-3" />
                            1.24 kb
                        </span>
                    </div>
                    <pre className="text-[11px] leading-relaxed font-mono text-text-grey overflow-x-auto">
                        <code>
                            {RESPONSE_JSON.split("\n").map((line, i) => (
                                <div key={i}>
                                    <JsonLine line={line} />
                                </div>
                            ))}
                        </code>
                    </pre>
                </div>
            </motion.div>
        </div>
    );
}

function JsonLine({ line }: { line: string }) {
    const match = line.match(/^(\s*)"([^"]+)":\s*(.*?)(,?)$/);
    if (!match) return <>{line}</>;

    const [, indent, key, value, trailingComma] = match;
    const isString = value.startsWith('"');

    return (
        <>
            {indent}
            <span className="text-brand-sky">&quot;{key}&quot;</span>
            <span className="text-text-muted">: </span>
            <span className={isString ? "text-method-get" : "text-method-post"}>{value}</span>
            {trailingComma}
        </>
    );
}
