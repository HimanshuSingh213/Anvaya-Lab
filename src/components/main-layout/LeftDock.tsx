"use client"
import { useApp } from '@/app/Context/UserContext';
import { LucideIcon, LucideFolder, LucideTerminal, Settings, Activity } from 'lucide-react'

interface SidebarElement {
    name: string;
    icon: LucideIcon;
    component: string;
}

const sideBarElementsUpperdeck: SidebarElement[] = [
    { name: "API Client", icon: LucideTerminal, component: "apiClient" },
    { name: "Collections", icon: LucideFolder, component: "collections" },
    { name: "Analytics", icon: Activity, component: "analytics" },
];

export default function LeftDock() {
    const { activeElement, setActiveElement } = useApp()

    return (
        <div className='flex flex-col justify-between items-center py-8 px-1 bg-panel-charcoal border-r border-border-dark w-12 h-full shrink-0 select-none'>
            
            {/* Upper Deck */}
            <div className='flex flex-col gap-2.5 items-center w-full'>
                {sideBarElementsUpperdeck.map((el) => {
                    const Icon = el.icon;
                    return (
                        <button
                            key={el.component}
                            title={el.name}
                            className={`group flex items-center justify-center w-8 h-8 rounded-sm ${activeElement === el.component? "text-white bg-panel-active" : "text-text-grey hover:text-text-white hover:bg-panel-hover"} transition-colors duration-150 cursor-pointer ease-in-out`}
                            onClick={() => setActiveElement(el.component)}
                        >
                            <Icon className={`size-4 w-full transition duration-200 ease-in-out ${activeElement === el.component? "border-l-2 border-l-text-white": ""}`} />
                        </button>
                    );
                })}
            </div>

            {/* Lower Deck */}
            <div className='flex items-center justify-center w-full'>
                <div 
                    title="Settings"
                    className='flex items-center justify-center w-8 h-8 rounded-lg text-text-muted hover:text-text-white hover:bg-panel-hover transition-colors duration-150 cursor-pointer'
                >
                    <Settings className='w-4 h-4' />
                </div>
            </div>
            
        </div>
    )
}
