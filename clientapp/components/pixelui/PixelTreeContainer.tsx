import { cn } from "lib/utils";

export function PixelTreeContainer({ children, className } : { children?: React.ReactNode, className?: string }) {
    return (
        <div className={cn(className, "pixel-tree-border")}>
            { children }
        </div>
    )
}