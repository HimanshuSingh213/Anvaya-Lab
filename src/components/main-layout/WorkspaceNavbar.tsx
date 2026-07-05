"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Settings, User, ChevronDown, Github } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { LiquidTooltip } from "../rareui/LiquidTooltip/LiquidTooltip";

export default function WorkspaceNavbar() {
    const { data: session, status } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [cachedUser, setCachedUser] = useState<any>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load cached session on mount
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

    // Sync session to cache when loaded
    useEffect(() => {
        if (session?.user) {
            localStorage.setItem("anvaya_user_session", JSON.stringify(session.user));
            setCachedUser(session.user);
        }
    }, [session]);

    const user = session?.user || cachedUser;
    const isLoading = status === "loading" && !cachedUser;
    
    const initials = user?.name
        ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
        : "U";

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSignOut = async () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("anvaya_user_session");
        }
        await signOut({ callbackUrl: "/sign-in" });
    };

    return (
        <header className="h-12 w-full border-b border-border-dark flex items-center justify-between px-12 shrink-0 bg-panel-charcoal z-30">

            {/* Logo */}
            <div className="flex items-center h-full py-1.5 gap-2">
                <div className="relative h-full w-auto aspect-auto">
                    <Image
                        src="/navBar_logo.png"
                        alt="Anvaya Lab"
                        height={28}
                        width={95}
                        className="h-full w-auto object-contain"
                        priority
                    />
                </div>
                <span className="bg-panel-hover px-1 py-0.5 text-text-grey text-[10px] font-mono rounded-sm">v0.1.0-Beta</span>
            </div>

            {/* Actions & User section */}
            <div className="flex items-center gap-4">
                <LiquidTooltip
                    text="Created by Himanshu"
                    placement="bottom"
                >
                    <a
                        href="https://github.com/HimanshuSingh213"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:text-text-white hover:bg-panel-hover transition-colors cursor-pointer"
                        aria-label="GitHub profile"
                    >
                        <Github className="w-4 h-4" />
                    </a>
                </LiquidTooltip>

                <motion.div
                    initial={{ x: "110%", opacity: 0 }}
                    animate={isLoading ? { x: "110%", opacity: 0 } : { x: 0, opacity: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 280,
                        damping: 22,
                        mass: 0.9,
                    }}
                    className="relative"
                    ref={dropdownRef}
                >
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-panel-hover transition-colors cursor-pointer group"
                    >
                        {/* Avatar */}
                        {user?.image ? (
                            <Image
                                src={user.image}
                                alt={user.name || "User"}
                                width={28}
                                height={28}
                                className="rounded-full object-cover ring-1 ring-border-dark group-hover:ring-accent-blue/50 transition-all"
                            />
                        ) : (
                            <div className="size-7 rounded-full bg-pink-500 flex items-center justify-center text-[11px] font-bold text-white ring-1 ring-border-dark group-hover:ring-accent-blue/50 transition-all">
                                {initials}
                            </div>
                        )}

                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[12px] font-medium text-text-white">{user?.name || "User"}</span>
                            <span className="text-[10px] text-text-muted truncate max-w-30">{user?.email || ""}</span>
                        </div>
                        <ChevronDown className={`size-3.5 text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* Dropdown */}
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                transition={{ duration: 0.1, ease: "easeOut" }}
                                className="absolute right-0 top-[calc(100%+6px)] w-52 bg-[#0d0d0e] border border-[#222226] rounded-xl shadow-2xl shadow-black/60 p-1.5 z-50"
                            >
                                {/* User info header */}
                                <div className="px-3 py-2.5 border-b border-[#222226] mb-1">
                                    <p className="text-[12px] font-semibold text-text-white truncate">{user?.name || "User"}</p>
                                    <p className="text-[10px] text-text-muted truncate">{user?.email || ""}</p>
                                </div>

                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] text-text-grey hover:text-text-white hover:bg-panel-hover rounded-lg transition-colors"
                                >
                                    <User className="size-3.5" />
                                    Profile
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] text-text-grey hover:text-text-white hover:bg-panel-hover rounded-lg transition-colors"
                                >
                                    <Settings className="size-3.5" />
                                    Settings
                                </button>

                                <div className="border-t border-[#222226] my-1" />

                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] text-danger hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                                >
                                    <LogOut className="size-3.5" />
                                    Sign out
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </header>
    );
}
