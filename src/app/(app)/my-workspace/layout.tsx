"use client";

import LeftDock from "@/components/main-layout/LeftDock";
import WorkspaceSideBar from "@/components/main-layout/WorkspaceSideBar";
import WorkspaceNavbar from "@/components/main-layout/WorkspaceNavbar";
import React from "react";
import { UserProvider } from "@/app/Context/UserContext";
import { SessionProvider } from "next-auth/react";

export default function WorkspaceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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
