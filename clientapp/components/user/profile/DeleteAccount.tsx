import { Button } from "components/ui/button";
import { Shell } from "lucide-react";
import { toast } from 'react-toastify/unstyled';

export default function DeleteAccount() {
    return (
        <div className="w-full h-full items-center justify-center flex gap-2 pb-10">
            <Shell size={40}/>
            <span className="font-bold text-2xl">还没有这个功能 ^^</span>
            <Button
                onClick={() => {
                    toast.info("登陆失败哦，为什么呢")
                    toast.warn("登陆失败哦，为什么呢")
                    toast.success("登陆失败哦，为什么呢")
                    toast.error("登陆失败哦，为什么呢")
                }}
            >Test</Button>
        </div>
    )
}