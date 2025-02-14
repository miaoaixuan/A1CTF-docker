"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useGlobalVariableContext } from "@/contexts/GlobalVariableContext";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import api, { ErrorMessage } from "@/utils/GZApi";
import { AxiosError } from "axios";

export function ChangeEmailView() {

    const [step, setStep] = useState<1 | 2>(1);
    const { curProfile } = useGlobalVariableContext()
    const [newEmail, setNewEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSendCode = async () => {
        if (!newEmail) {
            toast.error("请输入邮箱地址", { position: "top-center" })
            return
        }

        api.account.accountChangeEmail({
            newMail: newEmail
        }).then((res) => {
            if (res.data.data) {
                setStep(2)
            } else {
                toast.error(res.data.title, { position: "top-center" })
            }
        }).catch((error: AxiosError) => {
            const errorMessage: ErrorMessage = error.response?.data as ErrorMessage
            toast.error(errorMessage.title, { position: "top-center" })
        })
    };

    const handleConfirmCode = async () => {

    };

    return (
        <div className="flex w-full items-center justify-center min-h-screen">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>修改邮箱地址</CardTitle>
                    <CardDescription>
                        {step === 1
                            ? "请输入新的邮箱地址，我们将发送验证码到您的邮箱。"
                            : ""}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {step === 1 ? (
                        <div className="space-y-2">
                            <Label htmlFor="new-email">新邮箱地址</Label>
                            <Input
                                id="new-email"
                                type="email"
                                placeholder="请输入新邮箱"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div className="space-y-2 justify-center items-center flex w-full flex-col pt-10 pb-10 select-none">
                            <MailCheck size={60} />
                            <Label className="text-2xl font-bold">验证码已经发送</Label>
                            <Label className="text-md">请点击邮箱链接完成更改</Label>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    {step === 1 ? (
                        <Button onClick={handleSendCode} disabled={isLoading} className="w-full">
                            {isLoading ? "发送中..." : "发送验证码"}
                        </Button>
                    ) : (
                        <></>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}