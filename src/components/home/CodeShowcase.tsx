"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CODE_SNIPPETS, LANGS, type Lang } from "./codeSnippets";

interface CodeShowcaseProps {
    /** Pre-rendered shiki HTML per language, computed server-side in page.tsx */
    snippetsHtml: Record<Lang, string>;
}

export default function CodeShowcase({ snippetsHtml }: CodeShowcaseProps) {
    const [active, setActive] = useState<Lang>("cURL");

    return (
        <section id="snippets" className="relative border-t border-border-dark">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28">
                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    <div className="max-w-md">
                        <span className="text-[12px] font-mono text-accent-blue tracking-wide">
                            {"// code export"}
                        </span>
                        <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-foreground tracking-tight text-balance">
                            One request. Five languages.
                        </h2>
                        <p className="mt-4 text-text-grey leading-relaxed">
                            Build a request once in AnvayaLab, then hand your team working code — no
                            retyping headers, no guessing at syntax. Every export mirrors the request
                            you actually tested.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2">
                            {LANGS.map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => setActive(lang)}
                                    className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium border transition-colors cursor-pointer ${
                                        active === lang
                                            ? "bg-panel-active border-border-hover text-text-white"
                                            : "border-border-dark text-text-muted hover:text-text-grey hover:border-border-hover"
                                    }`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border-dark bg-panel-charcoal overflow-hidden">
                        <div className="flex items-center justify-between h-9 px-4 border-b border-border-dark bg-[#050506]">
                            <span className="text-[11px] font-mono text-text-disabled">
                                request.{CODE_SNIPPETS[active].ext}
                            </span>
                            <span className="size-1.5 rounded-full bg-method-get" />
                        </div>
                        <div className="relative min-h-[280px]">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={active}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.16 }}
                                    className="shiki-container p-5 text-[12.5px] [&_pre]:leading-relaxed overflow-x-auto"
                                    // Shiki returns static, build-time-known HTML for our own hardcoded
                                    // snippets — not user input — so injecting it directly is safe here.
                                    dangerouslySetInnerHTML={{ __html: snippetsHtml[active] }}
                                />
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
