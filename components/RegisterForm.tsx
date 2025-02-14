"use client";


import {useLocale, useTranslations} from 'next-intl';

import {
    Form,
    FormControl,
    FormDescription,
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

import { useTheme } from "next-themes";
import { useTransitionContext } from '@/contexts/TransitionContext';
import { useRouter } from 'next/navigation';
import api, { ErrorMessage } from '@/utils/GZApi';
import { AxiosError } from 'axios';
import { toast } from 'sonner';


const formSchema = z.object({
    email: z.string().email("请输入有效的邮箱地址"),
    userName: z.string().min(2, "用户名至少要两个字符"),
    password: z.string()
        .min(6, "密码至少需要6个字符")
        .regex(/[0-9]/, "密码必须包含至少一个数字")
        .regex(/[a-z]/, "密码必须包含至少一个小写字母")
        .regex(/[A-Z]/, "密码必须包含至少一个大写字母")
        .regex(/[^a-zA-Z0-9]/, "密码必须包含至少一个特殊字符"),
    confirmPassword: z.string().min(6, "密码至少需要6个字符")
}).refine(data => data.password === data.confirmPassword, {
    message: "确认密码必须与新密码一致",
    path: ["confirmPassword"] // 这将使错误信息关联到 confirmPassword 字段
});

export function RegisterForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"form">) {
    const t = useTranslations();

    const [loading, setLoading] = useState(false)

    const { theme } = useTheme();

    const { updateProfile } = useGlobalVariableContext()

    const { startTransition } = useTransitionContext()
    const router = useRouter()
    const lng = useLocale()

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

    function onSubmit(values: z.infer<typeof formSchema>) {
        api.account.accountRegister({
            email: values.email,
            userName: values.userName,
            password: values.password
        }).then((res) => {
            updateProfile(() => {
                startTransition(() => {
                    router.push(`/${lng}/`)
                })
    
                setTimeout(() => {
                    toast.success("注册成功", { position: "top-center" })
                }, 300)
            })
        }).catch((error: AxiosError) => {
            if (error.response?.status == 400) {
                const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                toast.error(errorMessage.title, { position: "top-center" })
            } else {
                toast.error("未知错误", { position: "top-center" })
            }
        })
    }

    return (
        <div className='w-full select-none'>
            <div className="flex flex-col items-center gap-2 text-center mb-10">
                <h1 className="text-2xl font-bold">注册你的账户</h1>
                <p className="text-balance text-sm text-muted-foreground">
                    在下面注册你的账户
                </p>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email address</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormDescription>
                                    Require a valid email adress, temporary email will be rejected.
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
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormDescription>
                                    At least two characters.
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
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormDescription>
                                    At least six characters, including uppercase and lowercase letters, numbers, and special symbols.
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
                                <FormLabel>Confirm password</FormLabel>
                                <FormControl>
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className='h-0' />
                    <Button type="submit" className="transition-all duration-300 w-full">Sign up</Button>
                    <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border transition-[border-color] duration-300">
                        <span className="relative z-10 bg-background px-2 text-muted-foreground transition-all duration-300">
                            {t("or_continue_with")}
                        </span>
                    </div>
                    <Button type="button" variant={"outline"} className="transition-all duration-300 w-full" onClick={() => startTransition(() => {
                        router.push(`/${lng}/login`)
                    })}>Login</Button>
                </form>
            </Form>
        </div>
    )
}
