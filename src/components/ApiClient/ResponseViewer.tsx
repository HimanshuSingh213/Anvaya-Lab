"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Check, Copy, Clock, Database, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadJson } from "./downloadJson";
import { codeToHtml } from "shiki";

interface ApiResponseData {
    status: number;
    statusText: string;
    time: number;
    size: number;
    headers: Record<string, string | string[]>;
    body: unknown;
}

interface ResponseViewerProps {
    response: ApiResponseData | null;
    executing: boolean;
}

export default function ResponseViewer({ response, executing }: ResponseViewerProps) {
    const [activeTab, setActiveTab] = useState<"pretty" | "raw" | "headers">("pretty");
    const [responseCopied, setResponseCopied] = useState(false);

    const [prettyHtml, setPrettyHtml] = useState("");
    const [rawHtml, setRawHtml] = useState("");

    const prettyString = response ? (
        typeof response.body === "object" 
            ? JSON.stringify(response.body, null, 2) 
            : String(response.body)
    ) : "";

    const rawString = response ? (
        typeof response.body === "object" 
            ? JSON.stringify(response.body) 
            : String(response.body)
    ) : "";

    useEffect(() => {
        if (!response) {
            return;
        }

        let active = true;

        // Check if payload is valid JSON (to set correct language highlighter)
        let isJson = false;
        if (typeof response.body === "object") {
            isJson = true;
        } else {
            try {
                JSON.parse(prettyString);
                isJson = true;
            } catch {}
        }

        const lang = isJson ? "json" : "text";

        // Highlight both pretty and raw in parallel
        Promise.all([
            codeToHtml(prettyString, { lang, theme: "github-dark-high-contrast" }),
            codeToHtml(rawString, { lang, theme: "github-dark-high-contrast" })
        ]).then(([prettyCodeHtml, rawCodeHtml]) => {
            if (active) {
                setPrettyHtml(prettyCodeHtml);
                setRawHtml(rawCodeHtml);
            }
        }).catch(err => {
            console.error("Shiki response highlight error:", err);
            if (active) {
                setPrettyHtml("");
                setRawHtml("");
            }
        });

        return () => { active = false; };
    }, [response, prettyString, rawString]);

    // Copy Response Body helper
    const handleCopyResponse = async () => {
        if (!response || !response.body) return;
        try {
            const content = typeof response.body === "object" 
                ? JSON.stringify(response.body, null, 2) 
                : String(response.body);
            await navigator.clipboard.writeText(content);
            setResponseCopied(true);
            toast.success("Response body copied to clipboard");
            setTimeout(() => setResponseCopied(false), 2000);
        } catch {
            toast.error("Failed to copy response body to clipboard");
        }
    };

    // Download Response payload helper
    const handleDownloadResponse = () => {
        if (!response || !response.body) return;
        try {
            const content = typeof response.body === "object"
                ? JSON.stringify(response.body, null, 2)
                : String(response.body);
            
            downloadJson(content, `response-${Date.now()}.json`)

            toast.success("Response payload downloaded successfully");
        } catch {
            toast.error("Failed to download response payload");
        }
    };

    return (
        <div className="border-t border-border-dark pt-4 flex flex-col gap-4 animate-in fade-in duration-300">
            {/* Top Bar: Response State and Stats */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] text-text-muted font-mono tracking-wider uppercase font-semibold">Response State</span>
                    
                    <div className="flex items-center gap-4">
                        {/* Status Badge */}
                        {response ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                response.status >= 200 && response.status < 300 
                                    ? "text-success bg-[#0e2a18] border border-[#1e522e]" 
                                    : "text-danger bg-[#2a0e0e] border border-[#521e1e]"
                            }`}>
                                {response.status} {response.statusText}
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-panel-charcoal border border-border-dark text-text-muted">
                                —
                            </span>
                        )}
                        
                        {/* Clock Latency */}
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-grey font-bold">
                            <Clock className="size-3.5 text-text-muted" />
                            <span>{response ? `${response.time} ms` : "— ms"}</span>
                        </div>

                        {/* Size indicator */}
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-grey font-bold">
                            <Database className="size-3.5 text-text-muted" />
                            <span>
                                {response 
                                    ? (response.size < 1024 ? `${response.size} B` : `${(response.size / 1024).toFixed(2)} KB`)
                                    : "— B"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right side Action buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownloadResponse}
                        disabled={!response}
                        className="p-1.5 bg-panel-charcoal border border-border-dark hover:border-border-hover rounded text-text-muted hover:text-text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download response"
                    >
                        <Download className="size-3.5" />
                    </button>
                    <button
                        onClick={handleCopyResponse}
                        disabled={!response}
                        className="p-1.5 bg-panel-charcoal border border-border-dark hover:border-border-hover rounded text-text-muted hover:text-text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Copy response body"
                    >
                        {responseCopied ? (
                            <Check className="size-3.5 text-success" />
                        ) : (
                            <Copy className="size-3.5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Tab Selectors */}
            <div className="flex border-b border-border-dark">
                {([
                    { id: "pretty", label: "Pretty" },
                    { id: "raw", label: "Raw" },
                    { id: "headers", label: "Headers" }
                ] as const).map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                                isActive 
                                    ? "border-text-white text-text-white font-semibold" 
                                    : "border-transparent text-text-muted hover:text-text-grey"
                            }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Contents View */}
            {executing ? (
                <div className="flex items-center justify-center h-[200px] text-text-muted">
                    <Loader2 className="size-5 animate-spin" />
                </div>
            ) : (
                <div className="h-[200px] min-h-[200px] max-h-[200px] overflow-hidden flex flex-col">
                    
                    {/* Pretty tab view */}
                    {activeTab === "pretty" && (
                        <div className="bg-bg-black h-full overflow-y-scroll custom-editor-scrollbar select-text text-text-white">
                            {response ? (
                                prettyHtml ? (
                                    <div dangerouslySetInnerHTML={{ __html: prettyHtml }} className="shiki-container text-[11px]" />
                                ) : (
                                    <pre className="whitespace-pre-wrap break-all font-mono text-[11px] leading-[18px]">
                                        {prettyString}
                                    </pre>
                                )
                            ) : (
                                <div className="text-text-muted font-mono text-[11px] italic">
                                    {"// No response body. Click \"Send\" above to run this request."}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Raw tab view */}
                    {activeTab === "raw" && (
                        <div className="bg-bg-black h-full overflow-y-scroll custom-editor-scrollbar select-text text-text-white">
                            {response ? (
                                rawHtml ? (
                                    <div dangerouslySetInnerHTML={{ __html: rawHtml }} className="shiki-container text-[11px]" />
                                ) : (
                                    <pre className="whitespace-pre-wrap break-all font-mono text-[11px] leading-[18px]">
                                        {rawString}
                                    </pre>
                                )
                            ) : (
                                <div className="text-text-muted font-mono text-[11px] italic">
                                    {"// No response body."}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Headers tab view */}
                    {activeTab === "headers" && (
                        <div className="h-full overflow-y-scroll custom-editor-scrollbar">
                            <table className="w-full text-left border-collapse bg-bg-black text-[11px]">
                                <thead>
                                    <tr className="border-b border-border-dark font-mono text-text-muted uppercase text-[10px]">
                                        <th className="py-2 px-3 font-bold w-1/3">Header Key</th>
                                        <th className="py-2 px-3 font-bold">Value</th>
                                    </tr>
                                </thead>
                                {response ? (
                                    <tbody>
                                        {Object.entries(response.headers).map(([key, val]) => (
                                            <tr key={key} className="border-b border-border-dark/40 hover:bg-panel-hover transition-colors select-text">
                                                <td className="py-2 px-3 text-text-muted font-mono">{key}</td>
                                                <td className="py-2 px-3 text-text-white font-semibold font-mono">{String(val)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                ) : (
                                    <tbody>
                                        <tr>
                                            <td colSpan={2} className="py-4 text-center text-text-disabled italic font-mono text-[11px]">
                                                No response headers available.
                                            </td>
                                        </tr>
                                    </tbody>
                                )}
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
