import { useState } from "react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "components/ui/card";
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";
import { MailCheck } from "lucide-react";
import { toast } from 'react-toastify/unstyled';
import { api, ErrorMessage } from "utils/GZApi";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";

export function ChangeEmailView() {

    const { t } = useTranslation("change_email")

    const [step, setStep] = useState<1 | 2>(1);
    const { curProfile } = useGlobalVariableContext()
    const [newEmail, setNewEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSendCode = async () => {
        if (!newEmail) {
            toast.error(t("please_input_email"))
            return
        }

        api.account.accountChangeEmail({
            newMail: newEmail
        }).then((res) => {
            if (res.data.data) {
                setStep(2)
            } else {
                toast.error(res.data.title)
            }
        })
    };

    const handleConfirmCode = async () => {

    };

    return (
        <div className="flex w-full items-center justify-center min-h-screen select-none">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{ t("edit_email_title") }</CardTitle>
                    <CardDescription>
                        {step === 1
                            ? t("please_input_new_email")
                            : ""}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {step === 1 ? (
                        <div className="space-y-2">
                            <Label htmlFor="new-email">{ t("new_email_address") }</Label>
                            <Input
                                id="new-email"
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div className="space-y-2 justify-center items-center flex w-full flex-col pt-10 pb-10 select-none">
                            <MailCheck size={60} />
                            <Label className="text-2xl font-bold">{ t("activate_link_sended") }</Label>
                            <Label className="text-md">{ t("click_link") }</Label>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    {step === 1 ? (
                        <Button onClick={handleSendCode} disabled={isLoading} className="w-full">
                            {isLoading ? t("sending") : t("send_link")}
                        </Button>
                    ) : (
                        <></>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}