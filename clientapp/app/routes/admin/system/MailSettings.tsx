import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Switch } from "components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form";
import { SystemSettingsValues } from "./AdminSettingsPage";
import { Editor } from "@monaco-editor/react";
import { Mail } from "lucide-react";
import ThemedEditor from "components/modules/ThemedEditor";
import { useState } from "react";
import { api, createSkipGlobalErrorConfig } from "utils/ApiHelper";
import { toast } from 'react-toastify/unstyled';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";


export const MailSettings = (
    { form }: {
        form: UseFormReturn<SystemSettingsValues>,
    }
) => {

    const [smtpTestTarget, setSmtpTestTarget] = useState("")

    return (
        <>
            <span className="text-2xl font-bold mb-4">邮件设置</span>

            <FormField
                control={form.control}
                name="smtpHost"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center h-[20px]">
                            <FormLabel>SMTP服务器</FormLabel>
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
                name="smtpPort"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center h-[20px]">
                            <FormLabel>SMTP端口</FormLabel>
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
                name="smtpPortType"
                render={({ field }) => {
                    console.log(field.value)
                    return (
                        <FormItem>
                            <div className="flex items-center h-[20px]">
                                <FormLabel>SMTP端口类型</FormLabel>
                                <div className="flex-1" />
                                <FormMessage className="text-[14px]" />
                            </div>
                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择账户激活方式" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">无(25端口默认)</SelectItem>
                                    <SelectItem value="tls">TLS</SelectItem>
                                    <SelectItem value="starttls">STARTTLS</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )
                }}
            />

            <FormField
                control={form.control}
                name="smtpName"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center h-[20px]">
                            <FormLabel>发件人名字</FormLabel>
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
                name="smtpUsername"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center h-[20px]">
                            <FormLabel>SMTP用户名</FormLabel>
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
                name="smtpPassword"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center h-[20px]">
                            <FormLabel>SMTP密码</FormLabel>
                            <div className="flex-1" />
                            <FormMessage className="text-[14px]" />
                        </div>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormDescription>邮箱密码或授权码</FormDescription>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="smtpFrom"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center h-[20px]">
                            <FormLabel>发件人地址</FormLabel>
                            <div className="flex-1" />
                            <FormMessage className="text-[14px]" />
                        </div>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormDescription>例如: noreply@example.com</FormDescription>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="emailTemplate"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center h-[20px]">
                            <FormLabel>邮件模板</FormLabel>
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

            <div className="flex flex-col gap-2 mt-1">
                <FormLabel>邮件测试</FormLabel>
                <div className="flex gap-4 mt-1">
                    <Input value={smtpTestTarget} onChange={(val) => setSmtpTestTarget(val.target.value)} />
                    <Button
                        onClick={() => {
                            api.system.sendSmtpTestMail({
                                to: smtpTestTarget
                            }, createSkipGlobalErrorConfig()).then((res) => {
                                toast.success("测试邮件已发送")
                            }).catch((err) => {
                                toast.success("测试邮件发送失败，请查看系统日志检查错误")
                            })
                        }}
                    >
                        <Mail />
                        发送
                    </Button>
                </div>
                <FormDescription>请先保存再发送测试</FormDescription>
            </div>
        </>
    );
};

export default MailSettings; 