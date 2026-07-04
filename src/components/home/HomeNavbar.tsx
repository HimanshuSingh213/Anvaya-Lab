"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Github, LayoutGrid, LogOut, Menu, X } from "lucide-react";
import { HomeUser } from "./types";

const NAV_LINKS = [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#workflow" },
    { label: "Code export", href: "#snippets" },
];

const REPO_URL = "https://github.com/HimanshuSingh213/Anvaya-Lab";

function getInitials(name?: string | null) {
    if (!name) return "U";
    return name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function UserMenu({ user }: { user: HomeUser }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const initials = getInitials(user.name);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-panel-hover cursor-pointer group"
                aria-haspopup="menu"
                aria-expanded={isOpen}
            >
                {user.image ? (
                    <Image
                        src={user.image}
                        alt={user.name || "User"}
                        width={28}
                        height={28}
                        className="rounded-full object-cover ring-1 ring-border-dark group-hover:ring-accent-blue/50 transition-all"
                    />
                ) : (
                    <div className="size-7 rounded-full bg-linear-to-br from-accent-blue/80 to-brand-indigo/80 flex items-center justify-center text-[11px] font-bold text-white ring-1 ring-border-dark group-hover:ring-accent-blue/50 transition-all">
                        {initials}
                    </div>
                )}
                <span className="hidden sm:block text-[13px] font-medium text-text-white max-w-[120px] truncate">
                    {user.name || "Account"}
                </span>
                <ChevronDown
                    className={`size-3.5 text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -4 }}
                        transition={{ duration: 0.12, ease: "easeOut" }}
                        className="absolute right-0 top-[calc(100%+8px)] w-56 bg-[#0d0d0e] border border-[#222226] rounded-xl shadow-2xl shadow-black/60 p-1.5 z-50"
                        role="menu"
                    >
                        <div className="px-3 py-2.5 border-b border-[#222226] mb-1">
                            <p className="text-[12px] font-semibold text-text-white truncate">
                                {user.name || "Your account"}
                            </p>
                            <p className="text-[10px] text-text-muted truncate">{user.email || ""}</p>
                        </div>

                        <Link
                            href="/my-workspace"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] text-text-grey hover:text-text-white hover:bg-panel-hover rounded-lg transition-colors"
                        >
                            <LayoutGrid className="size-3.5" />
                            Open workspace
                        </Link>

                        <div className="border-t border-[#222226] my-1" />

                        <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-[12px] text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer"
                        >
                            <LogOut className="size-3.5" />
                            Sign out
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function HomeNavbar({ user }: { user: HomeUser | null }) {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header
            className={`sticky top-0 z-50 w-full transition-colors duration-300 ${
                scrolled
                    ? "bg-black/80 backdrop-blur-xl border-b border-border-dark"
                    : "bg-transparent border-b border-transparent"
            }`}
        >
            <div className="mx-auto max-w-7xl h-14 px-4 sm:px-6 flex items-center justify-between">
                <Link href="/" className="flex items-center h-full py-2 shrink-0">
                    <div className="relative h-full w-auto aspect-auto">
                        <Image
                            src="/navBar_logo.png"
                            alt="AnvayaLab"
                            height={24}
                            width={82}
                            className="h-full w-auto object-contain"
                            priority
                        />
                    </div>
                </Link>

                <nav className="hidden md:flex items-center gap-1">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="px-3 py-1.5 text-[13px] text-text-grey hover:text-text-white rounded-lg hover:bg-panel-hover transition-colors"
                        >
                            {link.label}
                        </a>
                    ))}
                    <a
                        href={REPO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="View source on GitHub"
                        className="ml-1 p-2 text-text-grey hover:text-text-white rounded-lg hover:bg-panel-hover transition-colors"
                    >
                        <Github className="size-4" />
                    </a>
                </nav>

                <div className="flex items-center gap-2">
                    {user ? (
                        <>
                            <Link
                                href="/my-workspace"
                                className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-[13px] font-semibold text-background hover:bg-foreground/85 transition-colors"
                            >
                                Open workspace
                            </Link>
                            <UserMenu user={user} />
                        </>
                    ) : (
                        <>
                            <Link
                                href="/sign-in"
                                className="hidden sm:inline-flex h-8 items-center rounded-lg px-3 text-[13px] font-medium text-text-grey hover:text-text-white hover:bg-panel-hover transition-colors"
                            >
                                Sign in
                            </Link>
                            <Link
                                href="/sign-up"
                                className="inline-flex h-8 items-center rounded-lg bg-foreground px-3 text-[13px] font-semibold text-background hover:bg-foreground/85 transition-colors"
                            >
                                Get started
                            </Link>
                        </>
                    )}

                    <button
                        onClick={() => setMobileOpen((v) => !v)}
                        className="md:hidden p-2 rounded-lg text-text-grey hover:text-text-white hover:bg-panel-hover transition-colors"
                        aria-label={mobileOpen ? "Close menu" : "Open menu"}
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="md:hidden overflow-hidden border-b border-border-dark bg-black/95 backdrop-blur-xl"
                    >
                        <div className="px-4 py-3 flex flex-col gap-1">
                            {NAV_LINKS.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="px-3 py-2.5 text-[13px] text-text-grey hover:text-text-white rounded-lg hover:bg-panel-hover transition-colors"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <a
                                href={REPO_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-text-grey hover:text-text-white rounded-lg hover:bg-panel-hover transition-colors"
                            >
                                <Github className="size-3.5" />
                                View on GitHub
                            </a>
                            {!user && (
                                <Link
                                    href="/sign-in"
                                    onClick={() => setMobileOpen(false)}
                                    className="sm:hidden px-3 py-2.5 text-[13px] text-text-grey hover:text-text-white rounded-lg hover:bg-panel-hover transition-colors"
                                >
                                    Sign in
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
