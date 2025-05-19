"use client";

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
import { useEffect, useState } from "react";
import { Textarea } from "../ui/textarea";
import { api } from "@/utils/GZApi";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ErrorMessage {
    status: number;
    title: string;
}

export const JoinTeamDialog: React.FC<{ updateTeam: () => void, children: React.ReactNode }> = ({ updateTeam, children }) => {

    const t = useTranslations("teams")

    const formSchema = z.object({
        inviteCode: z.string().regex(/.*:\d+:[a-z0-9]{32}/g, {
            message: t("invalid_invite_code")
        })
    })
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            inviteCode: "",
        },
    })

    const [isOpen, setIsOpen] = useState(false)

    const [submitDisabled, setSubmitDisabled] = useState(false)

    function onSubmit(values: z.infer<typeof formSchema>) {
        setSubmitDisabled(true)

        api.team.teamAccept(values.inviteCode).then(() => {
            toast.success(t("join_team_success"))
            updateTeam()
            setIsOpen(false)
        }).catch((error: AxiosError) => {
            if (error.response?.status) {
                const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                toast.error(errorMessage.title)
            } else {
                toast.error(t("unknow_error"))
            }
        }).finally(() => {
            setSubmitDisabled(false)
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={(status) => {
            if (status) form.reset()
            setIsOpen(status)
        }}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px] select-none"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>{ t("join_team") }</DialogTitle>
                    <DialogDescription>
                        { t("join_team_desc") }
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="inviteCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{ t("invite_code") }</FormLabel>
                                    <FormControl>
                                        <Input placeholder="xxxx:xx:xxxxxxxx" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        { t("invite_code_desc") }
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="transition-all duration-300" disabled={submitDisabled}>{ t("submit") }</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}