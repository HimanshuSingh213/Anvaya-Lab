"use client";

import React, { useEffect, useState } from "react";
import {
    Search,
    Plus,
    Folder,
    FolderOpen,
    Trash2,
    ChevronRight,
    Loader2,
    FolderPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { ApiResponse } from "@/types/ApiResponse";
import AddNewCollection from "./AddNewCollection";
import AddNewRequest from "./AddNewRequest";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/app/Context/UserContext";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RequestItem {
    _id: string;
    name: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    url: string;
}

interface CollectionItem {
    _id: string;
    name: string;
    workspaceId: string;
}



const methodColors: Record<string, string> = {
    GET: "text-success bg-success/5 border-success/15",
    POST: "text-warning bg-warning/5 border-warning/15",
    PUT: "text-accent-blue bg-accent-blue/5 border-accent-blue/15",
    PATCH: "text-purple-500 bg-purple-500/5 border-purple-500/15",
    DELETE: "text-danger bg-danger/5 border-danger/15",
};

export default function CollectionVault() {
    const { activeWorkspace } = useApp();
    const workspaceId = activeWorkspace?._id;
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeRequest = searchParams.get("reqId");
    const [collections, setCollections] = useState<CollectionItem[]>([]);
    const [requests, setRequests] = useState<Record<string, RequestItem[]>>({});

    // UI States
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({});
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);
    const [loadingCollections, setLoadingCollections] = useState(false);
    const [loadingRequests, setLoadingRequests] = useState<Record<string, boolean>>({});
    const [activeCollectionIdForNewRequest, setActiveCollectionIdForNewRequest] = useState<string | null>(null);
    const [collectionToDelete, setCollectionToDelete] = useState<{ id: string; name: string } | null>(null);
    const [requestToDelete, setRequestToDelete] = useState<{ id: string; name: string; collectionId: string } | null>(null);

    // Fetch collections when workspaceId changes
    useEffect(() => {
        if (workspaceId) {
            fetchCollections();
        }
    }, [workspaceId]);

    const fetchCollections = async () => {
        setLoadingCollections(true);
        try {
            const res = await axios.get<ApiResponse>(`/api/collection?workspaceId=${workspaceId}`);
            if (res.data.success) {
                setCollections(res.data.data || []);
            }
        } catch (err: any) {
            toast.error("Failed to load collections", {
                description: err.response?.data?.error || err.message
            });
        } finally {
            setLoadingCollections(false);
        }
    };

    const fetchRequestsForCollection = async (collectionId: string) => {
        if (requests[collectionId]) return; // already loaded

        setLoadingRequests(prev => ({ ...prev, [collectionId]: true }));
        try {
            const res = await axios.get<ApiResponse>(`/api/requests?collectionId=${collectionId}`);
            if (res.data.success) {
                setRequests(prev => ({
                    ...prev,
                    [collectionId]: res.data.data || []
                }));
            }
        } catch (err: any) {
            toast.error("Failed to load requests", {
                description: err.response?.data?.error || err.message
            });
        } finally {
            setLoadingRequests(prev => ({ ...prev, [collectionId]: false }));
        }
    };

    const toggleCollection = (id: string) => {
        const nextState = !expandedCollections[id];
        setExpandedCollections(prev => ({ ...prev, [id]: nextState }));
        if (nextState) {
            fetchRequestsForCollection(id);
        }
    };

    const handleDeleteClick = (id: string, name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setCollectionToDelete({ id, name });
    };

    const confirmDeleteCollection = async () => {
        if (!collectionToDelete) return;
        const { id } = collectionToDelete;

        try {
            const res = await axios.delete<ApiResponse>(`/api/collection?id=${id}`);
            if (res.data.success) {
                toast.success("Collection deleted successfully");
                setCollections(prev => prev.filter(c => c._id !== id));
                setRequests(prev => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
            }
        } catch (err: any) {
            toast.error("Failed to delete collection", {
                description: err.response?.data?.error || err.message
            });
        } finally {
            setCollectionToDelete(null);
        }
    };

    const handleDeleteRequestClick = (id: string, name: string, collectionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setRequestToDelete({ id, name, collectionId });
    };

    const confirmDeleteRequest = async () => {
        if (!requestToDelete) return;
        const { id, collectionId } = requestToDelete;

        try {
            const res = await axios.delete<ApiResponse>(`/api/requests?id=${id}`);
            if (res.data.success) {
                toast.success("Request deleted successfully");
                setRequests(prev => ({
                    ...prev,
                    [collectionId]: (prev[collectionId] || []).filter(r => r._id !== id)
                }));

                if (activeRequest === requestToDelete.id) {
                    router.replace("/my-workspace");
                }
            }
        } catch (err: any) {
            toast.error("Failed to delete request", {
                description: err.response?.data?.error || err.message
            });
        } finally {
            setRequestToDelete(null);
        }
    };

    // request creation
    const handleCreateRequest = (collectionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedCollections(prev => ({ ...prev, [collectionId]: true }));
        setActiveCollectionIdForNewRequest(prev => prev === collectionId ? null : collectionId);
    };

    const filteredCollections = collections.filter(col => {
        const query = searchQuery.toLowerCase();
        const matchesName = col.name.toLowerCase().includes(query);
        const collectionRequests = requests[col._id] || [];
        const matchesRequests = collectionRequests.some(req =>
            req.name.toLowerCase().includes(query) || req.url.toLowerCase().includes(query)
        );
        return matchesName || matchesRequests;
    });

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background border-t border-border-dark select-none">

            {/* Search and Action Bar */}

            <div className="flex flex-row gap-2 p-3 border-b bg-background border border-border-dark">

                <div className="flex flex-row gap-2 items-center bg-panel-charcoal border border-border-dark p-2 rounded-sm">
                    <Search className="size-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Filter requests..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full focus:border-border-active rounded-sm text-xs text-text-white placeholder:text-text-muted outline-none transition-colors"
                    />
                </div>

                <button
                    onClick={() => setIsCreatingCollection(true)}
                    className="flex items-center justify-center p-1.5 size-8 cursor-pointer rounded text-text-muted hover:text-text-white hover:bg-panel-hover transition-colors"
                    title="Add Collection"
                >
                    <FolderPlus className="size-3.5" />
                </button>



            </div>

            {/* Collections and Requests List Panel */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 ">
                <AnimatePresence initial={false}>
                    {isCreatingCollection && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: -6 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -6 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="overflow-hidden"
                        >
                            <AddNewCollection 
                                workspaceId={workspaceId || ""}
                                setIsCreatingCollection={setIsCreatingCollection}
                                onSuccess={(newCollection) => setCollections(prev => [...prev, newCollection])}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {loadingCollections ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="size-5 text-accent-blue animate-spin" />
                    </div>
                ) : filteredCollections.map(col => {
                    const isExpanded = expandedCollections[col._id];
                    return (
                        <div key={col._id} className="space-y-0.5">

                            {/* Folder Header */}
                            <div
                                onClick={() => toggleCollection(col._id)}
                                className="group flex items-center justify-between px-2 py-1.5 rounded hover:bg-panel-hover text-text-grey hover:text-text-white transition duration-150 cursor-pointer"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <ChevronRight 
                                        className={`size-3.5 text-text-muted transition-transform duration-200 ${
                                            isExpanded ? "rotate-90" : ""
                                        }`} 
                                    />
                                    <span className="text-text-grey group-hover:text-text-white">
                                        {isExpanded ? <FolderOpen className="size-3.5 text-text-muted" /> : <Folder className="size-3.5 text-text-muted" />}
                                    </span>
                                    <span className="text-xs font-medium truncate">{col.name}</span>
                                </div>

                                {/* Hover Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => handleCreateRequest(col._id, e)}
                                        className="p-0.5 rounded text-text-muted hover:text-text-white hover:bg-panel-active transition-colors duration-150"
                                        title="New Request"
                                    >
                                        <Plus className="size-3" />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteClick(col._id, col.name, e)}
                                        className="p-0.5 rounded text-text-muted hover:text-danger hover:bg-panel-active transition-colors duration-150"
                                        title="Delete Collection"
                                    >
                                        <Trash2 className="size-3" />
                                    </button>
                                </div>
                            </div>

                            {/* Requests Sub-list */}
                            <AnimatePresence initial={false}>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        className="pl-4 border-l border-border-dark/60 ml-3.5 space-y-0.5 overflow-hidden"
                                    >
                                        <AnimatePresence initial={false}>
                                            {activeCollectionIdForNewRequest === col._id && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="overflow-hidden"
                                                >
                                                    <AddNewRequest 
                                                        collectionId={col._id}
                                                        setIsCreatingRequest={(show) => {
                                                            if (!show) setActiveCollectionIdForNewRequest(null);
                                                        }}
                                                        onSuccess={(newReq) => {
                                                            setRequests(prev => ({
                                                                ...prev,
                                                                [col._id]: [...(prev[col._id] || []), newReq]
                                                            }));
                                                        }}
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        {loadingRequests[col._id] ? (
                                            <div className="flex items-center gap-1.5 py-1 px-2 text-[10px] text-text-muted">
                                                <Loader2 className="size-3 animate-spin" />
                                                Loading...
                                            </div>
                                        ) : (requests[col._id] || []).length === 0 && activeCollectionIdForNewRequest !== col._id ? (
                                            <div className="py-1 px-2 text-[10px] text-text-muted italic">
                                                No requests
                                            </div>
                                        ) : (
                                            (requests[col._id] || []).map(req => (
                                                <Link
                                                    key={req._id}
                                                    href={`/my-workspace?reqId=${req._id}&colId=${col._id}`}
                                                    className={`group flex items-center justify-between gap-2 px-2 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors duration-150 ${activeRequest === req._id ? "bg-panel-active text-text-white font-semibold" : "text-text-grey hover:text-text-white hover:bg-panel-hover"}`}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <span className={`text-[8px] font-extrabold uppercase px-1 py-0.5 rounded border shrink-0 min-w-[32px] text-center ${methodColors[req.method]}`}>
                                                            {req.method}
                                                        </span>
                                                        <span className="truncate">{req.name}</span>
                                                    </div>
                                                    <span
                                                        onClick={(e) => handleDeleteRequestClick(req._id, req.name, col._id, e)}
                                                        className="p-0.5 rounded text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                        title="Delete Request"
                                                    >
                                                        <Trash2 className="size-3" />
                                                    </span>
                                                </Link>
                                            ))
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </div>
                    );
                })}

                {filteredCollections.length === 0 && !loadingCollections && (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                        <Folder className="size-6 text-text-disabled mb-2" />
                        <p className="text-xs text-text-muted font-medium">No collections yet</p>
                        <p className="text-[10px] text-text-disabled mt-0.5">Add one to start testing APIs</p>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Alert Dialog */}
            <AlertDialog 
                open={collectionToDelete !== null} 
                onOpenChange={(open) => !open && setCollectionToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the collection <span className="font-semibold text-text-white">"{collectionToDelete?.name}"</span> and all its requests? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setCollectionToDelete(null)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDeleteCollection}
                            variant="destructive"
                            className="bg-danger! hover:bg-danger/90! text-text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Request Delete Confirmation Alert Dialog */}
            <AlertDialog 
                open={requestToDelete !== null} 
                onOpenChange={(open) => !open && setRequestToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Request</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the request <span className="font-semibold text-text-white">"{requestToDelete?.name}"</span>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRequestToDelete(null)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDeleteRequest}
                            variant="destructive"
                            className="bg-danger! hover:bg-danger/90! text-text-white"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
