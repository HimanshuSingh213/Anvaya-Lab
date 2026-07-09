"use client"

import { Settings, Download, RefreshCw, Trash2 } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useApp } from '@/app/Context/UserContext'
import Image from 'next/image';
import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
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

export default function SettingsManager() {
    const { data: session, status } = useSession();
    const { 
        activeWorkspace, 
        environments, 
        setEnvironments, 
        setActiveEnvironmentId, 
        setHistory 
    } = useApp();
    const [cachedUser, setCachedUser] = useState<any>(null);

    // Settings States
    const [timeoutVal, setTimeoutVal] = useState<number>(8000);
    const [maxSize, setMaxSize] = useState<number>(10);
    const [followRedirects, setFollowRedirects] = useState<boolean>(true);

    // Dialog States
    const [isPurgeDialogOpen, setIsPurgeDialogOpen] = useState<boolean>(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
    const [isExporting, setIsExporting] = useState<boolean>(false);

    const wsId = activeWorkspace?._id || "global";

    // Load Settings
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedTimeout = localStorage.getItem(`anvaya_settings_timeout_${wsId}`);
            if (savedTimeout) setTimeoutVal(Number(savedTimeout));
            else setTimeoutVal(8000);

            const savedMaxSize = localStorage.getItem(`anvaya_settings_max_size_${wsId}`);
            if (savedMaxSize) setMaxSize(Number(savedMaxSize));
            else setMaxSize(10);

            const savedRedirects = localStorage.getItem(`anvaya_settings_follow_redirects_${wsId}`);
            if (savedRedirects) setFollowRedirects(savedRedirects === "true");
            else setFollowRedirects(true);
        }
    }, [wsId]);

    // Save Handlers
    const handleTimeoutChange = (val: number) => {
        setTimeoutVal(val);
        localStorage.setItem(`anvaya_settings_timeout_${wsId}`, String(val));
    };

    const handleMaxSizeChange = (val: number) => {
        setMaxSize(val);
        localStorage.setItem(`anvaya_settings_max_size_${wsId}`, String(val));
    };

    const handleToggleRedirects = () => {
        const nextVal = !followRedirects;
        setFollowRedirects(nextVal);
        localStorage.setItem(`anvaya_settings_follow_redirects_${wsId}`, String(nextVal));
        toast.success(`Redirect following ${nextVal ? "enabled" : "disabled"}`);
    };

    // Export Workspace Backup
    const handleDownloadBackup = async () => {
        if (!activeWorkspace?._id) return;
        setIsExporting(true);
        toast.info("Preparing workspace backup...");
        try {
            // 1. Get collections
            const colRes = await axios.get(`/api/collection?workspaceId=${activeWorkspace._id}`);
            const collections = colRes.data.data || [];

            // 2. Get requests for all collections
            const collectionsWithRequests = [];
            for (const col of collections) {
                const reqRes = await axios.get(`/api/requests?collectionId=${col._id}`);
                collectionsWithRequests.push({
                    ...col,
                    requests: reqRes.data.data || []
                });
            }

            // 3. Construct unified archive JSON
            const backupPayload = {
                workspaceId: activeWorkspace._id,
                workspaceName: activeWorkspace.name,
                exportedAt: new Date().toISOString(),
                environments: environments || [],
                collections: collectionsWithRequests
            };

            // 4. Trigger download
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `anvaya_backup_${activeWorkspace.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();

            toast.success("Workspace backup downloaded successfully!");
        } catch (err: any) {
            toast.error("Failed to generate backup", { description: err.message });
        } finally {
            setIsExporting(false);
        }
    };

    // Purge Local Storage Cache
    const handlePurgeCache = async () => {
        if (!activeWorkspace?._id) return;
        try {
            // Delete history logs from DB
            const res = await axios.delete(`/api/history?workspaceId=${activeWorkspace._id}`);
            if (res.data.success) {
                setHistory([]);
            }

            // Clear local environments
            setEnvironments([]);
            setActiveEnvironmentId(null);

            // Clear localStorage values
            localStorage.removeItem(`anvaya_environments_${wsId}`);
            localStorage.removeItem(`anvaya_active_env_${wsId}`);
            localStorage.removeItem(`anvaya_globals_${wsId}`);
            localStorage.removeItem(`anvaya_settings_timeout_${wsId}`);
            localStorage.removeItem(`anvaya_settings_max_size_${wsId}`);
            localStorage.removeItem(`anvaya_settings_follow_redirects_${wsId}`);

            // Reset states
            setTimeoutVal(8000);
            setMaxSize(10);
            setFollowRedirects(true);

            toast.success("Local workspace cache purged successfully");
            setIsPurgeDialogOpen(false);
        } catch (err: any) {
            toast.error("Failed to purge local cache", {
                description: err.message
            });
        }
    };

    // Delete Sandbox Account & Local cache
    const handleDeleteAccount = async () => {
        toast.info("Deleting your sandbox account and clearing all data...");
        try {
            // Delete user account and associated data from MongoDB
            await axios.delete("/api/user");

            // Clear local storage for all keys starting with anvaya
            if (typeof window !== "undefined") {
                const keysToRemove: string[] = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith("anvaya")) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
            }

            toast.success("Sandbox account and data deleted successfully.");
            setIsDeleteDialogOpen(false);

            // Force Sign out
            signOut({ callbackUrl: "/sign-in" });
        } catch (err: any) {
            toast.error("Failed to delete account", { description: err.response?.data?.error || err.message });
        }
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            const cached = localStorage.getItem("anvaya_user_session");
            if (cached) {
                try {
                    setCachedUser(JSON.parse(cached));
                } catch (e) {
                    console.error("Failed to parse cached session:", e);
                }
            }
        }
    }, []);

    useEffect(() => {
        if (session?.user && !localStorage.getItem("anvaya_user_session")) {
            localStorage.setItem("anvaya_user_session", JSON.stringify(session.user));
            setCachedUser(session.user);
        }
    }, [session]);

    const user = session?.user || cachedUser;
    const isLoading = status === "loading" && !cachedUser;

    const initials = user?.name
        ? user.name.split(" ").map((str: string) => str[0]).join("").toUpperCase().slice(0, 2)
        : user?.email
            ? user.email.slice(0, 2).toUpperCase()
            : "U";

    return (
        <div className='bg-background flex h-full w-full flex-col'>
            <header className='w-full py-4 px-6 flex items-center flex-row justify-start gap-2 bg-panel-hover/40'>
                <div className='size-9 p-2 bg-panel-hover rounded-md border border-border-dark'>
                    <Settings className='text-text-grey size-5' />
                </div>
                <div>
                    <h2 className='text-sm text-text-white font-bold'>Workspace Global Settings</h2>
                    <p className='text-[11px] text-text-muted font-mono'>Customize TLS policies, connection timeouts, cluster backups, and danger settings</p>
                </div>
            </header>

            <div className='overflow-y-scroll flex-col w-full h-full p-5'>
                <div className='max-w-4xl mx-auto'>
                    <div className='py-4 px-6 flex flex-row justify-between items-center border border-border-dark bg-panel-charcoal rounded-md'>
                        <div className='flex items-center gap-4.5'>
                            {/* Avatar */}
                            <div className='size-10 rounded-full bg-panel-hover border border-border-dark flex items-center justify-center overflow-hidden shrink-0'>
                                {user?.image ? (
                                    <Image
                                        src={user.image}
                                        alt={user.name || "User"}
                                        width={40}
                                        height={40}
                                        className="rounded-full object-cover"
                                    />
                                ) : (
                                    <span className='text-text-white font-mono font-bold text-sm'>{initials}</span>
                                )}
                            </div>

                            {/* Credentials */}
                            <div className='flex flex-col gap-0.5'>
                                <span className='text-[9px] text-text-muted font-mono tracking-wider uppercase font-bold'>Active Credentials</span>
                                <p className='text-xs text-text-white font-mono font-semibold'>{user?.email || "guest@anvayalab.com"}</p>
                            </div>
                        </div>

                        {/* Metadata Metrics */}
                        <div className='flex items-center gap-10'>
                            <div className='flex flex-col gap-0.5 text-right md:text-left'>
                                <span className='text-[9px] text-text-muted font-mono tracking-wider uppercase font-bold'>Workspace Level</span>
                                <span className='text-xs text-success font-mono font-semibold uppercase tracking-wide'>{activeWorkspace?.name || "Personal Sandbox"}</span>
                            </div>
                            <div className='flex flex-col gap-0.5 text-right md:text-left border-l border-border-dark pl-10'>
                                <span className='text-[9px] text-text-muted font-mono tracking-wider uppercase font-bold'>Server Nodes</span>
                                <span className='text-xs text-text-white font-mono font-semibold'>4 Nodes Operational</span>
                            </div>
                        </div>
                    </div>

                    {/* REST SANDBOX CONTROLS */}
                    <div className='mt-8'>
                        <h3 className='text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase mb-3.5'>REST Sandbox Controls</h3>
                        
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            {/* HTTP Timeout Card */}
                            <div className='bg-panel-charcoal border border-border-dark rounded-md p-4 flex flex-col gap-3'>
                                <div>
                                    <h4 className='text-xs font-semibold text-text-white'>HTTP Request Timeout (ms)</h4>
                                    <p className='text-[10px] text-text-muted mt-1 leading-relaxed'>Maximum milliseconds allowed before killing an idle connection.</p>
                                </div>
                                <div className='flex items-center gap-3 mt-1'>
                                    <input 
                                        type='number' 
                                        value={timeoutVal}
                                        onChange={(e) => handleTimeoutChange(Number(e.target.value))}
                                        className='bg-[#09090b] border border-border-dark rounded px-3 py-1.5 text-xs text-text-white font-mono w-28 focus:border-border-hover outline-none'
                                    />
                                    <span className='text-[10px] text-text-muted font-mono'>Default: 8000ms</span>
                                </div>
                            </div>

                            {/* Max Size Card */}
                            <div className='bg-panel-charcoal border border-border-dark rounded-md p-4 flex flex-col gap-3'>
                                <div>
                                    <h4 className='text-xs font-semibold text-text-white'>Max Response Size Limit (MB)</h4>
                                    <p className='text-[10px] text-text-muted mt-1 leading-relaxed'>Maximum allowable response payload buffer size in megabytes.</p>
                                </div>
                                <div className='flex items-center gap-3 mt-1'>
                                    <input 
                                        type='number' 
                                        value={maxSize}
                                        onChange={(e) => handleMaxSizeChange(Number(e.target.value))}
                                        className='bg-[#09090b] border border-border-dark rounded px-3 py-1.5 text-xs text-text-white font-mono w-28 focus:border-border-hover outline-none'
                                    />
                                    <span className='text-[10px] text-text-muted font-mono'>Default: 10MB</span>
                                </div>
                            </div>
                        </div>

                        {/* Redirect Card */}
                        <div className='bg-panel-charcoal border border-border-dark rounded-md p-4 mt-4 flex items-center justify-between gap-4'>
                            <div className='flex-1'>
                                <h4 className='text-xs font-semibold text-text-white'>Follow Redirect Location headers</h4>
                                <p className='text-[10px] text-text-muted mt-1 leading-relaxed'>Automatically parse 3xx redirection headers to route subsequent requests.</p>
                            </div>
                            <button 
                                onClick={handleToggleRedirects}
                                className={`px-4 py-1.5 border text-[10px] font-mono font-bold tracking-wider rounded uppercase transition-colors shrink-0 cursor-pointer ${
                                    followRedirects 
                                        ? "border-success/35 bg-success/5 text-success hover:bg-success/10" 
                                        : "border-border-dark bg-panel-charcoal text-text-muted hover:text-text-white"
                                }`}
                            >
                                {followRedirects ? "Enabled" : "Disabled"}
                            </button>
                        </div>
                    </div>

                    {/* NETWORK ROUTING PROXY */}
                    <div className='mt-8'>
                        <h3 className='text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase mb-3.5'>Network Routing Proxy</h3>
                        <div className='bg-panel-charcoal border border-border-dark rounded-md p-4.5 flex flex-col gap-3.5'>
                            <div>
                                <h4 className='text-xs font-semibold text-text-white'>ANVAYALAB CONNECTION PROXY</h4>
                                <p className='text-[10px] text-text-muted mt-1 leading-relaxed'>
                                    Proxy all sandbox API requests through our server-side proxy route to completely bypass browser-level CORS errors, secure hidden authentication credentials, and protect local host properties.
                                </p>
                            </div>
                            <div className='flex items-center gap-3.5 mt-1 border-t border-border-dark/50 pt-3.5'>
                                <span className='text-[9.5px] font-mono font-bold text-success border border-success/20 bg-success/5 px-2 py-0.5 rounded uppercase tracking-wider'>
                                    Always Active
                                </span>
                                <span className='text-[10px] font-mono text-text-muted bg-[#09090b] px-2.5 py-1 rounded border border-border-dark'>
                                    CORS proxy route: <code className='text-text-white'>/api/requests/run</code>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* WORKSPACE PORTABILITY */}
                    <div className='mt-8'>
                        <h3 className='text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase mb-3.5'>Workspace Portability</h3>
                        <div className='bg-panel-charcoal border border-border-dark rounded-md p-4 flex items-center justify-between gap-4'>
                            <div className='flex-1'>
                                <h4 className='text-xs font-semibold text-text-white'>Export Full Workspace Archive</h4>
                                <p className='text-[10px] text-text-muted mt-1 leading-relaxed'>Downloads a unified backup JSON payload containing your entire history logs, local environments, and saved collection files.</p>
                            </div>
                            <button 
                                onClick={handleDownloadBackup}
                                disabled={isExporting}
                                className='flex items-center gap-2 px-4 py-2 bg-panel-hover border border-border-dark hover:border-border-hover text-text-white text-[11px] font-mono font-bold tracking-wider rounded uppercase transition-colors shrink-0 cursor-pointer disabled:opacity-50'
                            >
                                <Download className='size-3.5' />
                                {isExporting ? "Exporting..." : "Download Backup"}
                            </button>
                        </div>
                    </div>

                    {/* DANGER ZONE */}
                    <div className='mt-8 mb-12'>
                        <h3 className='text-[10px] font-mono font-bold tracking-widest text-danger uppercase mb-3.5'>Danger Zone</h3>
                        <div className='border border-red-950/40 bg-red-950/5 rounded-md p-4 flex flex-col divide-y divide-red-950/20 gap-4.5'>
                            {/* Purge Cache */}
                            <div className='flex items-center justify-between gap-4 pt-1 first:pt-0'>
                                <div className='flex-1'>
                                    <h4 className='text-xs font-semibold text-text-white'>Purge Local Storage State</h4>
                                    <p className='text-[10px] text-text-muted mt-1 leading-relaxed'>Instantly erases all local collection definitions, execution histories, and cached environment values. This action is irreversible.</p>
                                </div>
                                <button 
                                    onClick={() => setIsPurgeDialogOpen(true)}
                                    className='flex items-center gap-2 px-4 py-2 border border-danger/30 hover:border-danger/60 bg-danger/5 hover:bg-danger/10 text-danger text-[11px] font-mono font-bold tracking-wider rounded uppercase transition-colors shrink-0 cursor-pointer'
                                >
                                    <RefreshCw className='size-3.5' />
                                    Purge All Local Cache
                                </button>
                            </div>

                            {/* Delete Account */}
                            <div className='flex items-center justify-between gap-4 pt-4.5'>
                                <div className='flex-1'>
                                    <h4 className='text-xs font-semibold text-text-white'>Permanently Delete Account & Clusters</h4>
                                    <p className='text-[10px] text-text-muted mt-1 leading-relaxed'>Terminating the account erases your workspace profiles, cluster connection nodes, API gateway triggers, and atomic databases.</p>
                                </div>
                                <button 
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                    className='flex items-center gap-2 px-4 py-2 border border-[#ef4444]/30 hover:border-[#ef4444]/60 bg-[#ef4444]/5 hover:bg-[#ef4444]/10 text-[#ef4444] text-[11px] font-mono font-bold tracking-wider rounded uppercase transition-colors shrink-0 cursor-pointer'
                                >
                                    <Trash2 className='size-3.5' />
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Purge Cache Confirmation Dialog */}
            <AlertDialog open={isPurgeDialogOpen} onOpenChange={setIsPurgeDialogOpen}>
                <AlertDialogContent className="bg-background border border-border-dark max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-text-white font-mono text-sm uppercase tracking-wider">Purge Workspace Cache?</AlertDialogTitle>
                        <AlertDialogDescription className="text-text-muted text-[11px] leading-relaxed">
                            This will erase all local collection definitions, history logs, environments, and custom settings. This action is irreversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 gap-2">
                        <AlertDialogCancel asChild>
                            <button className="bg-panel-charcoal border border-border-dark hover:bg-panel-hover text-text-white text-xs px-4 py-2 rounded outline-none cursor-pointer">
                                Cancel
                            </button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <button onClick={handlePurgeCache} className="border border-[#ef4444]/30 hover:border-[#ef4444]/60 bg-[#ef4444]/5 hover:bg-[#ef4444]/10 text-[#ef4444] text-xs px-4 py-2 rounded font-semibold outline-none cursor-pointer transition-colors">
                                Purge All Cache
                            </button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Account Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-background border border-border-dark max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-text-white font-mono text-sm uppercase tracking-wider ">Delete Sandbox Account?</AlertDialogTitle>
                        <AlertDialogDescription className="text-text-muted text-[11px] leading-relaxed">
                            Terminating the account erases all your workspace sandbox settings, profiles, local cache files, and logs, and signs you out. This action is irreversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 gap-2">
                        <AlertDialogCancel asChild>
                            <button className="bg-panel-charcoal border border-border-dark hover:bg-panel-hover text-text-white text-xs px-4 py-2 rounded outline-none cursor-pointer">
                                Cancel
                            </button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <button onClick={handleDeleteAccount} className="border border-[#ef4444]/30 hover:border-[#ef4444]/60 bg-[#ef4444]/5 hover:bg-[#ef4444]/10 text-[#ef4444] text-xs px-4 py-2 rounded font-semibold outline-none cursor-pointer transition-colors">
                                Delete Account
                            </button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
