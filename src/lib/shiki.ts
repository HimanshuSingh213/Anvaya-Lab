import { getSingletonHighlighter, type BundledLanguage } from "shiki";

export const SHIKI_THEME = "github-dark-high-contrast";

export async function highlightCode(code: string, lang: BundledLanguage) {
    const highlighter = await getSingletonHighlighter({
        themes: [SHIKI_THEME],
        langs: ["bash", "javascript", "python", "go", "json", "text"],
    });

    return highlighter.codeToHtml(code, { lang, theme: SHIKI_THEME });
}
