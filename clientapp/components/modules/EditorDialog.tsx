import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "components/ui/dialog"
import { ReactNode, useState } from "react"
import ThemedEditor from "./ThemedEditor"
import { cn } from "lib/utils"
import { PencilRulerIcon } from "lucide-react"

export default function EditorDialog(
    {
        children,
        value,
        onChange,
        language,
        className = "",
        title = "修改内容"
    }: {
        children: ReactNode,
        value: string | undefined
        onChange: (value: string | undefined) => void,
        language: string,
        className?: string,
        title?: string
    }
) {

    const [isOpen, setIsOpen] = useState(false)

    return (
        <Dialog
            open={isOpen}
            onOpenChange={setIsOpen}
        >
            <form>
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
                <DialogContent className={cn("w-[80vw]! h-[80vh]! max-w-none!", className)}
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>
                            <div className="flex gap-4 items-center">
                                <PencilRulerIcon />
                                {title}
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                    <ThemedEditor
                        value={value}
                        onChange={onChange}
                        language={language}
                        className=""
                    />
                </DialogContent>
            </form>
        </Dialog>
    )
}