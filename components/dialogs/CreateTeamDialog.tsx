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
import api from "@/utils/GZApi";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";

interface ErrorMessage {
    status: number;
    title: string;
}

export const CreateTeamDialog: React.FC<{ updateTeam: () => void, children: React.ReactNode }> = ({ updateTeam , children }) => {

    const t = useTranslations("teams")

    const formSchema = z.object({
        teamName: z.string().min(2, {
            message: t("form_team_name_error"),
        }),
        slogan: z.string()
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            teamName: "",
            slogan: ""
        },
    })

    const [isOpen, setIsOpen] = useState(false)

    function onSubmit(values: z.infer<typeof formSchema>) {
        api.team.teamCreateTeam({
            name: values.teamName,
            bio: values.slogan
        }).then((res) => {
            toast.success(t("create_team_success"), { position: "top-center" })
            updateTeam()
            setIsOpen(false)
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
                    <DialogTitle>{ t("create_team") }</DialogTitle>
                    <DialogDescription>
                        { t("create_team_desc") }
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="teamName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{ t("team_name") }</FormLabel>
                                    <FormControl>
                                        <Input placeholder="a1team" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        { t("team_name_desc") }
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="slogan"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{ t("slogan") }</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="We can win!" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit">{ t("submit") }</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}