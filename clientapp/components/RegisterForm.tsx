
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "components/ui/form"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";
import { useState } from "react";

import { useTheme } from "next-themes";
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { api } from "utils/ApiHelper";
import Turnstile, { useTurnstile } from "react-turnstile";
import { CapWidget } from "@pitininja/cap-react-widget";

export function RegisterForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"form">) {
    const { t } = useTranslation("register_form");

    const [loading, setLoading] = useState(false)
    const [token, setToken] = useState("")

    const { theme, systemTheme } = useTheme();

    const { updateProfile, clientConfig } = useGlobalVariableContext()

    const router = useNavigate()

    const formSchema = z.object({
        email: z.string().email(t("form_email_valid")),
        userName: z.string().min(2, t("form_username_length")),
        password: z.string()
            .min(6, t("form_password_length"))
            .regex(/[0-9]/, t("form_password_number"))
            .regex(/[a-z]/, t("form_password_lower"))
            .regex(/[A-Z]/, t("form_password_upper"))
            .regex(/[^a-zA-Z0-9]/, t("form_password_special")),
        confirmPassword: z.string().min(6, t("form_password_length"))
    }).refine(data => data.password === data.confirmPassword, {
        message: t("form_password_confirm"),
        path: ["confirmPassword"] // 这将使错误信息关联到 confirmPassword 字段
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            "userName": "",
            "email": "",
            "password": "",
            "confirmPassword": ""
        },
    })

    const [submitDisabled, setSubmitDisabled] = useState(false)
    const turnstile = useTurnstile();

    function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        api.auth.userRegister({
            email: values.email,
            username: values.userName,
            password: values.password,
            captcha: token
        }).then((res) => {
            updateProfile(() => {
                router(`/login`)

                setTimeout(() => {
                    toast.success(t("signup_success"))
                }, 300)
            })
        }).catch((error: AxiosError) => {
            turnstile.reset()
            setToken("")
            if (error.response?.status == 400) {
                toast.error((error.response.data as any).message)
            } else {
                toast.error(t("unknow_error"))
            }
        }).finally(() => {
            setLoading(false)
        })
    }

    return (
        <div className='w-full select-none'>
            <div className="flex flex-col items-center gap-2 text-center mb-10">
                <h1 className="text-2xl font-bold">{t("signup_title")}</h1>
                <p className="text-balance text-sm text-muted-foreground">
                    {t("register_account_below")}
                </p>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <div className="h-[20px] items-center flex">
                                    <FormLabel>{t("form_email_address")}</FormLabel>
                                </div>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormDescription>
                                    {t("form_email_desc")}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="userName"
                        render={({ field }) => (
                            <FormItem>
                                <div className="h-[20px] items-center flex">
                                    <FormLabel>{t("form_username")}</FormLabel>
                                </div>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormDescription>
                                    {t("form_username_desc")}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <div className="h-[20px] items-center flex">
                                    <FormLabel>{t("form_password")}</FormLabel>
                                </div>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormDescription>
                                    {t("form_password_desc")}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <div className="h-[20px] items-center flex">
                                    <FormLabel>{t("form_confirm_password")}</FormLabel>
                                </div>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {clientConfig.captchaEnabled ? (
                        <CapWidget
                            endpoint="/api/cap/"
                            onSolve={(token) => {
                                setToken(token)
                            }}
                            onError={() => {
                                toast.error("获取验证码失败")
                            }}
                        />
                    ) : <></>}
                    <div className='h-0' />
                    <Button type="submit" className="transition-all duration-300 w-full" disabled={loading || (clientConfig.captchaEnabled && token == "")}>{t("signup")}</Button>
                    <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border transition-[border-color] duration-300">
                        <span className="relative z-10 bg-background px-2 text-muted-foreground transition-all duration-300">
                            {t("or_continue_with")}
                        </span>
                    </div>
                    <Button type="button" variant={"outline"} className="transition-all duration-300 w-full" onClick={() => router(`/login`)}>{t("login")}</Button>
                </form>
            </Form>
        </div>
    )
}
