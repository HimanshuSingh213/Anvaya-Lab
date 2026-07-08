import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Copy, Check, Clock, Trash2, Loader2, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '@/app/Context/UserContext'
import { codeToHtml } from 'shiki'
import axios from 'axios'
import { toast } from 'sonner'
import { ApiResponse } from '@/types/ApiResponse'
import { QueryParam } from '@/models/Request.model'

interface inspectorProp {
    optionId: string
}

interface HistoryPayload {
    _id: string;
    workspaceId: string;
    method: string;
    url: string;
    headers?: string;
    body?: string;
    status: number;
    responseTime: number;
    responseSize?: number;
    response?: string;
    createdAt: string;
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

const methodColors: Record<string, string> = {
    GET: "text-success bg-success/10 border-success/20",
    POST: "text-warning bg-warning/10 border-warning/20",
    PUT: "text-accent-blue bg-accent-blue/10 border-accent-blue/20",
    PATCH: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    DELETE: "text-danger bg-danger/10 border-danger/20",
};

const parseUrlParams = (fullUrl: string) => {
    let baseUrl = fullUrl;
    const params: Array<QueryParam> = [];
    const qIndex = fullUrl.indexOf("?");
    if (qIndex !== -1) {
        baseUrl = fullUrl.substring(0, qIndex);
        const queryString = fullUrl.substring(qIndex + 1);
        const searchParamsObj = new URLSearchParams(queryString);
        searchParamsObj.forEach((value, key) => {
            params.push({
                key,
                value,
                isEnabled: true
            });
        });
    }
    return { baseUrl, params };
};

export default function RightInspector({ optionId }: inspectorProp) {
    const { 
        snippets, 
        activeWorkspace, 
        setRequestDraft, 
        setActiveResponse: setResponse, 
        history, 
        loadingHistory, 
        fetchHistory, 
        setHistory,
        environments,
        activeEnvironmentId
    } = useApp();
    const [selectedLang, setSelectedLang] = useState("curl");
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [revealedSecrets, setRevealedSecrets] = useState<Record<number, boolean>>({});

    const handleToggleRevealSecret = (index: number) => {
        setRevealedSecrets(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const activeEnv = environments.find(e => e.id === activeEnvironmentId) || null;
    const activeEnvVariables = activeEnv ? activeEnv.variables : [];
    const activeEnvName = activeEnv ? activeEnv.name : "None";

    const activeLanguage = languages.find(l => l.value === selectedLang) || languages[0];
    const snippetCode = snippets[selectedLang as keyof typeof snippets] || snippets.curl;

    const [highlightedHtml, setHighlightedHtml] = useState("");

    // Dynamic Shiki code highlighting
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

    useEffect(() => {
        if (optionId === "history") {
            fetchHistory();
        }
    }, [activeWorkspace?._id, optionId, fetchHistory]);

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
        } catch {
            console.error("Failed to copy text");
        }
    };

    const handleClearLog = async () => {
        if (!activeWorkspace?._id) return;
        try {
            const res = await axios.delete<ApiResponse>(`/api/history?workspaceId=${activeWorkspace._id}`);
            if (res.data.success) {
                setHistory([]);
                toast.success("History logs cleared successfully");
            }
        } catch (err) {
            toast.error("Failed to clear log history", {
                description: err instanceof Error ? err.message : String(err)
            });
        }
    };

    const handleLoadHistoryItem = (el: HistoryPayload) => {
        // Parse request body
        let draftBody = { type: "none", content: "" };
        if (el.body) {
            try {
                // Check if it's already an object or raw string
                const parsedBody = JSON.parse(el.body);
                if (parsedBody && typeof parsedBody === "object") {
                    draftBody = parsedBody;
                } else {
                    draftBody = { type: "raw", content: String(el.body) };
                }
            } catch {
                draftBody = { type: "raw", content: el.body };
            }
        }

        // Parse headers
        let draftHeaders: Array<{ key: string; value: string; isEnabled: boolean }> = [];
        if (el.headers) {
            try {
                const parsedHeaders = JSON.parse(el.headers);
                if (parsedHeaders && typeof parsedHeaders === "object") {
                    draftHeaders = Object.entries(parsedHeaders).map(([key, value]) => ({
                        key,
                        value: String(value),
                        isEnabled: true
                    }));
                }
            } catch {}
        }

        // Parse query params from URL
        const { baseUrl, params } = parseUrlParams(el.url);

        // Update Request Draft context state
        setRequestDraft({
            url: baseUrl,
            method: el.method,
            headers: draftHeaders,
            queryParams: params,
            body: draftBody,
            authentication: { type: "none" }
        });

        // Set response context state to show details in ResponseViewer
        setResponse({
            status: el.status,
            statusText: el.status >= 200 && el.status < 300 ? "OK" : "Error",
            time: el.responseTime,
            size: el.responseSize || 0,
            headers: el.headers ? JSON.parse(el.headers) : {},
            body: el.response ? (
                (() => {
                    try {
                        return JSON.parse(el.response);
                    } catch {
                        return el.response;
                    }
                })()
            ) : ""
        });
    };

    // Formatter helpers

    const formatTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } catch {
            return "";
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full w-full bg-background border-t border-border-dark min-h-0">
            {optionId === "snippets" && (
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Language selector */}
                    <div className='bg-background border-b border-border-dark p-3 flex items-center justify-between relative z-20 shrink-0'>
                        <span className='text-[9px] text-text-muted font-mono tracking-widest uppercase'>Language</span>

                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="flex items-center justify-between gap-2 px-3 py-1.5 min-w-32.5 bg-panel-charcoal border border-border-dark rounded text-xs text-text-white hover:text-white hover:bg-panel-hover transition-colors select-none cursor-pointer"
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
                                        className="absolute right-0 mt-1 w-full min-w-32.5 bg-panel-charcoal border border-border-dark rounded shadow-2xl p-1 z-50 overflow-hidden"
                                    >
                                        {languages.map((lang) => (
                                            <button
                                                key={lang.value}
                                                onClick={() => {
                                                    setSelectedLang(lang.value);
                                                    setIsOpen(false);
                                                }}
                                                className={`w-full text-left px-2.5 py-1.5 text-xs rounded transition-colors ${
                                                    lang.value === selectedLang
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
                        <div className="flex-1 bg-bg-black border border-border-dark p-3 rounded font-mono text-[11px] overflow-y-auto overflow-x-hidden text-text-white relative group/snippet custom-editor-scrollbar">
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
                <div className="flex-1 flex flex-col min-h-0 bg-background">
                    {/* Header */}
                    <header className="bg-background border-b border-border-dark p-3.5 flex flex-row justify-between items-center shrink-0" data-tour="right-inspector-globals-header">
                        <span className="text-[9px] font-mono text-text-muted uppercase font-bold tracking-wider">Active ENVs</span>
                    </header>

                    {/* Quick Look Container */}
                    <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 custom-editor-scrollbar">
                        {!activeEnvironmentId ? (
                            <div className="text-center py-12 text-[10px] text-text-muted italic bg-panel-charcoal/30 border border-dashed border-border-dark rounded-md p-4">
                                No environment profile is active. Select an environment from the status bar or the Environments tab to view active variables.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3.5">
                                {/* Environment Meta */}
                                <div className="p-2.5 bg-[#09090b] border border-border-dark rounded flex flex-col gap-1">
                                    <span className="text-[9.5px] font-mono text-text-muted uppercase tracking-wider font-semibold">Active Profile</span>
                                    <span className="text-xs font-bold text-text-white">{activeEnvName}</span>
                                </div>

                                {/* Variable List */}
                                <div className="flex flex-col gap-2">
                                    <span className="text-[9.5px] font-mono text-text-muted uppercase tracking-wider font-semibold px-1">Configured Variables</span>
                                    {activeEnvVariables.length === 0 ? (
                                        <div className="text-[10px] text-text-muted italic px-1 pt-1">
                                            No variables defined in this profile.
                                        </div>
                                    ) : (
                                        <div className="border border-border-dark rounded divide-y divide-border-dark overflow-hidden bg-panel-charcoal/20">
                                            {activeEnvVariables.map((v, idx) => {
                                                const isRevealed = !!revealedSecrets[idx];
                                                return (
                                                    <div key={idx} className={`p-2.5 flex flex-col gap-1.5 transition-all ${!v.isEnabled ? "opacity-40" : ""}`}>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-mono text-[10px] font-bold text-text-white truncate pr-2">
                                                                {v.key || "—"}
                                                            </span>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                {v.isSecret && (
                                                                    <button
                                                                        onClick={() => handleToggleRevealSecret(idx)}
                                                                        className="p-0.5 rounded text-text-muted hover:text-text-white transition-colors cursor-pointer"
                                                                        title={isRevealed ? "Hide Secret" : "Show Secret"}
                                                                    >
                                                                        {isRevealed ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                                                                    </button>
                                                                )}
                                                                <span className={`text-[8px] font-mono px-1 py-0.2 rounded border font-semibold ${
                                                                    v.isEnabled 
                                                                        ? "text-success border-success/20 bg-success/5" 
                                                                        : "text-text-muted border-border-dark bg-panel-charcoal"
                                                                }`}>
                                                                    {v.isEnabled ? "Active" : "Disabled"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="font-mono text-[10.5px] text-text-grey truncate block select-text">
                                                            {v.isSecret && !isRevealed ? "••••••••" : v.value || "—"}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {optionId === "history" && (
                <div className="flex-1 flex flex-col min-h-0 text-xs text-text-muted bg-background">
                    {/* Header */}
                    <header className="bg-background border-b border-border-dark p-3.5 flex flex-row justify-between items-center shrink-0">
                        <span className="text-[9px] font-mono text-text-muted uppercase font-bold tracking-wider">Execution Log</span>
                        {history.length > 0 && (
                            <button
                                onClick={handleClearLog}
                                className="flex items-center gap-1 text-[10px] text-danger hover:text-danger/80 transition-colors uppercase font-mono tracking-wider font-semibold cursor-pointer"
                            >
                                Clear Log
                            </button>
                        )}
                    </header>
                    {/* History panel */}
                    <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-border-dark custom-editor-scrollbar">
                        {loadingHistory ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-2 text-text-muted">
                                <Loader2 className="size-5 animate-spin text-accent-blue" />
                                <span className="text-[10px] font-mono">Loading history...</span>
                            </div>
                        ) : history.length !== 0 ? (
                            <div className="flex flex-col">
                                {history.map((el) => {
                                    const mStyle = methodColors[el.method] || "text-text-grey bg-panel-hover";
                                    const parsedUrl = el.url ? el.url.replace(/^https?:\/\//, "") : "";
                                    const displayUrl = parsedUrl || el.url || "/";

                                    return (
                                        <div 
                                            key={el._id} 
                                            onClick={() => handleLoadHistoryItem(el)}
                                            className="p-3.5 bg-transparent flex flex-col gap-2 hover:bg-panel-hover/60 transition-colors border-b border-border-dark last:border-b-0 cursor-pointer select-none"
                                        >
                                            {/* Method,Path & Status */}
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border font-mono tracking-wide uppercase shrink-0 ${mStyle}`}>
                                                        {el.method}
                                                    </span>
                                                    <span className="text-[11px] font-medium text-text-white truncate font-mono" title={el.url}>
                                                        {displayUrl}
                                                    </span>
                                                </div>
                                                <span className={`text-[11px] font-extrabold font-mono shrink-0 ${el.status >= 200 && el.status < 300 ? "text-success" : el.status >= 300 && el.status < 400 ? "text-accent-blue" : "text-danger"}`}>
                                                    {el.status}
                                                </span>
                                            </div>

                                            {/* Latency, Size, Execution Time */}
                                            <div className="grid grid-cols-3 w-full text-[10px] text-text-muted font-mono">
                                                <div className="text-left">{el.responseTime}ms</div>
                                                <div className="text-center">{el.responseSize !== undefined ? `${(el.responseSize / 1024).toFixed(2)} KB` : "0.00 KB"}</div>
                                                <div className="text-right">{formatTime(el.createdAt)}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 text-center gap-1.5 min-h-40">
                                <Clock className="size-6 text-text-disabled" />
                                <span className="text-xs text-text-muted">No request history for this workspace.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
