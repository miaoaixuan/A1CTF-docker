import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "components/ui/alert-dialog"
import { Asterisk } from "lucide-react"
import { ReactNode } from "react"

export default function AlertConformer(
    {
        children,
        title = "",
        description = "",
        type = "default",
        onConfirm,
        onCancel,
    }: {
        children: ReactNode,
        title?: string,
        description?: string,
        type?: "danger" | "default",
        onConfirm?: () => void,
        onCancel?: () => void
    }
) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent className="select-none">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        <div 
                            className={`flex gap-2 items-center ${ type == "danger" ? "text-red-500" : "" }`}
                        >
                            <Asterisk size={30} />
                            {title}
                        </div>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        className="cursor-pointer"
                        onClick={() => {
                            if (onCancel) onCancel()
                        }}
                    >取消</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            if (onConfirm) onConfirm()
                        }}
                        className={`${type == "danger" ? "bg-destructive hover:bg-destructive/90 cursor-pointer" : ""}`}
                    >继续操作</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}