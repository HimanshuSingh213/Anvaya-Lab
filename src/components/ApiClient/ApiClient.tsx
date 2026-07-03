"use client"

import { Code, Database, History, Cpu } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import RightInspector from './RightInspector'
import RequestCreator from './RequestCreator'

const options = [
    { name: "Snippets", icon: Code, id: "snippets" },
    { name: "Globals", icon: Database, id: "globals" },
    { name: "History", icon: History, id: "history" }
]

export default function ApiClient() {
    const [activeOption, setActiveOption] = useState("snippets");
    const searchParams = useSearchParams();
    const reqId = searchParams.get("reqId");

    const showEmptyState = !reqId;

    return (
        <div className='flex flex-row w-full justify-between h-full shrink-0 bg-black'>
            {/* Main tab / Empty state */}
            <div className='flex-1 min-w-0 h-full flex flex-col shrink-0'>
                {showEmptyState ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-black text-center px-6 min-h-0 select-none">
                        <div className="flex flex-col items-center max-w-sm">
                            {/* Breathing CPU Icon */}
                            <div className="p-4 rounded-xl bg-panel-charcoal border border-border-dark text-text-disabled mb-6 animate-pulse shadow-2xl">
                                <Cpu className="size-8 animate-pulse" />
                            </div>
                            
                            <h2 className="text-sm font-semibold text-text-white mb-2 tracking-wide font-mono">
                                AnvayaLab Core Workspace
                            </h2>
                            <p className="text-[11px] text-text-muted leading-relaxed font-mono">
                                Load a request from your saved collections, browse the active command palette (⌘K), or create a new HTTP sandbox request to begin testing.
                            </p>
                        </div>
                    </div>
                ) : (
                    <RequestCreator />
                )}
            </div>

            {/* Right sidebar */}
            <div className='w-75 bg-background border-l border-border-dark h-full flex flex-col shrink-0'>
                {/* selectors */}
                <div className='flex flex-row justify-between items-center bg-background border-b border-b-border-dark w-full h-10'>
                    {options.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setActiveOption(opt.id)}
                            className={`flex flex-row items-center justify-center gap-2 transition duration-150 ease-in-out w-full h-10 font-medium text-xs py-2  ${opt.id === activeOption ? "border-b-2 border-b-text-white text-text-white bg-panel-active " : "text-text-muted bg-background hover:bg-panel-hover border-b-2 border-b-transparent"}`}
                        >
                            <opt.icon className='size-3 ' />
                            {opt.name}
                        </button>
                    ))}
                </div>
                {/* inspector */}
                <RightInspector optionId={activeOption} />
            </div>
        </div>
    )
}
