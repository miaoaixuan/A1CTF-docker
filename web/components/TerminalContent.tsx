"use client";

import { cn } from "@/lib/utils";

export function TerminalContent({ children, className } : { children: React.ReactNode, className?: string }) {
    return (
        <div className="flex">
            <div className={cn(className, "pl-3 pr-3 pt-2 pb-2 min-w-0 rounded-lg mt-2")}>
                { children }
            </div>
            <div className="flex-1" />
        </div>
    )
}

export function TerminalContentCustom({ children, className } : { children: React.ReactNode, className?: string }) {
    return (
        <div className="flex">
            <div className={cn(className, "min-w-0 mt-2")}>
                { children }
            </div>
            <div className="flex-1" />
        </div>
    )
}