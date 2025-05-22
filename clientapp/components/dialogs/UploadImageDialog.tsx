import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "components/ui/dialog"


import { useRef, useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "utils/ApiHelper";

interface ErrorMessage {
    status: number;
    title: string;
}

export const UploadImageDialog: React.FC<{ updateTeam?: () => void, id?: number, type: "team" | "person",  children: React.ReactNode }> = ({ updateTeam, id, type, children }) => {

    const [isOpen, setIsOpen] = useState(false)

    const [submitDisabled, setSubmitDisabled] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null);

    const { t } = useTranslation("upload_image", { 
        useSuspense: false  // 禁用 Suspense 模式
    })

    const handleUpload = () => {
        fileInputRef.current?.click();
    }

    const handleFileChange = (event: any) => {
        const file = event.target.files[0];
        if (type == "team" && id) {
            api.team.uploadTeamAvatar({
                avatar: file,
                team_id: id
            }).then((res) => {
                toast.success(t("set_avatar_success"))

                if (updateTeam) updateTeam()
                setTimeout(() => {
                    setIsOpen(false)
                }, 200)
            }).catch((error: AxiosError) => {
                if (error.response?.status) {
                    const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                    toast.error(errorMessage.title)
                } else {
                    toast.error(t("unknow_error"))
                }
            })
        }
        if (type == "person") {
            api.user.uploadUserAvatar({
                avatar: file
            }).then((res) => {
                toast.success(t("set_avatar_success"))

                if (updateTeam) updateTeam()
                setTimeout(() => {
                    setIsOpen(false)
                }, 200)
            }).catch((error: AxiosError) => {
                if (error.response?.status) {
                    const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                    toast.error(errorMessage.title)
                } else {
                    toast.error(t("unknow_error"))
                }
            })
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(status) => {
            setIsOpen(status)
        }}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px] select-none"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>{ t("choose_image") }</DialogTitle>
                </DialogHeader>
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: "none" }} // 隐藏文件选择框
                    onChange={handleFileChange}
                />
                <div className="w-full h-[200px] border-2 border-dashed rounded-xl flex items-center justify-center" onClick={handleUpload} >
                    <Upload size={50} className="opacity-35"/>
                </div>
            </DialogContent>
        </Dialog>
    )
}