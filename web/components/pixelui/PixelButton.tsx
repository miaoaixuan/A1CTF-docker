import { cn } from "@/lib/utils";

export function PixelButton({ className } : { children?: React.ReactNode, className?: string }) {
    return (
        <button className={cn(className, "pixel-button disabled:opacity-50")}>
            登录
        </button>
    )
}