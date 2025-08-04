import { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form";
import { SystemSettingsValues } from "./AdminSettingsPage";
import ThemedEditor from "components/modules/ThemedEditor";
import { Input } from "components/ui/input";

import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "components/ui/card"
import { Button } from "components/ui/button";
import { useState } from "react";
import { Mails, Send } from "lucide-react";
import { toast } from "react-toastify/unstyled";
import { api, createSkipGlobalErrorConfig } from "utils/ApiHelper";

export default function TemplateSettings(
    { form }: {
        form: UseFormReturn<SystemSettingsValues>,
    }
) {

    const [testEmailReceiver, setTestEmailReceiver] = useState("")

    const handleSendTestMail = function (type: "forget" | "verify" | "test") {
        if (!testEmailReceiver) {
            toast.error("请输入测试邮箱")
            return
        }
        api.system.sendSmtpTestMail({
            to: testEmailReceiver,
            type: type
        }, createSkipGlobalErrorConfig()).then((res) => {
            toast.success("测试邮件已发送")
        }).catch((err) => {
            toast.success("测试邮件发送失败，请查看系统日志检查错误")
        })
    }

    return (
        <>
            <span className="text-2xl font-bold mb-4">模板设置</span>
            <div className="space-y-8">
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>邮箱验证模板</CardTitle>
                        <CardDescription>
                            可以在这里设置邮箱验证邮件的模板
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="gap-4 flex flex-col mt-4">
                        <FormField
                            control={form.control}
                            name="verifyEmailHeader"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center h-[20px]">
                                        <FormLabel>邮件标题</FormLabel>
                                        <div className="flex-1" />
                                        <FormMessage className="text-[14px]" />
                                    </div>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="verifyEmailTemplate"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center h-[20px]">
                                        <FormLabel>邮件正文</FormLabel>
                                        <div className="flex-1" />
                                        <FormMessage className="text-[14px]" />
                                    </div>
                                    <FormControl>
                                        <ThemedEditor
                                            value={field.value}
                                            onChange={field.onChange}
                                            language="html"
                                            className='h-[500px]'
                                        />
                                    </FormControl>
                                    <FormDescription>可以在这里输入你的邮件模板, 关键数据的模板名称请参考文档</FormDescription>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="flex flex-col pt-4 gap-2">
                        <div className="flex gap-2 w-full items-center">
                            <span className="text-sm font-bold">发送测试邮件(模板变量不会被替换)</span>
                        </div>
                        <div className="flex gap-4 w-full">
                            <Input placeholder="请输入接受者的邮箱" value={testEmailReceiver} className="flex-1" onChange={(e) => setTestEmailReceiver(e.target.value)}></Input>
                            <Button type="submit" variant="outline"
                                onClick={() => handleSendTestMail("verify")}
                            >
                                <Send />
                                测试发送
                            </Button>
                        </div>

                    </CardFooter>
                </Card>

                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>找回密码邮件模板</CardTitle>
                        <CardDescription>
                            可以在这里设置找回密码邮件的模板
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="gap-4 flex flex-col mt-4">
                        <FormField
                            control={form.control}
                            name="forgetPasswordHeader"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center h-[20px]">
                                        <FormLabel>邮件标题</FormLabel>
                                        <div className="flex-1" />
                                        <FormMessage className="text-[14px]" />
                                    </div>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="forgetPasswordTemplate"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center h-[20px]">
                                        <FormLabel>邮件正文</FormLabel>
                                        <div className="flex-1" />
                                        <FormMessage className="text-[14px]" />
                                    </div>
                                    <FormControl>
                                        <ThemedEditor
                                            value={field.value}
                                            onChange={field.onChange}
                                            language="html"
                                            className='h-[500px]'
                                        />
                                    </FormControl>
                                    <FormDescription>可以在这里输入你的邮件模板, 关键数据的模板名称请参考文档</FormDescription>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="flex flex-col pt-4 gap-2">
                        <div className="flex gap-2 w-full items-center">
                            <span className="text-sm font-bold">发送测试邮件(模板变量不会被替换)</span>
                        </div>
                        <div className="flex gap-4 w-full">
                            <Input placeholder="请输入接受者的邮箱" value={testEmailReceiver} className="flex-1" onChange={(e) => setTestEmailReceiver(e.target.value)}></Input>
                            <Button type="submit" variant="outline"
                                onClick={() => handleSendTestMail("forget")}
                            >
                                <Send />
                                测试发送
                            </Button>
                        </div>

                    </CardFooter>
                </Card>
            </div>
        </>
    )
}