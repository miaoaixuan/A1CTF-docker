import { cn } from "lib/utils";

export function PixelContainer({ children, className } : { children?: React.ReactNode, className?: string }) {
    return (
        <div className={cn(className, "pixel-border")}>
            { children }
        </div>
    )
}