"use client";

import { useState } from "react";
import { Plus, Trash2, Eye, EyeOff, Database, Check } from "lucide-react";
import { useApp,  EnvironmentVariable } from "@/app/Context/UserContext";
import { toast } from "sonner";
import AddNewEnvironment from "./AddNewEnvironment";
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

export default function EnvironmentsManager() {
    const {
        environments,
        setEnvironments,
        activeEnvironmentId,
        setActiveEnvironmentId,
    } = useApp();

    const [visibleValues, setVisibleValues] = useState<Record<string, boolean>>({});
    const [isCreating, setIsCreating] = useState(false);
    const [envToDelete, setEnvToDelete] = useState<{ id: string; name: string } | null>(null);

    const activeEnv = environments.find((e) => e.id === activeEnvironmentId) || null;

    const toggleValueVisibility = (varId: string) => {
        setVisibleValues((prev) => ({
            ...prev,
            [varId]: !prev[varId],
        }));
    };

    const handleConfirmDelete = () => {
        if (!envToDelete) return;
        const { id, name } = envToDelete;
        setEnvironments((prev) => prev.filter((e) => e.id !== id));
        if (activeEnvironmentId === id) {
            const remaining = environments.filter((e) => e.id !== id);
            setActiveEnvironmentId(remaining.length > 0 ? remaining[0].id : null);
        }
        toast.success(`Environment "${name}" deleted`);
        setEnvToDelete(null);
    };

    const handleAddVariable = () => {
        if (!activeEnv) return;

        const updatedEnvs = environments.map((e) => {
            if (e.id === activeEnv.id) {
                return {
                    ...e,
                    variables: [
                        ...e.variables,
                        {
                            key: "",
                            value: "",
                            isEnabled: true,
                            isSecret: false,
                        },
                    ],
                };
            }
            return e;
        });

        setEnvironments(updatedEnvs);
    };

    const handleUpdateVariable = (
        index: number,
        field: keyof EnvironmentVariable,
        value: any
    ) => {
        if (!activeEnv) return;

        const updatedVariables = [...activeEnv.variables];
        updatedVariables[index] = {
            ...updatedVariables[index],
            [field]: value,
        };

        const updatedEnvs = environments.map((e) => {
            if (e.id === activeEnv.id) {
                return { ...e, variables: updatedVariables };
            }
            return e;
        });

        setEnvironments(updatedEnvs);
    };

    const handleDeleteVariable = (index: number) => {
        if (!activeEnv) return;

        const updatedVariables = activeEnv.variables.filter((_, i) => i !== index);
        const updatedEnvs = environments.map((e) => {
            if (e.id === activeEnv.id) {
                return { ...e, variables: updatedVariables };
            }
            return e;
        });

        setEnvironments(updatedEnvs);
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-background text-text-white p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-border-dark gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-semibold tracking-tight text-white">
                            Environment Variables Manager
                        </h1>
                        <span className="bg-panel-hover border border-border-dark text-text-grey text-[10px] px-2 py-0.5 rounded font-mono">
                            Active Context
                        </span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                        Securely store and toggle secrets, local/staging URLs, and configuration parameters.
                    </p>
                </div>

                {/* Env Tabs */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {environments.map((env) => (
                        <button
                            key={env.id}
                            onClick={() => setActiveEnvironmentId(env.id)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                                activeEnvironmentId === env.id
                                    ? "bg-panel-active border-border-active text-white"
                                    : "bg-transparent border-transparent text-text-muted hover:text-text-white hover:bg-panel-hover"
                            }`}
                        >
                            {env.name}
                        </button>
                    ))}
                    <button
                        onClick={() => setIsCreating(true)}
                        className="p-1.5 rounded-md bg-panel-charcoal border border-border-dark hover:border-border-hover text-text-muted hover:text-white transition-all cursor-pointer"
                        title="Add Environment"
                    >
                        <Plus className="size-4" />
                    </button>
                </div>
            </div>

            {/* Config Box */}
            {activeEnv ? (
                <div className="mt-6 border border-border-dark rounded-xl p-5 bg-panel-hover/60">
                    <div className="flex items-center justify-between pb-4 border-b border-border-dark">
                        <div>
                            <span className="text-[9px] text-text-muted font-mono tracking-widest uppercase">
                                TARGET PROFILE CONFIGURATION
                            </span>
                            <h2 className="text-sm font-semibold text-white flex items-center gap-2 mt-0.5">
                                {activeEnv.name} Environment
                                <span className="size-2 rounded-full bg-success animate-pulse" />
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleAddVariable}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent-blue hover:bg-accent-hover text-white text-xs font-semibold transition-colors cursor-pointer"
                            >
                                <Plus className="size-3.5" />
                                Add Variable
                            </button>
                            <button
                                onClick={() => setEnvToDelete({ id: activeEnv.id, name: activeEnv.name })}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-950/40 hover:bg-red-950/80 text-red-400 border border-red-900/50 text-xs font-semibold transition-colors cursor-pointer"
                            >
                                <Trash2 className="size-3.5" />
                                Delete Profile
                            </button>
                        </div>
                    </div>

                    {/* Variables Table */}
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border-dark text-[10px] text-text-muted font-mono uppercase">
                                    <th className="py-2.5 w-12 text-center">Active</th>
                                    <th className="py-2.5 px-4 w-1/3">Variable Key</th>
                                    <th className="py-2.5 px-4 w-1/2">Current Value</th>
                                    <th className="py-2.5 w-16 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeEnv.variables.map((variable, index) => {
                                    const varId = `${activeEnv.id}-${index}`;
                                    const isSecret = variable.isSecret ?? false;
                                    const isVisible = visibleValues[varId] ?? !isSecret;

                                    return (
                                        <tr key={index} className="border-b border-border-dark hover:bg-panel-hover/30">
                                            {/* Active Checkbox */}
                                            <td className="py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={variable.isEnabled}
                                                    onChange={(e) =>
                                                        handleUpdateVariable(index, "isEnabled", e.target.checked)
                                                    }
                                                    className="w-4 h-4 rounded border-border-dark text-accent-blue focus:ring-accent-blue focus:ring-offset-bg-black accent-accent-blue cursor-pointer"
                                                />
                                            </td>

                                            {/* Key Input */}
                                            <td className="py-3 px-4">
                                                <input
                                                    type="text"
                                                    placeholder="VARIABLE_KEY"
                                                    value={variable.key}
                                                    onChange={(e) =>
                                                        handleUpdateVariable(index, "key", e.target.value.replace(/\s+/g, "_"))
                                                    }
                                                    className="w-full bg-panel-charcoal border border-border-dark rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-border-hover font-mono transition-colors"
                                                />
                                            </td>

                                            {/* Value Input */}
                                            <td className="py-3 px-4 relative">
                                                <div className="relative flex items-center">
                                                    <input
                                                        type={isVisible ? "text" : "password"}
                                                        placeholder="Value"
                                                        value={variable.value}
                                                        onChange={(e) =>
                                                            handleUpdateVariable(index, "value", e.target.value)
                                                        }
                                                        className="w-full bg-panel-charcoal border border-border-dark rounded pl-2.5 pr-9 py-1.5 text-xs text-white focus:outline-none focus:border-border-hover font-mono transition-colors"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleValueVisibility(varId)}
                                                        className="absolute right-2.5 text-text-muted hover:text-white transition-colors cursor-pointer"
                                                    >
                                                        {isVisible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Delete Action */}
                                            <td className="py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleUpdateVariable(index, "isSecret", !isSecret)}
                                                        className={`p-1 rounded transition-colors cursor-pointer ${
                                                            isSecret
                                                                ? "text-warning hover:text-warning/80"
                                                                : "text-text-muted hover:text-white"
                                                        }`}
                                                        title={isSecret ? "Unmark as Secret (show value by default)" : "Mark as Secret (hide value by default)"}
                                                    >
                                                        <Database className="size-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteVariable(index)}
                                                        className="p-1 rounded text-text-muted hover:text-red-400 transition-colors cursor-pointer"
                                                        title="Delete Variable"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {activeEnv.variables.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-xs text-text-muted">
                                            No variables defined yet. Click &quot;Add Variable&quot; to begin.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="mt-6 border border-dashed border-border-dark rounded-xl p-12 bg-panel-hover/60 flex flex-col items-center justify-center text-center">
                    <Database className="size-10 text-text-muted mb-3" />
                    <h3 className="text-sm font-semibold text-white mb-1">No Active Environment</h3>
                    <p className="text-xs text-text-muted max-w-sm mb-4">
                        Create an environment to start organizing variables for local, staging, or production APIs.
                    </p>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded bg-accent-blue hover:bg-accent-hover text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                        <Plus className="size-4" />
                        Create Environment
                    </button>
                </div>
            )}

            {/* Informative Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* How to use */}
                <div className="border border-border-dark bg-panel-hover/60 rounded-xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span>&lt;/&gt;</span> How Variable Injections Work
                    </h4>
                    <p className="text-xs text-text-muted leading-relaxed">
                        You can reference any active variables inside your request URLs, headers, queries, or body templates using the double mustache bracket syntax:
                        <code className="block bg-panel-charcoal border border-border-dark p-2 rounded text-success font-mono text-[11px] mt-2">
                            {"{{variable_key}}"}
                        </code>
                    </p>
                    <div className="bg-panel-charcoal border border-border-dark p-3 rounded text-[11px] font-mono space-y-1.5 text-text-muted">
                        <div><span className="text-text-disabled">Configured:</span> <span className="text-white">base_url</span> = <span className="text-success">https://api.github.com</span></div>
                        <div><span className="text-text-disabled">Request URL:</span> <span className="text-white">{"{{base_url}}"}</span>/users/octocat</div>
                        <div><span className="text-text-disabled">Resolved:</span> <span className="text-success">https://api.github.com/users/octocat</span></div>
                    </div>
                </div>

                {/* Local Sandbox Isolation */}
                <div className="border border-border-dark bg-panel-hover/60 rounded-xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Database className="size-3.5 text-text-muted" /> Local Sandbox Isolation
                    </h4>
                    <p className="text-xs text-text-muted leading-relaxed">
                        Variables and API keys are stored client-side in secure sandbox LocalStorage. When making request dispatches, the proxy resolves variables instantly server-side before execution without printing your secrets in client-side telemetry logs.
                    </p>
                    <div className="flex items-center gap-2 bg-emerald-950/20 border border-emerald-900/30 p-3 rounded text-[11px] font-mono text-success">
                        <Check className="size-4 shrink-0 text-success" />
                        <span>Proxy payload resolution is fully compliant with CORS TLS rules.</span>
                    </div>
                </div>
            </div>

            {/* Custom Create Environment Modal */}
            <AnimatePresence>
                {isCreating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 15, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 15, opacity: 0 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="bg-panel-charcoal border border-border-dark rounded-xl max-w-sm w-full p-5 shadow-2xl"
                        >
                            <AddNewEnvironment
                                setIsCreatingEnvironment={setIsCreating}
                                onSuccess={(newEnv) => {
                                    setEnvironments((prev) => [...prev, newEnv]);
                                    setActiveEnvironmentId(newEnv.id);
                                }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom Delete Confirmation Alert Dialog */}
            <AlertDialog
                open={envToDelete !== null}
                onOpenChange={(open) => !open && setEnvToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Environment</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the environment <span className="font-semibold text-text-white">"{envToDelete?.name}"</span>? This will permanently delete all variables under it. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setEnvToDelete(null)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
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
