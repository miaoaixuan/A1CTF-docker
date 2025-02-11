"use client";

import { MacScrollbar } from "mac-scrollbar";

export function TeamsView() {

    const teamCounts = 10

    return (
        <div className="flex w-full h-full">
            <MacScrollbar className="w-full h-full p-20 overflow-y-auto">
                <div className={`grid auto-rows-[200px] gap-6 w-full ${ teamCounts > 2 ? "grid-cols-[repeat(auto-fill,minmax(400px,1fr))] " : "grid-cols-[repeat(auto-fill,minmax(400px,600px))]"}`}>
                    { new Array(teamCounts).fill(0).map((e, index) => (
                        <div className="flex w-full h-full bg-background transition-[background,border-color] duration-300 rounded-2xl border-2 shadow-lg shadow-foreground/15" key={index}>
                        </div>
                    )) }
                </div>
            </MacScrollbar>
        </div>
    )
}