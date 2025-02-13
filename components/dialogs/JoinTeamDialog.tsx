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
import { AxiosError } from "axios";
import { toast } from "sonner";

const formSchema = z.object({
    inviteCode: z.string().regex(/.*:\d+:[a-z0-9]{32}/g, {
        message: "Invalid invite code."
    })
})

interface ErrorMessage {
    status: number;
    title: string;
}

export const JoinTeamDialog: React.FC<{ updateTeam: () => void, children: React.ReactNode }> = ({ updateTeam, children }) => {

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
            toast.success("You have joined the team!", { position: "top-center" })
            updateTeam()
            setIsOpen(false)
        }).catch((error: AxiosError) => {
            if (error.response?.status) {
                const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                toast.error(errorMessage.title, { position: "top-center" })
            } else {
                toast.error("Unknow error", { position: "top-center" })
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
                    <DialogTitle>Join a team</DialogTitle>
                    <DialogDescription>
                        Compete with your friend!
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="inviteCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>InviteCode</FormLabel>
                                    <FormControl>
                                        <Input placeholder="xxxx:xx:xxxxxxxx" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Input your invite code here.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="transition-all duration-300" disabled={submitDisabled}>Submit</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}