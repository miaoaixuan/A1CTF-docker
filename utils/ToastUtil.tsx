import { Button } from "@/components/ui/button";
import dayjs from "dayjs";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, CalendarDays, CircleX, FileType2, LetterText, MailCheck, PackageOpen, Text } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { Toaster, toast } from 'sonner'

export function toastError({ title, theme }: { title: string, theme: string }) {

    const bgColor =
        theme === 'light' ? 'rgba(255, 255, 255)' : 'rgba(0, 0, 0)';

    return (
        toast.error(title)
    )
}

export function toastSuccess({ title, theme }: { title: string, theme: string }) {

    const bgColor =
        theme === 'light' ? 'rgba(255, 255, 255)' : 'rgba(0, 0, 0)';


    return (
        toast.success(title)
    )
}

export function toastNewNotice({ title, time, openNotices }: { title: string, time: number, openNotices: Dispatch<SetStateAction<boolean>> }) {

    toast.custom((t) => (
        <div className="bg-background border-2 rounded-2xl w-full relative">
            <div className="flex flex-col justify-center gap-2 p-4 pl-4 pr-4">
                <div className="flex gap-2 items-center">
                    <MailCheck size={20} />
                    <span className="text-sm">比赛发布了新的公告，请注意查看</span>
                </div>
                <div className="flex gap-2 items-center">
                    <CalendarClock size={20} />
                    <span className="text-sm">{ dayjs(time).format("YYYY-MM-DD HH:mm:ss") }</span>
                </div>
                <div className="flex gap-2">
                    <FileType2 size={20} className="flex-none" />
                    <span className="text-sm">{ title.substring(0, Math.min(title.length, 50)) + ((title.length > 50) ? "…" : "") }</span>
                </div>
                <div className="flex gap-4 mt-2 justify-center">
                    <Button variant="outline" className="flex" onClick={() => {
                        toast.dismiss(t)
                        setTimeout(() => {
                            openNotices(true)
                        }, 300)
                    }}>
                        <div className="flex items-center gap-1">
                            <PackageOpen />
                            <span>打开公告</span>
                        </div>
                    </Button>
                    <Button variant="outline" onClick={() => toast.dismiss(t)}><CircleX /> 关闭</Button>
                </div>
            </div>
        </div>
    ), {
        duration: 600000,
        position: "top-center",
    })

}