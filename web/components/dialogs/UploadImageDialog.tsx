"use client";

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Textarea } from "../ui/textarea";
import { api } from "@/utils/GZApi";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { FileUp, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

interface ErrorMessage {
    status: number;
    title: string;
}

export const UploadImageDialog: React.FC<{ updateTeam?: () => void, id?: number, type: "team" | "person",  children: React.ReactNode }> = ({ updateTeam, id, type, children }) => {

    const [isOpen, setIsOpen] = useState(false)

    const [submitDisabled, setSubmitDisabled] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null);

    const t = useTranslations("upload_image")

    const handleUpload = () => {
        fileInputRef.current?.click();
    }

    const handleFileChange = (event: any) => {
        const file = event.target.files[0];
        if (type == "team" && id) {
            api.team.teamAvatar(id, {
                file: file
            }).then((res) => {
                toast.success(t("set_avatar_success"), { position: "top-center" })

                if (updateTeam) updateTeam()
                setTimeout(() => {
                    setIsOpen(false)
                }, 200)
            }).catch((error: AxiosError) => {
                if (error.response?.status) {
                    const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                    toast.error(errorMessage.title, { position: "top-center" })
                } else {
                    toast.error(t("unknow_error"), { position: "top-center" })
                }
            })
        }
        if (type == "person") {
            api.account.accountAvatar({
                file: file
            }).then((res) => {
                toast.success(t("set_avatar_success"), { position: "top-center" })

                if (updateTeam) updateTeam()
                setTimeout(() => {
                    setIsOpen(false)
                }, 200)
            }).catch((error: AxiosError) => {
                if (error.response?.status) {
                    const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                    toast.error(errorMessage.title, { position: "top-center" })
                } else {
                    toast.error(t("unknow_error"), { position: "top-center" })
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