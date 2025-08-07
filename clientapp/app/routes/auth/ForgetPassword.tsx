import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { CheckCheck, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify/unstyled";
import { api } from "utils/ApiHelper";

export default function ForgetPassword() {

    const [email, setEmail] = useState("")
    const [sended, setSended] = useState(false)

    const handleForgetPassword = () => {
        if (!email) {
            toast.error("请输入邮箱")
            return
        }
        api.user.sendForgetPasswordEmail({
            email: email
        }).then(() => {
            setSended(true)
        })
    }

    return (
        <div className="w-screen h-screen flex items-center justify-center select-none">

            {!sended ? (
                <div className="w-full flex flex-col p-8 border-1 bg-background/40 z-[5] rounded-2xl max-w-lg gap-4">
                    <span className="text-xl font-bold">找回密码</span>
                    <div className="flex flex-col gap-2">
                        <span className="text-sm text-muted-foreground">输入欲找回密码的邮箱</span>
                        <Input placeholder="请输入邮箱" value={email} onChange={(e) => setEmail(e.target.value)}></Input>
                    </div>
                    <div className="flex justify-end">
                        <Button variant="outline"
                            onClick={handleForgetPassword}
                        >
                            <Send />
                            发送找回密码邮件
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="w-full flex flex-col p-8 border-1 bg-background/40 z-[5] rounded-2xl max-w-lg gap-4 items-center justify-center">
                    <CheckCheck size={64} />
                    <span className="text-xl text-muted-foreground">已发送找回密码邮件，请检查邮箱</span>
                </div>
            )}
        </div>
    )
}