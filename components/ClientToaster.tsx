"use client";

import { useTheme } from "next-themes";
import { Tooltip } from "react-tooltip";
import { Toaster } from "sonner";

export function ClientToaster() {

    const { theme } = useTheme()

    return (
        <>
            <Toaster
                theme={ theme == "light" ? "light" : "dark" }
                style={{ backgroundColor: "hsl(var(--background))" }}
                className="z-[400]"
                richColors
                visibleToasts={3}
                closeButton={true}
            />
            <Tooltip id="challengeTooltip3" opacity={0.9} className='z-[200]'/>
        </>
    )
}