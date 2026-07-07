"use client";

import { Header, Authentication } from "@/models/Request.model";
import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react";
import axios from "axios";
import { useDebounce } from "@uidotdev/usehooks";

export interface EnvironmentVariable {
    key: string;
    value: string;
    isEnabled: boolean;
    isSecret?: boolean;
}

export interface EnvironmentProfile {
    id: string;
    name: string;
    variables: EnvironmentVariable[];
}

export interface HistoryPayload {
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

export interface RequestDraft {
    url: string;
    method: string;
    headers: Array<Header>;
    queryParams: Array<Header>;
    body: {
        type: string;
        content: string;
    };
    authentication?: Authentication;
}

interface WorkspaceItem {
    _id: string;
    name: string;
    ownerId: string;
}

interface UserContextType {
    activeElement: string;
    setActiveElement: (element: string) => void;
    activeRequest: string;
    setActiveRequest: (element: string) => void;
    requestDraft: RequestDraft;
    setRequestDraft: React.Dispatch<React.SetStateAction<RequestDraft>>;
    snippets: {
        curl: string;
        fetch: string;
        axios: string;
        python: string;
        http: string;
    };
    activeWorkspace: WorkspaceItem | null;
    setActiveWorkspace: React.Dispatch<React.SetStateAction<WorkspaceItem | null>>;
    history: Array<HistoryPayload>;
    setHistory: React.Dispatch<React.SetStateAction<Array<HistoryPayload>>>;
    fetchHistory: (workspaceIdOverride?: string) => Promise<void>;
    loadingHistory: boolean;
    activeResponse: any;
    setActiveResponse: React.Dispatch<React.SetStateAction<any>>;
    workspaces: Array<WorkspaceItem>;
    setWorkspaces: React.Dispatch<React.SetStateAction<Array<WorkspaceItem>>>;
    requestName: string;
    setRequestName: React.Dispatch<React.SetStateAction<string>>;
    requestDescription: string;
    setRequestDescription: React.Dispatch<React.SetStateAction<string>>;
    environments: EnvironmentProfile[];
    setEnvironments: React.Dispatch<React.SetStateAction<EnvironmentProfile[]>>;
    activeEnvironmentId: string | null;
    setActiveEnvironmentId: (id: string | null) => void;
    resolveEnv: (text: string) => string;
    requestAgent: "proxy" | "direct";
    setRequestAgent: React.Dispatch<React.SetStateAction<"proxy" | "direct">>;
}

const defaultDraft: RequestDraft = {
    url: "https://api.github.com/users/HimanshuSingh213",
    method: "GET",
    headers: [],
    queryParams: [],
    body: {
        type: "none",
        content: ""
    },
    authentication: {
        type: "none"
    }
};

const UserContext = createContext<UserContextType | undefined>(undefined);

// Helper to replace double curly braces with environment variable values
const replaceVariables = (text: string, variables: EnvironmentVariable[]): string => {
    if (!text || typeof text !== "string") return text;
    let resolved = text;
    variables.forEach(v => {
        if (v.isEnabled && v.key) {
            // Escape special regex characters in key just in case
            const escapedKey = v.key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`{{\\s*${escapedKey}\\s*}}`, 'g');
            resolved = resolved.replace(regex, v.value);
        }
    });
    return resolved;
};

const generateSnippets = (draft: RequestDraft, activeEnvVariables: EnvironmentVariable[] = []) => {
    const url = replaceVariables(draft.url || "https://api.github.com/users/HimanshuSingh213", activeEnvVariables);
    const method = draft.method || "GET";

    // Parsing query params if any are enabled
    let fullUrl = url;
    const enabledParams = (draft.queryParams || []).filter(p => p.isEnabled !== false && p.key);
    if (enabledParams.length > 0) {
        try {
            // Checking if URL is fully qualified before passing to URL constructor
            let hasProtocol = url.startsWith("http://") || url.startsWith("https://");
            const tempUrl = hasProtocol ? url : `http://${url}`;
            const urlObj = new URL(tempUrl);
            enabledParams.forEach(p => {
                const resolvedVal = replaceVariables(p.value, activeEnvVariables);
                urlObj.searchParams.append(p.key, resolvedVal);
            });
            fullUrl = hasProtocol ? urlObj.toString() : urlObj.toString().replace("http://", "");
        } catch {
            const queryStr = enabledParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(replaceVariables(p.value, activeEnvVariables))}`).join("&");
            fullUrl = url + (url.includes("?") ? "&" : "?") + queryStr;
        }
    }

    // Headers
    const headersList = (draft.headers || []).filter(h => h.isEnabled !== false && h.key).map(h => ({
        key: h.key,
        value: replaceVariables(h.value, activeEnvVariables)
    }));

    // Body content
    const rawBody = draft.body && draft.body.type !== "none" && draft.body.content;
    const bodyContent = rawBody ? replaceVariables(draft.body.content, activeEnvVariables) : "";

    // cURL
    let curl = `curl --request ${method} \\\n  --url '${fullUrl}'`;
    headersList.forEach(h => {
        curl += ` \\\n  --header '${h.key}: ${h.value}'`;
    });
    if (draft.body?.type === "json" && !headersList.some(h => h.key.toLowerCase() === "content-type")) {
        curl += ` \\\n  --header 'Content-Type: application/json'`;
    }
    if (bodyContent) {
        const escapedBody = bodyContent.replace(/'/g, "'\\''");
        curl += ` \\\n  --data '${escapedBody}'`;
    }

    // Fetch
    const fetchHeadersObj: Record<string, string> = {};
    headersList.forEach(h => {
        fetchHeadersObj[h.key] = h.value;
    });
    if (draft.body?.type === "json" && !fetchHeadersObj["Content-Type"] && !fetchHeadersObj["content-type"]) {
        fetchHeadersObj["Content-Type"] = "application/json";
    }

    let fetchOptionsStr = `{\n  method: "${method}"`;
    if (Object.keys(fetchHeadersObj).length > 0) {
        const headersJson = JSON.stringify(fetchHeadersObj, null, 4).replace(/\n/g, "\n  ");
        fetchOptionsStr += `,\n  headers: ${headersJson}`;
    }
    if (bodyContent) {
        let formattedBody = bodyContent;
        try {
            formattedBody = JSON.stringify(JSON.parse(bodyContent), null, 4).replace(/\n/g, "\n  ");
            fetchOptionsStr += `,\n  body: JSON.stringify(${formattedBody})`;
        } catch {
            fetchOptionsStr += `,\n  body: ${JSON.stringify(bodyContent)}`;
        }
    }
    fetchOptionsStr += `\n}`;

    const fetchCode = `fetch("${fullUrl}", ${fetchOptionsStr})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error("Error:", error));`;

    // Axios
    const axiosHeadersObj: Record<string, string> = {};
    headersList.forEach(h => {
        axiosHeadersObj[h.key] = h.value;
    });
    if (draft.body?.type === "json" && !axiosHeadersObj["Content-Type"] && !axiosHeadersObj["content-type"]) {
        axiosHeadersObj["Content-Type"] = "application/json";
    }

    let configLines = [
        `  "method": "${method.toLowerCase()}"`,
        `  "url": "${fullUrl}"`
    ];
    if (Object.keys(axiosHeadersObj).length > 0) {
        const headersJson = JSON.stringify(axiosHeadersObj, null, 4).replace(/\n/g, "\n  ");
        configLines.push(`  "headers": ${headersJson}`);
    }
    if (bodyContent) {
        let formattedBody = bodyContent;
        try {
            formattedBody = JSON.stringify(JSON.parse(bodyContent), null, 4).replace(/\n/g, "\n  ");
            configLines.push(`  "data": ${formattedBody}`);
        } catch {
            configLines.push(`  "data": ${JSON.stringify(bodyContent)}`);
        }
    }

    const axiosCode = `import axios from "axios";

axios({
${configLines.join(",\n")}
})
  .then(response => {
    console.log(response.status);
    console.log(response.data);
  })
  .catch(error => {
    console.error("Error:", error);
  });`;

    // Python
    let pythonImports = `import requests`;
    let pythonPayloadDef = "";
    let pythonHeadersDef = "";
    let requestParams: string[] = ["url"];

    const pythonHeadersObj: Record<string, string> = {};
    headersList.forEach(h => {
        pythonHeadersObj[h.key] = h.value;
    });
    if (draft.body?.type === "json" && !pythonHeadersObj["Content-Type"] && !pythonHeadersObj["content-type"]) {
        pythonHeadersObj["Content-Type"] = "application/json";
    }

    if (bodyContent) {
        if (draft.body?.type === "json") {
            pythonImports += `\nimport json`;
            try {
                const formattedJson = JSON.stringify(JSON.parse(bodyContent), null, 4).replace(/\n/g, "\n");
                pythonPayloadDef = `\npayload = ${formattedJson}\n`;
                requestParams.push("json=payload");
            } catch {
                pythonPayloadDef = `\npayload = """${bodyContent}"""\n`;
                requestParams.push("data=payload");
            }
        } else {
            pythonPayloadDef = `\npayload = """${bodyContent}"""\n`;
            requestParams.push("data=payload");
        }
    }

    if (Object.keys(pythonHeadersObj).length > 0) {
        const headersJson = JSON.stringify(pythonHeadersObj, null, 4);
        pythonHeadersDef = `\nheaders=${headersJson}\n`;
        requestParams.push("headers=headers");
    }

    let requestArgsStr = requestParams.join(",\n    ");
    if (requestParams.length > 1) {
        requestArgsStr = `\n    ${requestArgsStr}\n`;
    }

    const pythonCode = `${pythonImports}

url = "${fullUrl}"${pythonPayloadDef}${pythonHeadersDef}
response = requests.${method.toLowerCase()}(${requestArgsStr})

print(response.status_code)
print(response.json())`;

    // Go HTTP
    let goImports = [
        `"fmt"`,
        `"io"`,
        `"net/http"`
    ];
    let goPayloadLine = "";
    let goReqLine = `req, err := http.NewRequest("${method}", url, nil)`;
    if (bodyContent) {
        goImports.push(`"strings"`);
        goPayloadLine = `\tpayload := strings.NewReader(\`${bodyContent}\`)\n`;
        goReqLine = `req, err := http.NewRequest("${method}", url, payload)`;
    }

    let goHeadersLines = "";
    headersList.forEach(h => {
        goHeadersLines += `\treq.Header.Add("${h.key}", "${h.value}")\n`;
    });
    if (draft.body?.type === "json" && !headersList.some(h => h.key.toLowerCase() === "content-type")) {
        goHeadersLines += `\treq.Header.Add("Content-Type", "application/json")\n`;
    }
    if (goHeadersLines) {
        goHeadersLines = `\n${goHeadersLines}`;
    }

    const goImportsStr = goImports.map(i => `\t${i}`).join("\n");

    const goCode = `package main

import (
${goImportsStr}
)

func main() {
	url := "${fullUrl}"
${goPayloadLine}\t${goReqLine}
	if err != nil {
		panic(err)
	}
${goHeadersLines}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer res.Body.Close()

	body, _ := io.ReadAll(res.Body)
	fmt.Println(res.StatusCode)
	fmt.Println(string(body))
}`;

    return {
        curl,
        fetch: fetchCode,
        axios: axiosCode,
        python: pythonCode,
        http: goCode
    };
};

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [activeElement, setActiveElement] = useState("apiClient");
    const [activeRequest, setActiveRequest] = useState("");
    const [requestDraft, setRequestDraft] = useState<RequestDraft>(defaultDraft);
    const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceItem | null>(null);
    const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
    const [history, setHistory] = useState<Array<HistoryPayload>>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [activeResponse, setActiveResponse] = useState<any>(null);
    const [requestName, setRequestName] = useState("GET Request");
    const [requestDescription, setRequestDescription] = useState("No description provided. Click to add one.");

    const [environments, setEnvironments] = useState<EnvironmentProfile[]>([]);
    const [activeEnvironmentId, setActiveEnvironmentId] = useState<string | null>(null);
    const [requestAgent, setRequestAgent] = useState<"proxy" | "direct">("proxy");

    // Load environments from local storage whenever activeWorkspace changes
    useEffect(() => {
        if (typeof window !== "undefined") {
            const wsId = activeWorkspace?._id || "global";
            const savedEnvs = localStorage.getItem(`anvaya_environments_${wsId}`);
            const savedActiveId = localStorage.getItem(`anvaya_active_env_${wsId}`);
            if (savedEnvs) {
                try {
                    setEnvironments(JSON.parse(savedEnvs));
                } catch (e) {
                    console.error("Failed to parse saved environments:", e);
                }
            } else {
                setEnvironments([]);
            }
            
            if (savedActiveId) {
                setActiveEnvironmentId(savedActiveId);
            } else {
                setActiveEnvironmentId(null);
            }
        }
    }, [activeWorkspace?._id]);

    // Save environments to local storage whenever they change
    useEffect(() => {
        if (typeof window !== "undefined") {
            const wsId = activeWorkspace?._id || "global";
            localStorage.setItem(`anvaya_environments_${wsId}`, JSON.stringify(environments));
        }
    }, [environments, activeWorkspace?._id]);

    // Save active environment ID to local storage when it changes
    useEffect(() => {
        if (typeof window !== "undefined") {
            const wsId = activeWorkspace?._id || "global";
            if (activeEnvironmentId) {
                localStorage.setItem(`anvaya_active_env_${wsId}`, activeEnvironmentId);
            } else {
                localStorage.removeItem(`anvaya_active_env_${wsId}`);
            }
        }
    }, [activeEnvironmentId, activeWorkspace?._id]);

    const activeVariables = useMemo(() => {
        if (!activeEnvironmentId) return [];
        const activeEnv = environments.find(e => e.id === activeEnvironmentId);
        return activeEnv ? activeEnv.variables : [];
    }, [environments, activeEnvironmentId]);

    const resolveEnv = useCallback((text: string): string => {
        return replaceVariables(text, activeVariables);
    }, [activeVariables]);

    const fetchHistory = useCallback(async (workspaceIdOverride?: string) => {
        const wsId = workspaceIdOverride || activeWorkspace?._id;
        if (!wsId) return;
        setLoadingHistory(true);
        try {
            const res = await axios.get(`/api/history?workspaceId=${wsId}`);
            if (res.data.success) {
                setHistory(res.data.data || []);
            }
        } catch (err: any) {
            console.error("Failed to fetch history:", err);
        } finally {
            setLoadingHistory(false);
        }
    }, [activeWorkspace]);

    const snippets = useMemo(() => {
        return generateSnippets(requestDraft, activeVariables);
    }, [requestDraft, activeVariables]);

    const value = {
        activeElement,
        setActiveElement,
        activeRequest,
        setActiveRequest,
        requestDraft,
        setRequestDraft,
        snippets,
        activeWorkspace,
        setActiveWorkspace,
        history,
        setHistory,
        fetchHistory,
        loadingHistory,
        activeResponse,
        setActiveResponse,
        workspaces,
        setWorkspaces,
        requestName,
        setRequestName,
        requestDescription,
        setRequestDescription,
        environments,
        setEnvironments,
        activeEnvironmentId,
        setActiveEnvironmentId,
        resolveEnv,
        requestAgent,
        setRequestAgent
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export const useApp = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useApp must be used within a UserProvider");
    }
    return context;
};