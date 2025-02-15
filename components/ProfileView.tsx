"use client";

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
import { UploadImageDialog } from "./dialogs/UploadImageDialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useGlobalVariableContext } from "@/contexts/GlobalVariableContext";
import { Skeleton } from "./ui/skeleton";
import { MacScrollbar } from "mac-scrollbar";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import api, { ErrorMessage } from "@/utils/GZApi";
import { useTransitionContext } from "@/contexts/TransitionContext";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export function ProfileView () {

    const { startTransition } = useTransitionContext()
    const lng = useLocale()
    const router = useRouter()

    const [submitDisabled, setSubmitDisabled] = useState(false)

    const t = useTranslations("profile_settings")


    const formSchema = z.object({
        userName: z.string().min(2, {
            message: t("form_username_error")
        }),
        phone: z.string().regex(/^1(3\d|4[5-9]|5[0-35-9]|6[2567]|7[0-8]|8\d|9[0-35-9])\d{8}$/g, {
            message: t("form_phone_error")
        }),
        studentNumber: z.string(),
        realName: z.string(),
        desc: z.string()
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            userName: "",
            phone: "",
            studentNumber: "",
            realName: "",
            desc: ""
        },
    })

    const { curProfile, updateProfile } = useGlobalVariableContext()

    useEffect(() => {
        form.setValue("userName", curProfile.userName || "")
        form.setValue("phone", curProfile.phone || "")
        form.setValue("studentNumber", curProfile.stdNumber || "")
        form.setValue("realName", curProfile.realName || "")
        form.setValue("desc", curProfile.bio || "")
    }, [curProfile])
    
    function onSubmit(values: z.infer<typeof formSchema>) {
        setSubmitDisabled(true)
        api.account.accountUpdate({
            "userName": values.userName,
            "realName": values.realName,
            "stdNumber": values.studentNumber,
            "bio": values.desc,
            "phone": values.phone
        }).then((res) => {
            toast.success(t("save_profile_success"), { position: "top-center" })
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
        <MacScrollbar className="w-full h-full flex flex-col overflow-hidden overflow-y-auto select-none">
            <div className="w-full flex flex-col items-center pt-12">
                <div className="flex w-[80%] lg:w-[40%]">
                    <span className="font-bold text-2xl mb-10">{ t("change_profile_below") }</span>
                </div>
                <div className="w-[80%] lg:w-[40%] pb-12">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <div className="flex gap-10">
                                <div className="flex-1">
                                    <FormField
                                        control={form.control}
                                        name="userName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{ t("form_username_label") }</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    { t("form_username_desc") }
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex h-full items-center">
                                    <UploadImageDialog type="person" updateTeam={updateProfile}>
                                        <Avatar className="select-none w-20 h-20">
                                            { curProfile.avatar ? (
                                                <>
                                                    <AvatarImage src={curProfile.avatar || "#"} alt="@shadcn"
                                                        className={`rounded-2xl`}
                                                    />
                                                    <AvatarFallback><Skeleton className="h-20 w-20 rounded-full" /></AvatarFallback>
                                                </>
                                            ) : ( 
                                                <div className='w-full h-full bg-foreground/80 flex items-center justify-center rounded-2xl'>
                                                    <span className='text-background text-xl'> { curProfile.userName?.substring(0, 2) } </span>
                                                </div>
                                            ) }
                                        </Avatar>
                                    </UploadImageDialog>
                                </div>
                            </div>
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{ t("form_phone_label") }</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            { t("form_phone_desc") }
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="realName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{ t("form_realname_label") }</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            { t("form_realname_desc") }
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="studentNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{ t("form_student_number_label") }</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            { t("form_student_number_desc") }
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="desc"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{ t("form_desc_label") }</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            { t("form_desc_desc") }
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="transition-all duration-300 mr-4">{ t("submit") }</Button>
                            <Button type="button" className="transition-all duration-300" onClick={() => startTransition(() => {
                                router.push(`/${lng}/profile/email`)
                            })}>{ t("change_email") }</Button>
                        </form>
                    </Form>
                </div>
            </div>
        </MacScrollbar>
    )
}