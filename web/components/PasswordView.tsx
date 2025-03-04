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
import { api, ErrorMessage } from "@/utils/GZApi";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";

export function PasswordView () {

    const t = useTranslations("change_password")

    const formSchema = z.object({
        originalPassword: z.string().min(6, t("form_password_length")),
        newPassword: z.string()
            .min(6, t("form_password_length"))
            .regex(/[0-9]/, t("form_password_number"))
            .regex(/[a-z]/, t("form_password_lower"))
            .regex(/[A-Z]/, t("form_password_upper"))
            .regex(/[^a-zA-Z0-9]/, t("form_password_special")),
        confirmPassword: z.string().min(6, t("form_password_length"))
    }).refine(data => data.newPassword === data.confirmPassword, {
        message: t("form_password_confirm"),
        path: ["confirmPassword"] // 这将使错误信息关联到 confirmPassword 字段
    });

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
            toast.success(t("change_password_success"), { position: "top-center" })
        }).catch((error: AxiosError) => {
            if (error.response?.status) {
                const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                toast.error(errorMessage.title, { position: "top-center" })
            } else {
                toast.error(t("unknow_error"), { position: "top-center" })
            }
        })
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center select-none">
            <div className="w-[80%] md:w-[40%] xl:w-[30%] 3xl:w-[20%] mb-10">
                <span className="font-bold text-2xl">{ t("form_title_change_your_password") }</span>
            </div>
            <div className="w-[80%] md:w-[40%] xl:w-[30%] 3xl:w-[20%]">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="originalPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{ t("form_original_password") }</FormLabel>
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
                                    <FormLabel>{ t("form_new_password") }</FormLabel>
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
                                    <FormLabel>{ t("form_confirm_password") }</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="transition-all duration-300 mr-4">{ t("save") }</Button>
                    </form>
                </Form>
            </div>
        </div>
    )
}