"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Edit2, Plus, Trash2, Globe, ChevronDown,
    Play, Loader2, Check, X, Lock, Key,
    Clock, AlertTriangle,
} from "lucide-react";
import { useApp } from "@/app/Context/UserContext";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { ApiResponse } from "@/types/ApiResponse";
import ResponseViewer from "./ResponseViewer";
import { useDebounce } from "@uidotdev/usehooks";
import { requestSchema } from "@/validations/request.validation";

interface InlineEditProps {
    value: string;
    onSave: (val: string) => void;
    className?: string;
    inputClassName?: string;
    placeholder?: string;
    isTextArea?: boolean;
}

function InlineEdit({
    value,
    onSave,
    className = "",
    inputClassName = "",
    placeholder = "",
    isTextArea = false
}: InlineEditProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    useEffect(() => {
        setTempValue(value);
    }, [value]);

    const handleSave = () => {
        setIsEditing(false);
        onSave(tempValue);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setTempValue(value);
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1.5 w-full max-w-xl transition-all">
                {isTextArea ? (
                    <textarea
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSave();
                            }
                            if (e.key === "Escape") handleCancel();
                        }}
                        className={`flex-1 bg-panel-charcoal border border-border-dark rounded px-2 py-1 outline-none text-text-white focus:border-border-active resize-y ${inputClassName}`}
                        placeholder={placeholder}
                        autoFocus
                    />
                ) : (
                    <input
                        type="text"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave();
                            if (e.key === "Escape") handleCancel();
                        }}
                        className={`flex-1 bg-panel-charcoal border border-border-dark rounded px-2 py-1 outline-none text-text-white focus:border-border-active ${inputClassName}`}
                        placeholder={placeholder}
                        autoFocus
                    />
                )}
                <div className="flex items-center gap-0.5 shrink-0">
                    <button
                        onClick={handleSave}
                        className="p-1 rounded hover:bg-panel-hover text-success transition-colors cursor-pointer"
                        title="Save"
                    >
                        <Check className="size-3.5" />
                    </button>
                    <button
                        onClick={handleCancel}
                        className="p-1 rounded hover:bg-panel-hover text-danger transition-colors cursor-pointer"
                        title="Cancel"
                    >
                        <X className="size-3.5" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`group/edit cursor-pointer hover:bg-panel-hover px-2 py-1 -mx-2 rounded transition-all duration-150 border border-transparent flex items-center gap-1.5 w-fit ${className}`}
        >
            <span className={tempValue ? "text-text-white font-semibold" : "text-text-muted italic"}>
                {tempValue || placeholder || "Click to edit"}
            </span>
            <Edit2 className="size-3 text-text-muted opacity-0 group-hover/edit:opacity-100 transition-opacity shrink-0" />
        </div>
    );
}

// HTTP Method styles using global CSS variables
const methodStyles: Record<string, { text: string; bg: string; border: string; hoverText: string; dot: string }> = {
    GET: { text: "text-method-get", bg: "bg-method-get/10", border: "border-method-get/20", hoverText: "hover:text-method-get", dot: "bg-method-get" },
    POST: { text: "text-method-post", bg: "bg-method-post/10", border: "border-method-post/20", hoverText: "hover:text-method-post", dot: "bg-method-post" },
    PUT: { text: "text-method-put", bg: "bg-method-put/10", border: "border-method-put/20", hoverText: "hover:text-method-put", dot: "bg-method-put" },
    PATCH: { text: "text-method-patch", bg: "bg-method-patch/10", border: "border-method-patch/20", hoverText: "hover:text-method-patch", dot: "bg-method-patch" },
    DELETE: { text: "text-method-delete", bg: "bg-method-delete/10", border: "border-method-delete/20", hoverText: "hover:text-method-delete", dot: "bg-method-delete" },
};

const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const authTypes = [
    { value: "none", label: "No Auth" },
    { value: "bearer", label: "Bearer Token" },
    { value: "apikey", label: "API Key Credentials" }
];

export default function RequestCreator() {
    const {
        requestDraft,
        setRequestDraft,
        activeResponse: response,
        setActiveResponse: setResponse,
        activeWorkspace,
        fetchHistory,
        activeRequest,
        setActiveRequest,
        requestName: name,
        setRequestName: setName,
        requestDescription: description,
        setRequestDescription: setDescription,
        resolveEnv,
        requestAgent,
        setRequestAgent
    } = useApp();
    const searchParams = useSearchParams();
    const reqId = searchParams.get("reqId");
    const colId = searchParams.get("colId");

    // UI States
    const [urlInput, setUrlInput] = useState("");
    const [methodDropdownOpen, setMethodDropdownOpen] = useState(false);
    const [authDropdownOpen, setAuthDropdownOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"params" | "headers" | "auth" | "body">("params");
    const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");

    // Request Execution Agent States
    const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);
    const [showCorsModal, setShowCorsModal] = useState(false);

    // Response Execution States
    const [executing, setExecuting] = useState(false);

    // Refs for Dropdowns and scroll syncing
    const methodDropdownRef = useRef<HTMLDivElement>(null);
    const authDropdownRef = useRef<HTMLDivElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (methodDropdownRef.current && !methodDropdownRef.current.contains(e.target as Node)) {
                setMethodDropdownOpen(false);
            }
            if (authDropdownRef.current && !authDropdownRef.current.contains(e.target as Node)) {
                setAuthDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Sync scroll of textarea and line numbers
    const handleTextareaScroll = () => {
        if (textareaRef.current && lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    // Calculate line numbers for JSON editor
    const lineCount = requestDraft.body?.content ? requestDraft.body.content.split("\n").length : 1;
    const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

    // Load active request details using existing collection API and filtering by ID
    useEffect(() => {
        if (activeRequest === (reqId || "") && requestDraft.url && (reqId ? requestDraft.url !== "" : true)) {
            return;
        }

        setActiveRequest(reqId || "");

        if (!reqId || !colId) {
            setName("GET Request");
            setDescription("Retrieves public profile details of GitHub user 'Hitesh Choudhary'.");
            const initialUrl = "https://api.github.com/users/hiteshchoudhary";
            setUrlInput(initialUrl);
            setRequestDraft({
                url: initialUrl,
                method: "GET",
                headers: [],
                queryParams: [
                    { key: "parameter_key", value: "value", isEnabled: true }
                ],
                body: { type: "none", content: "" },
                authentication: { type: "none" }
            });
            setResponse(null);
            return;
        }

        const fetchRequest = async () => {
            try {
                // Call the existing endpoint
                const res = await axios.get<ApiResponse>(`/api/requests?collectionId=${colId}`);
                if (res.data.success && Array.isArray(res.data.data)) {
                    // Filter in frontend to find request by reqId
                    const reqData = res.data.data.find((r: any) => r._id === reqId);
                    if (reqData) {
                        setName(reqData.name || "Unnamed Request");
                        setDescription(reqData.description || "");

                        const draftData = {
                            url: reqData.url || "",
                            method: reqData.method || "GET",
                            headers: reqData.headers || [],
                            queryParams: reqData.queryParams || [],
                            body: reqData.body || { type: "none", content: "" },
                            authentication: reqData.authentication || { type: "none" }
                        };
                        setRequestDraft(draftData);

                        // Construct and set full URL representation
                        const fullUrl = buildFullUrl(reqData.url || "", reqData.queryParams || []);
                        setUrlInput(fullUrl);
                        setResponse(null);
                        setSaveStatus("saved");
                    }
                }
            } catch (err: any) {
                toast.error(err.response?.data?.error || err.message || "Failed to load request details");
            }
        };

        fetchRequest();
    }, [reqId, colId]);

    // Parse URL query parameters into Draft query params array
    const parseUrlParams = (fullUrl: string, existingParams: Array<any>) => {
        let baseUrl = fullUrl;
        const params: Array<any> = [];
        const qIndex = fullUrl.indexOf("?");
        if (qIndex !== -1) {
            baseUrl = fullUrl.substring(0, qIndex);
            const queryString = fullUrl.substring(qIndex + 1);
            const searchParamsObj = new URLSearchParams(queryString);
            searchParamsObj.forEach((value, key) => {
                const match = existingParams.find(p => p.key === key && p.value === value);
                params.push({
                    key,
                    value,
                    isEnabled: match ? (match.isEnabled ?? true) : true
                });
            });
        }
        return { baseUrl, params };
    };

    // Rebuild full URL including active query parameters
    const buildFullUrl = (baseUrl: string, queryParams: Array<any>) => {
        const enabledParams = queryParams.filter(p => p.isEnabled && p.key);
        if (enabledParams.length === 0) return baseUrl;

        const queryString = enabledParams
            .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
            .join("&");

        return baseUrl.includes("?")
            ? `${baseUrl}&${queryString}`
            : `${baseUrl}?${queryString}`;
    };

    // Sync urlInput when requestDraft updates externally (e.g. from history click)
    useEffect(() => {
        const fullUrl = buildFullUrl(requestDraft.url || "", requestDraft.queryParams || []);
        if (fullUrl !== urlInput) {
            setUrlInput(fullUrl);
        }
    }, [requestDraft.url, requestDraft.queryParams, urlInput]);

    // Handle user manual editing of URL string
    const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fullUrlVal = e.target.value;
        setUrlInput(fullUrlVal);
        setSaveStatus("unsaved");

        const { baseUrl, params } = parseUrlParams(fullUrlVal, requestDraft.queryParams || []);

        setRequestDraft(prev => ({
            ...prev,
            url: baseUrl,
            queryParams: params
        }));
    };

    // Update query parameters array and sync the full URL input box
    const updateQueryParams = (newParams: Array<any>) => {
        const fullUrl = buildFullUrl(requestDraft.url, newParams);
        setUrlInput(fullUrl);
        setRequestDraft(prev => ({
            ...prev,
            queryParams: newParams
        }));
        setSaveStatus("unsaved");
    };

    // Update headers array
    const updateHeaders = (newHeaders: Array<any>) => {
        setRequestDraft(prev => ({ ...prev, headers: newHeaders }));
        setSaveStatus("unsaved");
    };

    // Update authentication configurations
    const handleAuthChange = (field: string, value: string) => {
        setRequestDraft(prev => ({
            ...prev,
            authentication: {
                ...(prev.authentication || { type: "none" }),
                [field]: value
            }
        }));
        setSaveStatus("unsaved");
    };

    // Update Request Body
    const handleBodyChange = (field: string, value: string) => {
        setRequestDraft(prev => ({
            ...prev,
            body: {
                ...(prev.body || { type: "none", content: "" }),
                [field]: value
            }
        }));
        setSaveStatus("unsaved");
    };

    // Persist changes to database
    const saveRequestToDb = async (updatedName?: string, updatedDescription?: string) => {
        if (!reqId) return;

        // Resolve environment variables before validating and saving
        let resolvedUrl = resolveEnv(requestDraft.url || "");
        if (resolvedUrl && !/^https?:\/\//i.test(resolvedUrl)) {
            resolvedUrl = "http://" + resolvedUrl;
        }

        const resolvedQueryParams = (requestDraft.queryParams || []).map(p => ({
            ...p,
            value: resolveEnv(p.value || "")
        }));
        const resolvedHeaders = (requestDraft.headers || []).map(h => ({
            ...h,
            value: resolveEnv(h.value || "")
        }));
        const resolvedBody = {
            ...requestDraft.body,
            content: resolveEnv(requestDraft.body?.content || "")
        };
        const resolvedAuthentication = requestDraft.authentication ? {
            ...requestDraft.authentication,
            value: resolveEnv(requestDraft.authentication.value || ""),
            key: resolveEnv(requestDraft.authentication.key || ""),
            username: resolveEnv(requestDraft.authentication.username || ""),
            password: resolveEnv(requestDraft.authentication.password || "")
        } : undefined;

        const patchPayload = {
            collectionId: colId || undefined,
            name: updatedName !== undefined ? updatedName : name,
            description: updatedDescription !== undefined ? updatedDescription : description,
            url: resolvedUrl,
            method: requestDraft.method,
            queryParams: resolvedQueryParams,
            headers: resolvedHeaders,
            body: resolvedBody,
            authentication: resolvedAuthentication
        };

        // Validate the payload using the unified Zod validation schema
        const validationResult = requestSchema.partial().safeParse(patchPayload);
        if (!validationResult.success) {
            setSaveStatus("error");
            return; // Skip saving to database if any field is invalid
        }

        setSaveStatus("saving");
        try {
            const res = await axios.patch(`/api/requests?id=${reqId}`, patchPayload);
            if (res.data.success) {
                setSaveStatus("saved");
            } else {
                setSaveStatus("error");
            }
        } catch (err: any) {
            setSaveStatus("error");
        }
    };

    const debouncedRequestDraft = useDebounce(requestDraft, 1500);

    // Auto-save changes for draft adjustments (url, params, headers, body, auth)
    useEffect(() => {
        if (!reqId) return;
        if (saveStatus === "unsaved") {
            saveRequestToDb();
        }
    }, [debouncedRequestDraft, reqId]);

    // Send HTTP Request
    const handleSendRequest = async () => {
        setExecuting(true);
        setResponse(null);

        // Resolving environment variables before sending
        let resolvedUrl = resolveEnv(requestDraft.url || "");
        if (resolvedUrl && !/^https?:\/\//i.test(resolvedUrl)) {
            resolvedUrl = "http://" + resolvedUrl;
        }
        const resolvedQueryParams = (requestDraft.queryParams || []).map(p => ({
            ...p,
            value: resolveEnv(p.value || "")
        }));
        const resolvedHeaders = (requestDraft.headers || []).map(h => ({
            ...h,
            value: resolveEnv(h.value || "")
        }));
        const resolvedBody = {
            ...requestDraft.body,
            content: resolveEnv(requestDraft.body?.content || "")
        };
        const resolvedAuthentication = requestDraft.authentication ? {
            ...requestDraft.authentication,
            value: resolveEnv(requestDraft.authentication.value || ""),
            key: resolveEnv(requestDraft.authentication.key || ""),
            username: resolveEnv(requestDraft.authentication.username || ""),
            password: resolveEnv(requestDraft.authentication.password || "")
        } : undefined;

        if (requestAgent === "proxy") {
            try {
                const res = await axios.post("/api/requests/run", {
                    workspaceId: activeWorkspace?._id || "",
                    url: resolvedUrl,
                    method: requestDraft.method,
                    queryParams: resolvedQueryParams,
                    headers: resolvedHeaders,
                    body: resolvedBody,
                    authentication: resolvedAuthentication
                });
                if (res.data.success && res.data.data) {
                    const runnerData = res.data.data;
                    setResponse(runnerData);

                    await axios.post("/api/history", {
                        workspaceId: activeWorkspace?._id || "",
                        url: buildFullUrl(resolvedUrl, resolvedQueryParams || []),
                        method: requestDraft.method,
                        headers: JSON.stringify(resolvedHeaders || []),
                        body: typeof resolvedBody.content === "string" ? resolvedBody.content : JSON.stringify(resolvedBody || {}),
                        status: runnerData.status,
                        responseTime: runnerData.time,
                        responseSize: runnerData.size || 0,
                        response: typeof runnerData.body === 'string' ? runnerData.body : JSON.stringify(runnerData.body || "")
                    });

                    fetchHistory();
                } else {
                    toast.error("Failed to retrieve request response.");
                }
            } catch (err: any) {
                const errMsg = err.response?.data?.error || err.message || "";
                if (errMsg.includes("private") || errMsg.includes("local network") || errMsg.includes("restricted")) {
                    toast.error("Private Network Request Blocked", {
                        description: "The Server Proxy cannot access local/private resources. To test localhost or local endpoints, click the arrow on the 'Send' button and toggle the agent to 'Browser Direct'.",
                        duration: 8000
                    });
                } else {
                    toast.error(errMsg || "Failed to execute request.");
                }
            } finally {
                setExecuting(false);
            }
        } else {
            const startTime = performance.now();
            try {
                const finalUrl = buildFullUrl(resolvedUrl, resolvedQueryParams || []);
                
                const headersMap: Record<string, string> = {};
                resolvedHeaders?.forEach(h => {
                    if (h.isEnabled && h.key) headersMap[h.key] = h.value;
                });

                if (resolvedAuthentication?.type === "bearer" && resolvedAuthentication.value) {
                    headersMap["Authorization"] = `Bearer ${resolvedAuthentication.value}`;
                } else if (resolvedAuthentication?.type === "basic") {
                    const creds = btoa(`${resolvedAuthentication.username || ""}:${resolvedAuthentication.password || ""}`);
                    headersMap["Authorization"] = `Basic ${creds}`;
                } else if (resolvedAuthentication?.type === "apikey" && resolvedAuthentication.key && resolvedAuthentication.value) {
                    headersMap[resolvedAuthentication.key] = resolvedAuthentication.value;
                }

                let requestBody: any = undefined;
                if (resolvedBody && resolvedBody.type !== "none") {
                    if (resolvedBody.type === "json") {
                        headersMap["Content-Type"] = "application/json";
                        requestBody = resolvedBody.content || "";
                    } else if (resolvedBody.type === "x-www-form-urlencoded") {
                        headersMap["Content-Type"] = "application/x-www-form-urlencoded";
                        requestBody = resolvedBody.content || "";
                    } else {
                        headersMap["Content-Type"] = "text/plain";
                        requestBody = resolvedBody.content || "";
                    }
                }

                const fetchRes = await fetch(finalUrl, {
                    method: requestDraft.method,
                    headers: headersMap,
                    body: requestDraft.method !== "GET" && requestDraft.method !== "DELETE" ? requestBody : undefined,
                    mode: "cors"
                });

                const responseText = await fetchRes.text();
                const endTime = performance.now();
                const duration = Math.round(endTime - startTime);

                let parsedBody = responseText;
                try {
                    parsedBody = JSON.parse(responseText);
                } catch {}

                const headersObj: Record<string, string> = {};
                fetchRes.headers.forEach((val, key) => {
                    headersObj[key] = val;
                });

                const runnerData = {
                    status: fetchRes.status,
                    statusText: fetchRes.statusText || (fetchRes.status === 200 ? "OK" : ""),
                    time: duration,
                    size: responseText.length,
                    headers: headersObj,
                    body: parsedBody
                };

                setResponse(runnerData);

                await axios.post("/api/history", {
                    workspaceId: activeWorkspace?._id || "",
                    url: finalUrl,
                    method: requestDraft.method,
                    headers: JSON.stringify(resolvedHeaders || []),
                    body: typeof resolvedBody.content === "string" ? resolvedBody.content : JSON.stringify(resolvedBody || {}),
                    status: runnerData.status,
                    responseTime: runnerData.time,
                    responseSize: runnerData.size || 0,
                    response: responseText
                });

                fetchHistory();
            } catch (err: any) {
                const isLocal = requestDraft.url.includes("localhost") || requestDraft.url.includes("127.0.0.1");
                if (isLocal) {
                    setShowCorsModal(true);
                } else {
                    toast.error("Direct browser execution failed. This usually happens if the server hasn't enabled CORS or is unreachable.");
                }
            } finally {
                setExecuting(false);
            }
        }
    };

    const activeStyles = methodStyles[requestDraft.method] || methodStyles.GET;

    return (
        <div className="flex-1 flex flex-col h-full bg-bg-black text-text-white p-4 overflow-hidden select-none">
            {/* Header: Request name, description & save status */}
            <div className="flex flex-col border-b border-border-dark pb-2 mb-3" data-tour="request-metadata">
                <div className="flex items-center gap-3">
                    <InlineEdit
                        value={name}
                        onSave={(val) => {
                            const newName = val || "Unnamed Request";
                            setName(newName);
                            saveRequestToDb(newName, description);
                        }}
                        placeholder="Enter request name..."
                        className="text-xs font-semibold min-h-[22px] w-fit tracking-tight"
                        inputClassName="text-xs font-semibold w-[350px] h-7 px-2 py-0.5"
                    />

                    {/* Auto-save Status indicator badge */}
                    {reqId && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono border border-border-dark bg-panel-charcoal">
                            {saveStatus === "saving" && (
                                <>
                                    <Loader2 className="size-3 animate-spin text-warning" />
                                    <span className="text-warning">Saving...</span>
                                </>
                            )}
                            {saveStatus === "saved" && (
                                <>
                                    <Check className="size-3 text-success" />
                                    <span className="text-success">Saved</span>
                                </>
                            )}
                            {saveStatus === "unsaved" && (
                                <>
                                    <span className="size-1 bg-text-muted rounded-full" />
                                    <span className="text-text-muted">Unsaved</span>
                                </>
                            )}
                            {saveStatus === "error" && (
                                <>
                                    <span className="text-danger">Save Failed</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
                <InlineEdit
                    value={description}
                    onSave={(val) => {
                        setDescription(val);
                        saveRequestToDb(name, val);
                    }}
                    placeholder="Add a request description..."
                    className="text-[10px] text-text-muted min-h-[16px] w-fit mt-0.5"
                    inputClassName="text-[10px] w-[500px] h-6 px-2 py-0.5"
                />
            </div>

            {/* Request controls (Method selector dropdown + URL + Send button) */}
            <div className="flex items-center gap-2 mb-4">
                {/* Custom HTTP Method Dropdown */}
                <div className="relative shrink-0" ref={methodDropdownRef}>
                    <button
                        onClick={() => setMethodDropdownOpen(!methodDropdownOpen)}
                        className={`flex items-center justify-between gap-1.5 px-2.5 h-8 bg-panel-charcoal border border-border-dark rounded-md text-[10px] font-bold cursor-pointer transition-colors duration-150 select-none ${activeStyles.text} hover:bg-panel-hover`}
                    >
                        <span>{requestDraft.method}</span>
                        <ChevronDown className="size-3 text-text-muted shrink-0" />
                    </button>

                    {methodDropdownOpen && (
                        <div className="absolute left-0 mt-1 w-[100px] bg-panel-charcoal border border-border-dark rounded-md shadow-2xl p-1 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                            {methods.map((m) => {
                                const mStyles = methodStyles[m];
                                return (
                                    <button
                                        key={m}
                                        onClick={() => {
                                            setRequestDraft(prev => ({ ...prev, method: m }));
                                            setMethodDropdownOpen(false);
                                            setSaveStatus("unsaved");
                                        }}
                                        className="flex items-center gap-1.5 w-full text-left px-2 py-1.5 text-[10px] rounded transition-colors text-text-grey hover:text-text-white hover:bg-panel-hover"
                                    >
                                        <span className={`size-1.5 rounded-full shrink-0 ${mStyles.dot}`} />
                                        <span className={`font-bold ${mStyles.text}`}>{m}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* URL input field with Globe icon inside */}
                <div 
                data-tour="url-bar"
                className="flex-1 flex items-center bg-panel-charcoal border border-border-dark focus-within:border-border-hover rounded-md px-2.5 h-8 transition-all">
                    <Globe className="size-3.5 text-text-muted mr-2 shrink-0" />
                    <input
                        type="text"
                        value={urlInput}
                        onChange={handleUrlInputChange}
                        placeholder="https://api.example.com/endpoint"
                        className="flex-1 bg-transparent text-xs font-mono text-text-white outline-none border-none h-full placeholder:text-text-disabled"
                    />
                </div>

                {/* Split Send button with Agent options */}
                <div 
                data-tour="send-button"
                className="flex items-center shrink-0 relative">
                    <button
                        onClick={handleSendRequest}
                        disabled={executing}
                        className="bg-text-white hover:bg-text-white/90 text-bg-black text-[10px] font-bold rounded-l-md px-3 h-8 flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-75 disabled:cursor-not-allowed border-r border-border-dark"
                    >
                        {executing ? (
                            <Clock className="size-3 animate-spin" />
                        ) : (
                            <Play className="size-3 fill-bg-black stroke-bg-black" />
                        )}
                        <span>{executing ? "Sending" : "Send"}</span>
                    </button>
                    <button
                        onClick={() => setAgentDropdownOpen(!agentDropdownOpen)}
                        className="bg-text-white hover:bg-text-white/90 text-bg-black rounded-r-md px-2 h-8 flex items-center justify-center cursor-pointer transition-colors"
                        title="Execution Agent"
                    >
                        <ChevronDown className="size-3 text-bg-black" />
                    </button>

                    {/* Agent Dropdown Menu */}
                    {agentDropdownOpen && (
                        <div className="absolute right-0 top-9 w-40 bg-panel-charcoal border border-border-dark rounded-md shadow-lg py-1 z-50">
                            <div className="px-2 py-1 text-[9px] uppercase tracking-wider text-text-disabled font-semibold">
                                Request Agent
                            </div>
                            <button
                                onClick={() => {
                                    setRequestAgent("proxy");
                                    setAgentDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                                    requestAgent === "proxy" ? "text-text-white bg-panel-hover" : "text-text-grey hover:text-text-white hover:bg-panel-hover/50"
                                }`}
                            >
                                <span>Server Proxy</span>
                                {requestAgent === "proxy" && <Check className="size-3 text-text-white" />}
                            </button>
                            <button
                                onClick={() => {
                                    setRequestAgent("direct");
                                    setAgentDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                                    requestAgent === "direct" ? "text-text-white bg-panel-hover" : "text-text-grey hover:text-text-white hover:bg-panel-hover/50"
                                }`}
                            >
                                <span>Browser Direct</span>
                                {requestAgent === "direct" && <Check className="size-3 text-text-white" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tab selection selectors */}
            <div className="flex border-b border-border-dark mb-3 shrink-0" data-tour="request-option-tabs">
                {[
                    { id: "params", label: "Query Params" },
                    { id: "headers", label: "Headers" },
                    { id: "auth", label: "Authorization" },
                    { id: "body", label: "Body" }
                ].map(t => {
                    const isActive = activeTab === t.id;
                    return (
                        <button
                            key={t.id}
                            data-tour-request-tab={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            className={`px-3 py-1.5 text-[10px] font-medium border-b-2 transition-all cursor-pointer ${isActive
                                ? "border-text-white text-text-white font-semibold"
                                : "border-transparent text-text-muted hover:text-text-grey"
                                }`}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab content view container */}
            <div className="flex-1 min-h-0 mb-4 overflow-y-auto custom-editor-scrollbar shrink-0">

                {/* Query Params Tab View */}
                {activeTab === "params" && (
                    <div className="space-y-3">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border-dark text-[9px] font-mono tracking-wider uppercase text-text-muted">
                                        <th className="py-2 px-2 w-12 text-center">Active</th>
                                        <th className="py-2 px-2 w-1/2">Key</th>
                                        <th className="py-2 px-2 w-1/2">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(requestDraft.queryParams || []).map((param, index) => (
                                        <tr key={index} className="border-b border-border-dark/60 hover:bg-panel-hover transition-colors group">
                                            <td className="py-1.5 px-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={param.isEnabled}
                                                    onChange={(e) => {
                                                        const copy = [...(requestDraft.queryParams || [])];
                                                        copy[index].isEnabled = e.target.checked;
                                                        updateQueryParams(copy);
                                                    }}
                                                    className="size-3 rounded accent-border-hover cursor-pointer bg-panel-charcoal border border-border-dark"
                                                />
                                            </td>
                                            <td className="py-1.5 px-2">
                                                <input
                                                    type="text"
                                                    value={param.key}
                                                    onChange={(e) => {
                                                        const copy = [...(requestDraft.queryParams || [])];
                                                        copy[index].key = e.target.value;
                                                        updateQueryParams(copy);
                                                    }}
                                                    placeholder="parameter_key"
                                                    className="w-full bg-transparent border-none text-[10px] font-mono text-text-white outline-none focus:outline-none h-6 py-0.5"
                                                />
                                            </td>
                                            <td className="py-1.5 px-2">
                                                <input
                                                    type="text"
                                                    value={param.value}
                                                    onChange={(e) => {
                                                        const copy = [...(requestDraft.queryParams || [])];
                                                        copy[index].value = e.target.value;
                                                        updateQueryParams(copy);
                                                    }}
                                                    placeholder="value"
                                                    className="w-full bg-transparent border-none text-[10px] font-mono text-text-white outline-none focus:outline-none h-6 py-0.5"
                                                />
                                            </td>
                                            <td className="py-1.5 px-2 text-center">
                                                <button
                                                    onClick={() => {
                                                        const copy = (requestDraft.queryParams || []).filter((_, idx) => idx !== index);
                                                        updateQueryParams(copy);
                                                    }}
                                                    className="p-0.5 rounded text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                    title="Delete parameter"
                                                >
                                                    <Trash2 className="size-3" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(requestDraft.queryParams || []).length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-3 text-center text-[10px] text-text-disabled italic">
                                                No query parameters defined.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <button
                            onClick={() => {
                                const copy = [...(requestDraft.queryParams || [])];
                                copy.push({ key: "", value: "", isEnabled: true });
                                updateQueryParams(copy);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 border border-border-dark hover:border-border-hover rounded text-[10px] font-semibold text-text-grey hover:text-white bg-panel-charcoal transition-all cursor-pointer"
                        >
                            <Plus className="size-3" />
                            Add Query Parameter
                        </button>
                    </div>
                )}

                {/* Headers Tab View */}
                {activeTab === "headers" && (
                    <div className="space-y-3">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border-dark text-[9px] font-mono tracking-wider uppercase text-text-muted">
                                        <th className="py-2 px-2 w-12 text-center">Active</th>
                                        <th className="py-2 px-2 w-1/2">Header Key</th>
                                        <th className="py-2 px-2 w-1/2">Header Value</th>
                                        <th className="py-2 px-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(requestDraft.headers || []).map((header, index) => (
                                        <tr key={index} className="border-b border-border-dark/60 hover:bg-panel-hover transition-colors group">
                                            <td className="py-1.5 px-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={header.isEnabled}
                                                    onChange={(e) => {
                                                        const copy = [...(requestDraft.headers || [])];
                                                        copy[index].isEnabled = e.target.checked;
                                                        updateHeaders(copy);
                                                    }}
                                                    className="size-3 rounded accent-border-hover cursor-pointer bg-panel-charcoal border border-border-dark"
                                                />
                                            </td>
                                            <td className="py-1.5 px-2">
                                                <input
                                                    type="text"
                                                    value={header.key}
                                                    onChange={(e) => {
                                                        const copy = [...(requestDraft.headers || [])];
                                                        copy[index].key = e.target.value;
                                                        updateHeaders(copy);
                                                    }}
                                                    placeholder="Header key"
                                                    className="w-full bg-transparent border-none text-[10px] font-mono text-text-white outline-none focus:outline-none h-6 py-0.5"
                                                />
                                            </td>
                                            <td className="py-1.5 px-2">
                                                <input
                                                    type="text"
                                                    value={header.value}
                                                    onChange={(e) => {
                                                        const copy = [...(requestDraft.headers || [])];
                                                        copy[index].value = e.target.value;
                                                        updateHeaders(copy);
                                                    }}
                                                    placeholder="value"
                                                    className="w-full bg-transparent border-none text-[10px] font-mono text-text-white outline-none focus:outline-none h-6 py-0.5"
                                                />
                                            </td>
                                            <td className="py-1.5 px-2 text-center">
                                                <button
                                                    onClick={() => {
                                                        const copy = (requestDraft.headers || []).filter((_, idx) => idx !== index);
                                                        updateHeaders(copy);
                                                    }}
                                                    className="p-0.5 rounded text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                    title="Delete header"
                                                >
                                                    <Trash2 className="size-3" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(requestDraft.headers || []).length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-3 text-center text-[10px] text-text-disabled italic">
                                                No request headers defined.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <button
                            onClick={() => {
                                const copy = [...(requestDraft.headers || [])];
                                copy.push({ key: "", value: "", isEnabled: true });
                                updateHeaders(copy);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 border border-border-dark hover:border-border-hover rounded text-[10px] font-semibold text-text-grey hover:text-white bg-panel-charcoal transition-all cursor-pointer"
                        >
                            <Plus className="size-3" />
                            Add HTTP Header
                        </button>
                    </div>
                )}

                {/* Authorization Tab View */}
                {activeTab === "auth" && (
                    <div className="space-y-3 max-w-md">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] text-text-muted font-mono tracking-wider uppercase">Auth Protocol</label>

                            {/* Custom Auth dropdown */}
                            <div className="relative w-[160px]" ref={authDropdownRef}>
                                <button
                                    onClick={() => setAuthDropdownOpen(!authDropdownOpen)}
                                    className="flex items-center justify-between w-full gap-2 px-2.5 h-8 bg-panel-charcoal border border-border-dark rounded-md text-[10px] text-text-white cursor-pointer hover:bg-panel-hover"
                                >
                                    <span>{authTypes.find(t => t.value === (requestDraft.authentication?.type || "none"))?.label || "No Auth"}</span>
                                    <ChevronDown className="size-3 text-text-muted shrink-0" />
                                </button>

                                {authDropdownOpen && (
                                    <div className="absolute left-0 mt-1 w-full bg-panel-charcoal border border-border-dark rounded-md shadow-2xl p-1 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                                        {authTypes.map((t) => (
                                            <button
                                                key={t.value}
                                                onClick={() => {
                                                    setRequestDraft(prev => ({
                                                        ...prev,
                                                        authentication: {
                                                            type: t.value as any,
                                                            key: "",
                                                            value: "",
                                                            username: "",
                                                            password: ""
                                                        }
                                                    }));
                                                    setAuthDropdownOpen(false);
                                                    setSaveStatus("unsaved");
                                                }}
                                                className={`w-full text-left px-2 py-1.5 text-[10px] rounded transition-colors ${(requestDraft.authentication?.type || "none") === t.value
                                                    ? "bg-panel-active text-text-white font-medium"
                                                    : "text-text-grey hover:text-text-white hover:bg-panel-active/50"
                                                    }`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bearer Token Form */}
                        {requestDraft.authentication?.type === "bearer" && (
                            <div className="flex flex-col gap-1.5 pt-1 animate-in fade-in duration-150">
                                <label className="text-[9px] text-text-muted font-semibold uppercase">Token</label>
                                <div className="flex items-center bg-panel-charcoal border border-border-dark rounded-md px-2.5 h-8 max-w-sm">
                                    <Lock className="size-3 text-text-muted mr-1.5 shrink-0" />
                                    <input
                                        type="password"
                                        value={requestDraft.authentication.value || ""}
                                        onChange={(e) => handleAuthChange("value", e.target.value)}
                                        placeholder="Enter token value"
                                        className="flex-1 bg-transparent text-[10px] font-mono text-text-white outline-none border-none h-full"
                                    />
                                </div>
                            </div>
                        )}

                        {/* API Key Form */}
                        {requestDraft.authentication?.type === "apikey" && (
                            <div className="grid grid-cols-2 gap-3 pt-1 max-w-sm animate-in fade-in duration-150">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[9px] text-text-muted font-semibold uppercase">Key</label>
                                    <div className="flex items-center bg-panel-charcoal border border-border-dark rounded-md px-2.5 h-8">
                                        <Key className="size-3 text-text-muted mr-1.5 shrink-0" />
                                        <input
                                            type="text"
                                            value={requestDraft.authentication.key || ""}
                                            onChange={(e) => handleAuthChange("key", e.target.value)}
                                            placeholder="X-API-Key"
                                            className="flex-1 bg-transparent text-[10px] font-mono text-text-white outline-none border-none h-full"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[9px] text-text-muted font-semibold uppercase">Value</label>
                                    <input
                                        type="text"
                                        value={requestDraft.authentication.value || ""}
                                        onChange={(e) => handleAuthChange("value", e.target.value)}
                                        placeholder="value"
                                        className="bg-panel-charcoal border border-border-dark rounded-md text-[10px] font-mono text-text-white px-2.5 py-1.5 outline-none h-8"
                                    />
                                </div>
                            </div>
                        )}

                        {requestDraft.authentication?.type === "none" && (
                            <div className="p-3 border border-border-dark bg-panel-hover rounded-md text-[10px] text-text-muted leading-relaxed">
                                This request does not use authorization helpers. Headers or query parameters can still be configured manually in their respective tabs.
                            </div>
                        )}
                    </div>
                )}

                {/* Body (JSON) Tab View */}
                {activeTab === "body" && (
                    <div className="flex flex-col h-full gap-1.5">
                        {/* Sub-header labels with Body Type Selector */}
                        <div className="flex items-center justify-between pb-1">
                            <select
                                value={requestDraft.body?.type || "none"}
                                onChange={(e) => {
                                    handleBodyChange("type", e.target.value);
                                }}
                                className="bg-transparent border-none outline-none font-mono text-[10px] text-text-muted uppercase tracking-wider cursor-pointer font-bold focus:outline-none"
                            >
                                <option value="none" className="bg-bg-black text-text-white font-mono text-[10px] uppercase">NONE (NO BODY)</option>
                                <option value="json" className="bg-bg-black text-text-white font-mono text-[10px] uppercase">JSON PAYLOAD BODY</option>
                                <option value="x-www-form-urlencoded" className="bg-bg-black text-text-white font-mono text-[10px] uppercase">FORM URLENCODED BODY</option>
                                <option value="raw" className="bg-bg-black text-text-white font-mono text-[10px] uppercase">RAW PAYLOAD BODY</option>
                            </select>

                            {requestDraft.body?.type === "json" && (
                                <button
                                    onClick={() => {
                                        try {
                                            const content = requestDraft.body?.content || "";
                                            const parsed = JSON.parse(content);
                                            handleBodyChange("content", JSON.stringify(parsed, null, 4));
                                        } catch (err) {
                                            toast.error("Invalid JSON format");
                                        }
                                    }}
                                    className="text-[10px] text-text-muted hover:text-text-white font-mono tracking-wider uppercase cursor-pointer transition-colors"
                                >
                                    Beautify Payload
                                </button>
                            )}
                        </div>

                        {requestDraft.body?.type !== "none" ? (
                            /* Bordered Editor Area matching photo design */
                            <div className="flex bg-bg-black border border-border-dark rounded-md overflow-hidden min-h-[120px] h-[120px] w-full">
                                {/* Line Numbers Column */}
                                <div
                                    ref={lineNumbersRef}
                                    className="w-8 bg-transparent text-right py-1.5 pr-2 text-[11px] font-mono text-text-disabled select-none border-r border-border-dark overflow-hidden"
                                >
                                    {lineNumbers.map(n => (
                                        <div key={n} className="h-[18px] leading-[18px] text-right">{n}</div>
                                    ))}
                                </div>

                                {/* Code Editor Textarea */}
                                <textarea
                                    ref={textareaRef}
                                    value={requestDraft.body?.content || ""}
                                    onChange={(e) => handleBodyChange("content", e.target.value)}
                                    onScroll={handleTextareaScroll}
                                    placeholder={
                                        requestDraft.body?.type === "json"
                                            ? "{\n  \"key\": \"value\"\n}"
                                            : "Enter raw request payload..."
                                    }
                                    className="flex-1 bg-transparent py-1.5 px-2 font-mono text-[11px] text-text-white outline-none border-none resize-none overflow-y-scroll leading-[18px] h-full placeholder:text-text-disabled custom-editor-scrollbar"
                                />
                            </div>
                        ) : (
                            <div className="p-3 border border-border-dark bg-panel-hover rounded-md text-[10px] text-text-muted leading-relaxed">
                                No request body payload. (GET requests typically do not contain body content).
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Response Panel */}
            <ResponseViewer response={response} executing={executing} />

            {/* CORS Warning Modal */}
            {showCorsModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-panel-charcoal border border-border-dark rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
                        <header className="flex items-center gap-2 text-method-delete font-bold">
                            <AlertTriangle className="size-4 shrink-0 text-method-delete" />
                            <h3 className="text-xs text-text-white uppercase tracking-wider">CORS Blocked Request</h3>
                        </header>
                        <p className="text-[10px] text-text-muted leading-relaxed">
                            Your browser blocked direct request to <code className="bg-surface-secondary px-1 py-0.5 rounded text-accent-blue font-mono text-[9px]">{requestDraft.url}</code>. Localhost servers require CORS headers to be allowed by browsers.
                        </p>
                        <div className="space-y-1.5 bg-bg-black/50 p-2.5 rounded border border-border-dark text-[9px] font-mono leading-relaxed">
                            <p className="text-text-white font-semibold">Enable CORS in your local backend:</p>
                            <div className="text-text-muted space-y-1 pt-1">
                                <p><span className="text-accent-blue font-semibold">Express/Node:</span> app.use(require(&apos;cors&apos;)())</p>
                                <p><span className="text-accent-blue font-semibold">FastAPI/Python:</span> Add CORSMiddleware</p>
                                <p><span className="text-accent-blue font-semibold">Flask/Python:</span> CORS(app)</p>
                                <p><span className="text-accent-blue font-semibold">Spring Boot:</span> @CrossOrigin</p>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                            <button
                                onClick={() => setShowCorsModal(false)}
                                className="px-2.5 py-1.5 bg-panel-hover hover:bg-panel-hover/80 text-text-white rounded text-[9px] font-bold cursor-pointer transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
