"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

export function ClientToaster() {

    const { theme } = useTheme()

    return (
        <Toaster
            theme={ theme == "light" ? "light" : "dark" }
            style={{ backgroundColor: "hsl(var(--background))" }}
            richColors
            visibleToasts={3}
            closeButton={true}
        />
    )
}