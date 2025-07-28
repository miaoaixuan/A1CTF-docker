import { Editor } from "@monaco-editor/react"
import { cn } from "lib/utils"
import { useTheme } from "next-themes"

export default function ThemedEditor(
    { value, onChange, className, language, disabled = false } : {
        value: string | undefined
        onChange: (value: string | undefined) => void,
        className: string,
        language: string,
        disabled?: boolean
    }
) {

    const { theme } = useTheme()

    return (
        <div className={cn(`w-full rounded-lg ${disabled ? "pointer-events-none cursor-not-allowed opacity-50" : ""} overflow-hidden shadow-xs border-1 ${theme === "dark" ? "bg-[#1e1e1e]" : "bg-[#ffffff]"}`, className)}>
            <Editor
                height="100%"
                width="100%"
                defaultLanguage={language}
                theme={theme === "dark" ? "vs-dark" : "light"}
                defaultValue={value}
                onChange={onChange}
            />
        </div>
    )
}