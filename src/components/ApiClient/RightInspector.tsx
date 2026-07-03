import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Copy, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '@/app/Context/UserContext'
import { codeToHtml } from 'shiki'

interface inspectorProp {
    optionId: string
}

const languages = [
    { value: "curl", label: "cURL" },
    { value: "fetch", label: "JS Fetch" },
    { value: "axios", label: "JS Axios" },
    { value: "python", label: "Python Requests" },
    { value: "http", label: "Go HTTP" },
];

const langMap: Record<string, string> = {
    curl: "bash",
    fetch: "javascript",
    axios: "javascript",
    python: "python",
    http: "go"
};

export default function RightInspector({ optionId }: inspectorProp) {
    const { snippets } = useApp();
    const [selectedLang, setSelectedLang] = useState("curl");
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const activeLanguage = languages.find(l => l.value === selectedLang) || languages[0];
    const snippetCode = snippets[selectedLang as keyof typeof snippets] || snippets.curl;

    const [highlightedHtml, setHighlightedHtml] = useState("");

    useEffect(() => {
        let active = true;
        codeToHtml(snippetCode, {
            lang: langMap[selectedLang] || "bash",
            theme: "github-dark-high-contrast"
        }).then(html => {
            if (active) {
                setHighlightedHtml(html);
            }
        }).catch(err => {
            console.error("Shiki highlight error:", err);
            if (active) {
                setHighlightedHtml("");
            }
        });
        return () => { active = false; };
    }, [snippetCode, selectedLang]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(snippetCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full w-full bg-background border-t border-border-dark">
            {optionId === "snippets" && (
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Language selector */}
                    <div className='bg-background border-b border-border-dark p-3 flex items-center justify-between relative z-20 shrink-0'>
                        <span className='text-[9px] text-text-muted font-mono tracking-widest uppercase'>Language</span>

                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="flex items-center justify-between gap-2 px-3 py-1.5 min-w-[130px] bg-panel-charcoal border border-border-dark rounded text-xs text-text-white hover:text-white hover:bg-panel-hover transition-colors select-none cursor-pointer"
                            >
                                <span>{activeLanguage.label}</span>
                                <ChevronDown className={`size-3 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                        transition={{ duration: 0.1, ease: "easeOut" }}
                                        className="absolute right-0 mt-1 w-full min-w-[130px] bg-panel-charcoal border border-border-dark rounded shadow-2xl p-1 z-50 overflow-hidden"
                                    >
                                        {languages.map((lang) => (
                                            <button
                                                key={lang.value}
                                                onClick={() => {
                                                    setSelectedLang(lang.value);
                                                    setIsOpen(false);
                                                }}
                                                className={`w-full text-left px-2.5 py-1.5 text-xs rounded transition-colors ${lang.value === selectedLang
                                                        ? "bg-panel-active text-text-white font-medium"
                                                        : "text-text-grey hover:text-text-white hover:bg-panel-hover"
                                                    }`}
                                            >
                                                {lang.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    {/* Snippet container */}
                    <div className="flex-1 min-h-0 p-3 bg-background flex flex-col">
                        {/* Snippet display */}
                        <div className="flex-1 h-12 bg-bg-black border border-border-dark p-3 rounded font-mono text-[11px] overflow-y-auto overflow-x-hidden text-text-white relative group/snippet custom-editor-scrollbar">
                            <button
                                onClick={handleCopy}
                                className="absolute top-2 right-2 p-1.5 bg-panel-charcoal border border-border-dark hover:border-border-hover rounded text-text-muted hover:text-text-white transition-all opacity-0 group-hover/snippet:opacity-100 cursor-pointer z-10"
                                title="Copy code"
                            >
                                {copied ? (
                                    <Check className="size-3.5 text-success" />
                                ) : (
                                    <Copy className="size-3.5" />
                                )}
                            </button>
                            {highlightedHtml ? (
                                <div 
                                    dangerouslySetInnerHTML={{ __html: highlightedHtml }} 
                                    className="shiki-container pr-8 text-[11px]"
                                />
                            ) : (
                                <pre className="whitespace-pre-wrap break-all leading-relaxed pr-8">
                                    {snippetCode}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {optionId === "globals" && (
                <div className="flex-1 flex flex-col min-h-0 p-3 text-xs text-text-muted">
                    <div className="bg-panel-charcoal border border-border-dark p-4 rounded-md flex flex-col gap-2">
                        <span className="text-[10px] font-mono tracking-wider uppercase text-text-grey">Environment Globals</span>
                        <p className="text-[11px] leading-relaxed">
                            Define key-value pairs accessible across all collections and requests in this workspace.
                        </p>
                        <div className="mt-2 text-[10px] italic border-t border-border-dark pt-2">
                            No globals configured yet.
                        </div>
                    </div>
                </div>
            )}

            {optionId === "history" && (
                <div className="flex-1 flex flex-col min-h-0 p-3 text-xs text-text-muted">
                    <div className="bg-panel-charcoal border border-border-dark p-4 rounded-md flex flex-col gap-2">
                        <span className="text-[10px] font-mono tracking-wider uppercase text-text-grey">Request Logs</span>
                        <p className="text-[11px] leading-relaxed">
                            View the execution timeline, latency details, and responses for ran requests.
                        </p>
                        <div className="mt-2 text-[10px] italic border-t border-border-dark pt-2">
                            No requests logged in this session.
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
