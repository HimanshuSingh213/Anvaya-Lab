import Image from "next/image";
import Link from "next/link";
import { Github } from "lucide-react";

const REPO_URL = "https://github.com/HimanshuSingh213/Anvaya-Lab";

export default function Footer() {
    return (
        <footer className="border-t border-border-dark">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                    <Image
                        src="/logo.png"
                        width={22}
                        height={22}
                        alt="AnvayaLab"
                        className="w-[22px] h-[22px] object-contain"
                    />
                    <div className="leading-tight">
                        <p className="text-[13px] font-semibold text-text-white">AnvayaLab</p>
                        <p className="text-[11px] text-text-disabled">Built for developers who move fast.</p>
                    </div>
                </div>

                <nav className="flex items-center gap-5">
                    <Link href="/sign-in" className="text-[12px] text-text-muted hover:text-text-white transition-colors">
                        Sign in
                    </Link>
                    <Link href="/sign-up" className="text-[12px] text-text-muted hover:text-text-white transition-colors">
                        Sign up
                    </Link>
                    <a
                        href={REPO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[12px] text-text-muted hover:text-text-white transition-colors"
                    >
                        <Github className="size-3.5" />
                        GitHub
                    </a>
                </nav>

                <p className="text-[11px] text-text-disabled">
                    © {new Date().getFullYear()} AnvayaLab. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
