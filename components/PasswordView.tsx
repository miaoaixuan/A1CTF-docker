"use client";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useGlobalVariableContext } from "@/contexts/GlobalVariableContext";
import { useState } from "react";
import api, { ErrorMessage } from "@/utils/GZApi";
import { toast } from "sonner";
import { AxiosError } from "axios";


const formSchema = z.object({
    originalPassword: z.string().min(6, "密码至少需要6个字符"),
    newPassword: z.string()
        .min(6, "密码至少需要6个字符")
        .regex(/[0-9]/, "密码必须包含至少一个数字")
        .regex(/[a-z]/, "密码必须包含至少一个小写字母")
        .regex(/[A-Z]/, "密码必须包含至少一个大写字母")
        .regex(/[^a-zA-Z0-9]/, "密码必须包含至少一个特殊字符"),
    confirmPassword: z.string().min(6, "密码至少需要6个字符")
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "确认密码必须与新密码一致",
    path: ["confirmPassword"] // 这将使错误信息关联到 confirmPassword 字段
});

export function PasswordView () {

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            originalPassword: "",
            newPassword: "",
            confirmPassword: ""
        },
    })

    const [submitDisabled, setSubmitDisabled] = useState(false)
    const { curProfile, updateProfile } = useGlobalVariableContext()

    function onSubmit(values: z.infer<typeof formSchema>) {
        setSubmitDisabled(true)

        api.account.accountChangePassword({
            old: values.originalPassword,
            new: values.newPassword
        }).then((res) => {
            toast.success(`Change password successful.`, { position: "top-center" })
        }).catch((error: AxiosError) => {
            if (error.response?.status) {
                const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                toast.error(errorMessage.title, { position: "top-center" })
            } else {
                toast.error("Unknow error", { position: "top-center" })
            }
        })
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center select-none">
            <div className="w-[20%] mb-10">
                <span className="font-bold text-2xl">Change your password</span>
            </div>
            <div className="w-[20%]">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="originalPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Original Password</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm password</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="transition-all duration-300 mr-4">Save</Button>
                    </form>
                </Form>
            </div>
        </div>
    )
}