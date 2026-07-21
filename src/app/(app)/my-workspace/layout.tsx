"use client";

import LeftDock from "@/components/main-layout/LeftDock";
import WorkspaceSideBar from "@/components/main-layout/WorkspaceSideBar";
import WorkspaceNavbar from "@/components/main-layout/WorkspaceNavbar";
import React, { useState, useEffect } from "react";
import { UserProvider } from "@/app/Context/UserContext";
import { SessionProvider } from "next-auth/react";
import { Monitor } from "lucide-react";

export default function WorkspaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

    useEffect(() => {
        const checkWidth = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };
        checkWidth();
        window.addEventListener("resize", checkWidth);
        return () => window.removeEventListener("resize", checkWidth);
    }, []);

    if (isDesktop === null) {
        return (
            <div className="h-screen w-screen bg-black flex items-center justify-center text-text-muted text-xs font-mono">
                Loading Workspace...
            </div>
        );
    }

    if (!isDesktop) {
        return (
            <div className="fixed inset-0 z-99999999 bg-bg-black flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-panel-charcoal border border-border-dark p-8 rounded-lg max-w-sm flex flex-col items-center gap-4.5 shadow-2xl">
                    <div className="size-12 rounded-full bg-panel-hover border border-border-dark flex items-center justify-center">
                        <Monitor className="size-6 text-text-muted" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <h3 className="text-sm font-bold text-text-white uppercase tracking-wider font-mono">Desktop Experience Required</h3>
                        <p className="text-[10px] text-text-muted leading-relaxed">
                            Anvaya Lab is optimized for professional desktop developers. Please open this workspace on a desktop or laptop computer to build and compose requests.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <SessionProvider>
            <UserProvider>
                <div className="h-screen w-screen bg-black overflow-hidden flex flex-col">

                    <WorkspaceNavbar />

                    {/* Viewport */}
                    <div className="w-full flex-1 min-h-0">
                        <div className="flex flex-row h-full w-full">
                            {/* Left Sidebar */}
                            <aside className="h-full shrink-0 flex flex-row">
                                <LeftDock />
                                <WorkspaceSideBar />
                            </aside>
                            <main className="flex-1 overflow-hidden flex shrink-0 h-full! bg-background">
                                {children}
                            </main>
                        </div>
                    </div>
                </div>
            </UserProvider>
        </SessionProvider>
    );
}
