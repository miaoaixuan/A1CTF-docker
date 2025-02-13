"use client";

import { MacScrollbar } from "mac-scrollbar";
import { Mdx } from "./MdxCompoents";
import { useTheme } from "next-themes";

export function AboutPage ({ source } : { source: string }) {

    const { theme } = useTheme()

    return (
        <MacScrollbar className="overflow-y-auto w-full h-full pl-8 pr-8 md:pl-10 md:pr-10 lg:pl-20 lg:pr-20 pt-4 pb-4"
            skin={theme == "light" ? "light" : "dark"}
        >
            <Mdx source={source} />
        </MacScrollbar>
    )
}