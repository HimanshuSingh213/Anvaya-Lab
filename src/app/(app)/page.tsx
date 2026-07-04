import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

import HomeNavbar from "@/components/home/HomeNavbar";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import CodeShowcase from "@/components/home/CodeShowcase";
import Workflow from "@/components/home/Workflow";
import FinalCta from "@/components/home/FinalCta";
import Footer from "@/components/home/Footer";
import { CODE_SNIPPETS, LANGS, type Lang } from "@/components/home/codeSnippets";
import { highlightCode } from "@/lib/shiki";

export default async function Home() {
    const session = await getServerSession(authOptions);
    const user = session?.user ?? null;

    // Highlight all 5 snippets once, at request time, on the server.
    // Shiki never ships to the client bundle this way.
    const entries = await Promise.all(
        LANGS.map(async (lang) => {
            const { code, shikiLang } = CODE_SNIPPETS[lang];
            const html = await highlightCode(code, shikiLang);
            return [lang, html] as const;
        })
    );
    const snippetsHtml = Object.fromEntries(entries) as Record<Lang, string>;

    return (
        <div className="flex flex-col flex-1 min-h-screen bg-background">
            <HomeNavbar user={user} />
            <main className="flex-1">
                <Hero user={user} />
                <Features />
                <CodeShowcase snippetsHtml={snippetsHtml} />
                <Workflow />
                <FinalCta user={user} />
            </main>
            <Footer />
        </div>
    );
}
