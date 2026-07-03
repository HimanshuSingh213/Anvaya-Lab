"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, Loader2, Plus, Trash2 } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";
import CollectionVault from "../ApiClient/CollectionVault";
import axios from "axios";
import { ApiResponse } from "@/types/ApiResponse";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createWorkspaceSchema } from "@/validations/workspace.validation";

interface WorkspaceItem {
    _id: string;
    name: string;
    ownerId: string;
}

type WorkspaceFormValues = z.infer<typeof createWorkspaceSchema>;

export default function WorkspaceSideBar() {
    const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
    const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceItem | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
    const [workspaceToDelete, setWorkspaceToDelete] = useState<{ id: string; name: string } | null>(null);

    // React Hook Form for Workspace creation
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<WorkspaceFormValues>({
        resolver: zodResolver(createWorkspaceSchema),
        defaultValues: {
            name: ""
        }
    });

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    const fetchWorkspaces = async () => {
        setLoading(true);
        try {
            const res = await axios.get<ApiResponse>("/api/workspace");
            if (res.data.success) {
                const list: WorkspaceItem[] = res.data.data || [];
                setWorkspaces(list);

                if (list.length > 0) {
                    setActiveWorkspace(list[0]);
                } else {
                    // Creating a default workspace if none exist
                    await createDefaultWorkspace();
                }
            }
        } catch (err: any) {
            toast.error("Failed to load workspaces", {
                description: err.response?.data?.error || err.message
            });
        } finally {
            setLoading(false);
        }
    };

    const createDefaultWorkspace = async () => {
        try {
            const res = await axios.post<ApiResponse>("/api/workspace", {
                name: "Personal Sandbox"
            });
            if (res.data.success) {
                const newWS: WorkspaceItem = res.data.data;
                setWorkspaces([newWS]);
                setActiveWorkspace(newWS);
            }
        } catch (err: any) {
            console.error("Failed to create default workspace:", err);
        }
    };

    const onWorkspaceSubmit = async (data: WorkspaceFormValues) => {
        try {
            const res = await axios.post<ApiResponse>("/api/workspace", {
                name: data.name.trim()
            });
            if (res.data.success) {
                toast.success("Workspace created successfully");
                const newWS = res.data.data;
                setWorkspaces(prev => [...prev, newWS]);
                setActiveWorkspace(newWS);
                reset();
                setIsCreatingWorkspace(false);
                setIsDropdownOpen(false);
            }
        } catch (err: any) {
            toast.error("Failed to create workspace", {
                description: err.response?.data?.error || err.message
            });
        }
    };

    const handleDeleteWorkspaceClick = (id: string, name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setWorkspaceToDelete({ id, name });
    };

    const confirmDeleteWorkspace = async () => {
        if (!workspaceToDelete) return;
        const { id } = workspaceToDelete;

        try {
            const res = await axios.delete<ApiResponse>(`/api/workspace?id=${id}`);
            if (res.data.success) {
                toast.success("Workspace deleted successfully");
                const updatedList = workspaces.filter(w => w._id !== id);
                setWorkspaces(updatedList);

                if (activeWorkspace?._id === id) {
                    if (updatedList.length > 0) {
                        setActiveWorkspace(updatedList[0]);
                    } else {
                        await createDefaultWorkspace();
                    }
                }
            }
        } catch (err: any) {
            toast.error("Failed to delete workspace", {
                description: err.response?.data?.error || err.message
            });
        } finally {
            setWorkspaceToDelete(null);
        }
    };

    return (
        <div className="w-60 h-full flex flex-col bg-panel-charcoal border-r border-border-dark select-none">
            
            {/* Workspace selection dropdown container */}
            <div className="relative shrink-0">
                <div 
                    onClick={() => !loading && setIsDropdownOpen(!isDropdownOpen)}
                    className="px-4 py-3 bg-panel-charcoal border-b border-border-dark flex flex-col group cursor-pointer hover:bg-panel-hover transition-colors"
                >
                    <span className="text-[9px] text-text-muted font-mono tracking-widest uppercase">WORKSPACE</span>
                    <h3 className="flex flex-row justify-between items-center truncate text-[13px] font-semibold text-text-white mt-0.5">
                        {loading ? (
                            <span className="flex items-center gap-1.5 text-xs text-text-grey">
                                <Loader2 className="size-3 animate-spin text-accent-blue" />
                                Loading...
                            </span>
                        ) : (
                            <span className="truncate pr-1">
                                {activeWorkspace?.name || "Personal Sandbox"}
                            </span>
                        )}
                        <ChevronDown 
                            className={`size-3.5 text-text-muted group-hover:text-text-white transition-transform duration-200 ${
                                isDropdownOpen ? "rotate-180" : ""
                            }`} 
                        />
                    </h3>
                </div>

                {/* Dropdown Menu */}
                <AnimatePresence>
                    {isDropdownOpen && (
                        <>
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-40" 
                                onClick={() => {
                                    setIsDropdownOpen(false);
                                    setIsCreatingWorkspace(false);
                                }} 
                            />
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                                transition={{ duration: 0.12, ease: "easeOut" }}
                                className="absolute top-[52px] left-2 w-[calc(100%-16px)] bg-[#0d0d0e] border border-[#222226] rounded-lg shadow-2xl p-1 z-50 overflow-hidden"
                            >
                                <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-thin">
                                    {workspaces.map((w) => {
                                        const isActive = w._id === activeWorkspace?._id;
                                        return (
                                            <div
                                                key={w._id}
                                                onClick={() => {
                                                    setActiveWorkspace(w);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`group flex items-center justify-between gap-2 px-3 py-2 text-[13px] rounded-md transition-all duration-200 cursor-pointer ${
                                                    isActive 
                                                        ? "bg-[#18181b] text-white font-medium" 
                                                        : "text-text-grey hover:text-text-white hover:bg-[#18181b]/50"
                                                }`}
                                            >
                                                <span className="truncate flex-1">{w.name}</span>
                                                <button
                                                    onClick={(e) => handleDeleteWorkspaceClick(w._id, w.name, e)}
                                                    className="p-0.5 rounded text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Delete Workspace"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                <div className="border-t border-[#222226] my-1" />
                                
                                <div className="px-1 py-1">
                                    {isCreatingWorkspace ? (
                                        <form onSubmit={handleSubmit(onWorkspaceSubmit)} className="flex flex-col gap-2 p-1.5 bg-[#161618] rounded-md border border-[#222226]">
                                            <input 
                                                type="text" 
                                                placeholder="Workspace name..."
                                                {...register("name")}
                                                className="w-full h-8 px-2.5 bg-[#09090b] border border-[#222226] focus:border-[#3f3f46] rounded text-xs text-white outline-none transition-colors"
                                                autoFocus
                                            />
                                            {errors.name && (
                                                <span className="text-[10px] text-danger px-1">{errors.name.message}</span>
                                            )}
                                            <div className="flex justify-end gap-1.5">
                                                <button 
                                                    type="button"
                                                    onClick={() => setIsCreatingWorkspace(false)}
                                                    className="text-[10px] text-text-grey hover:text-text-white px-2 py-1 rounded transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    type="submit"
                                                    className="text-[10px] text-white bg-accent-blue hover:bg-accent-hover rounded px-3 py-1 font-semibold transition-colors"
                                                >
                                                    Create
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <button 
                                            onClick={() => setIsCreatingWorkspace(true)}
                                            className="flex items-center gap-2 w-full text-left px-2 py-2 text-[13px] text-text-grey hover:text-text-white rounded-md hover:bg-[#18181b]/50 transition-all duration-200 font-medium cursor-pointer"
                                        >
                                            <Plus className="size-3.5 text-text-muted" />
                                            New Workspace
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Collection Vault Container */}
            <React.Suspense fallback={
                <div className="flex-1 flex items-center justify-center p-4 text-[10px] text-text-muted font-mono">
                    <Loader2 className="size-3 animate-spin mr-1.5" />
                    Loading Vault...
                </div>
            }>
                <CollectionVault workspaceId={activeWorkspace?._id} />
            </React.Suspense>

            {/* Workspace Delete Confirmation Alert Dialog */}
            <AlertDialog 
                open={workspaceToDelete !== null} 
                onOpenChange={(open) => !open && setWorkspaceToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the workspace <span className="font-semibold text-text-white">"{workspaceToDelete?.name}"</span>? This will permanently delete all collections and requests under it. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setWorkspaceToDelete(null)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDeleteWorkspace}
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
