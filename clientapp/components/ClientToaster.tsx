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
                position="top-center"
                visibleToasts={4}
                closeButton={true}
            />
            <Tooltip id="my-tooltip" className='z-[200]'/>
            <Tooltip id="challengeTooltip3" opacity={0.9} className='z-[200]'/>
        </>
    )
}