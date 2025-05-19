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
import { useEffect, useRef, useState } from "react";
import { Textarea } from "../ui/textarea";
import { api, TeamInfoModel, TeamUserInfoModel } from "@/utils/GZApi";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Avatar } from "@radix-ui/react-avatar";
import { AvatarFallback, AvatarImage } from "../ui/avatar";
import { Skeleton } from "../ui/skeleton";
import { UploadImageDialog } from "./UploadImageDialog";
import { Badge } from "../ui/badge";
import { Trash2 } from "lucide-react";
import { useGlobalVariableContext } from "@/contexts/GlobalVariableContext";
import { ConfirmDialog, DialogOption } from "./ConfirmDialog";
import { useTranslations } from "next-intl";


interface ErrorMessage {
    status: number;
    title: string;
}

export const EditTeamDialog: React.FC<{ updateTeam: () => void, teamModel: TeamInfoModel, children: React.ReactNode }> = ({ updateTeam, teamModel, children }) => {

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
            teamName: teamModel.name || "",
            slogan: teamModel.bio || ""
        },
    })

    const resetValue = () => {
        form.setValue("slogan", teamModel.bio || "")
        form.setValue("teamName", teamModel.name || "")
    }

    useEffect(() => {
        resetValue()
    }, [teamModel])

    const [isOpen, setIsOpen] = useState(false)
    const { curProfile } = useGlobalVariableContext()
    const [submitDisabled, setSubmitDisabled] = useState(false)

    const [dialogOption, setDialogOption] = useState<DialogOption>({
        isOpen: false,
        message: ""
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        setSubmitDisabled(true)
        api.team.teamUpdateTeam(teamModel.id!, {
            name: values.teamName,
            bio: values.slogan
        }).then((res) => {
            toast.success(t("update_successful"))
            updateTeam()
            setSubmitDisabled(false)
            setIsOpen(false)
        }).catch((error: AxiosError) => {
            if (error.response?.status) {
                const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                toast.error(errorMessage.title)
            } else {
                toast.error(t("unknow_error"))
            }
        })
    }

    const handleKickMember = (member: TeamUserInfoModel) => {
        setSubmitDisabled(true)
        api.team.teamKickUser(teamModel.id!, member.id!).then((res) => {
            toast.success(`${t("kick_user_info_p1")} ${ member.userName } ${t("kick_user_info_p2")}`)
            setSubmitDisabled(false)
            updateTeam()
        }).catch((error: AxiosError) => {
            if (error.response?.status) {
                const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                toast.error(errorMessage.title)
            } else {
                toast.error(t("unknow_error"))
            }
        })
    }

    const deleteTeam = () => {
        api.team.teamDeleteTeam(teamModel.id!).then(() => {
            toast.success(`${t("disband_info_p1")} ${ teamModel.name } ${t("disband_info_p2")}`)
            setSubmitDisabled(false)
            updateTeam()
            setIsOpen(false)
        }).catch((error: AxiosError) => {
            if (error.response?.status) {
                const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                toast.error(errorMessage.title)
            } else {
                toast.error(t("unknow_error"))
            }
        })
    }

    const leaveTeam = () => {
        api.team.teamLeave(teamModel.id!).then(() => {
            toast.success(`${t("leave_team_info_p1")} ${ teamModel.name } ${t("leave_team_info_p2")}`)
            setSubmitDisabled(false)
            updateTeam()
            setIsOpen(false)
        }).catch((error: AxiosError) => {
            if (error.response?.status) {
                const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                toast.error(errorMessage.title)
            } else {
                toast.error(t("unknow_error"))
            }
        })
    }

    const handleDisband = () => {
        setSubmitDisabled(true)
        setDialogOption((prev) => (
            {
                ...prev,
                isOpen: true,
                message: t("disband_confirm_dialog"),
                onConfirm: deleteTeam,
                onCancel: () => setSubmitDisabled(false)
            }
        ))
    }

    const handleLeaveTeam = () => {
        setSubmitDisabled(true)
        setDialogOption((prev) => (
            {
                ...prev,
                isOpen: true,
                message: t("leave_confirm_dialog"),
                onConfirm: leaveTeam,
                onCancel: () => setSubmitDisabled(false)
            }
        ))
    }

    const isLeader = () => {
        const target = teamModel.members?.find((e) => e.id == curProfile.userId)
        return target?.captain
    }

    return (
        <Dialog open={isOpen} onOpenChange={(status) => {
            if (status) resetValue()
            setIsOpen(status)
        }}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px] select-none"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <ConfirmDialog settings={dialogOption} setSettings={setDialogOption} />
                <DialogHeader>
                    <DialogTitle>{ t("edit_team") } - { teamModel.name || "" }</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="flex w-full items-center gap-8">
                            <div className="flex-1">
                                <FormField
                                    control={form.control}
                                    name="teamName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{ t("team_name") }</FormLabel>
                                            <FormControl>
                                                <Input placeholder="a1team" disabled={!isLeader()} {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                { t("team_name_desc") }
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            { isLeader() ? (
                                <UploadImageDialog id={teamModel.id!} type="team" updateTeam={updateTeam}>
                                    <Avatar className="select-none w-20 h-20 mr-4">
                                        { teamModel.avatar ? (
                                            <>
                                                <AvatarImage src={teamModel.avatar || "#"} alt="@shadcn"
                                                    className={`rounded-2xl`}
                                                />
                                                <AvatarFallback><Skeleton className="h-20 w-20 rounded-full" /></AvatarFallback>
                                            </>
                                        ) : ( 
                                            <div className='w-full h-full bg-foreground/80 flex items-center justify-center rounded-2xl'>
                                                <span className='text-background text-xl'> { teamModel.name?.substring(0, 2) } </span>
                                            </div>
                                        ) }
                                    </Avatar>
                                </UploadImageDialog>
                            ) : (
                                <Avatar className="select-none w-20 h-20 mr-4">
                                    { teamModel.avatar ? (
                                        <>
                                            <AvatarImage src={teamModel.avatar || "#"} alt="@shadcn"
                                                className={`rounded-2xl`}
                                            />
                                            <AvatarFallback><Skeleton className="h-20 w-20 rounded-full" /></AvatarFallback>
                                        </>
                                    ) : ( 
                                        <div className='w-full h-full bg-foreground/80 flex items-center justify-center rounded-2xl'>
                                            <span className='text-background text-xl'> { teamModel.name?.substring(0, 2) } </span>
                                        </div>
                                    ) }
                                </Avatar>
                            ) }
                        </div>
                        <FormField
                            control={form.control}
                            name="slogan"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{ t("slogan") }</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="We can win!" disabled={!isLeader()} {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        { t("slogan_desc") }
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormItem>
                            <FormLabel>{ t("members") }</FormLabel>
                            <FormControl>
                                <div className="flex flex-col gap-3">
                                    { teamModel.members?.map((e, index) => (
                                        <div className="flex items-center gap-4" key={`edit_member_${index}`}>
                                            <Avatar className="select-none w-12 h-12" key={`user-${index}`}>
                                                { e.avatar ? (
                                                    <>
                                                        <AvatarImage src={e.avatar || "#"} alt="@shadcn"
                                                            className={`rounded-xl`}
                                                        />
                                                        <AvatarFallback><Skeleton className="h-12 w-12 rounded-full" /></AvatarFallback>
                                                    </>
                                                ) : ( 
                                                    <div className='w-full h-full bg-foreground/80 flex items-center justify-center rounded-xl'>
                                                        <span className='text-background text-xl'> { e.userName?.substring(0, 2) } </span>
                                                    </div>
                                                ) }
                                            </Avatar>
                                            <span className="text-lg">{ e.userName }</span>
                                            <div className="flex-1"/>
                                            <Badge className={`pl-2 pr-2 ${ e.captain ? "bg-yellow-500 hover:bg-yellow-400" : "bg-blue-500 hover:bg-blue-400" }`}> { e.captain ? t("leader") : t("member") } </Badge>
                                            { e.captain || !isLeader() || submitDisabled ? (
                                                <Trash2 className="stroke-foreground/20" />
                                            ) : (
                                                <Trash2 className="hover:stroke-red-500 transition-colors duration-300" 
                                                    onClick={() => handleKickMember(e)}
                                                />) 
                                            }
                                        </div>
                                    )) }
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        { isLeader() ? (
                            <Button type="button" className="transition-all duration-300 mr-4" variant="destructive" disabled={submitDisabled || !isLeader()}
                                onClick={handleDisband}
                            >{ t("disband") }</Button>
                        ) : (
                            <Button type="button" className="transition-all duration-300 mr-4" variant="destructive" disabled={submitDisabled}
                                onClick={handleLeaveTeam}
                            >{ t("leave_team") }</Button> 
                        ) }
                        <Button type="submit" className="transition-all duration-300" disabled={submitDisabled || !isLeader()}>{ t("save") }</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}