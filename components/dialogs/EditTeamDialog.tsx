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
import api, { TeamInfoModel, TeamUserInfoModel } from "@/utils/GZApi";
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

const formSchema = z.object({
    teamName: z.string().min(2, {
        message: "Team name must be at least 2 characters.",
    }),
    slogan: z.string()
})

interface ErrorMessage {
    status: number;
    title: string;
}

export const EditTeamDialog: React.FC<{ updateTeam: () => void, teamModel: TeamInfoModel, children: React.ReactNode }> = ({ updateTeam, teamModel, children }) => {

    let form = useForm<z.infer<typeof formSchema>>({
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
            toast.success(`Update team info successful.`, { position: "top-center" })
            updateTeam()
            setSubmitDisabled(false)
            setIsOpen(false)
        }).catch((error: AxiosError) => {
            if (error.response?.status) {
                const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                toast.error(errorMessage.title, { position: "top-center" })
            } else {
                toast.error("Unknow error", { position: "top-center" })
            }
        })
    }

    const handleKickMember = (member: TeamUserInfoModel) => {
        setSubmitDisabled(true)
        api.team.teamKickUser(teamModel.id!, member.id!).then((res) => {
            toast.success(`Kick user ${ member.userName } successful!`, { position: "top-center" })
            setSubmitDisabled(false)
            updateTeam()
        }).catch((error: AxiosError) => {
            if (error.response?.status) {
                const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                toast.error(errorMessage.title, { position: "top-center" })
            } else {
                toast.error("Unknow error", { position: "top-center" })
            }
        })
    }

    const deleteTeam = () => {
        api.team.teamDeleteTeam(teamModel.id!).then(() => {
            toast.success(`Disband team ${ teamModel.name } successful!`, { position: "top-center" })
            setSubmitDisabled(false)
            updateTeam()
            setIsOpen(false)
        }).catch((error: AxiosError) => {
            if (error.response?.status) {
                const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                toast.error(errorMessage.title, { position: "top-center" })
            } else {
                toast.error("Unknow error", { position: "top-center" })
            }
        })
    }

    const leaveTeam = () => {
        api.team.teamLeave(teamModel.id!).then(() => {
            toast.success(`Leave team ${ teamModel.name } successful!`, { position: "top-center" })
            setSubmitDisabled(false)
            updateTeam()
            setIsOpen(false)
        }).catch((error: AxiosError) => {
            if (error.response?.status) {
                const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                toast.error(errorMessage.title, { position: "top-center" })
            } else {
                toast.error("Unknow error", { position: "top-center" })
            }
        })
    }

    const handleDisband = () => {
        setSubmitDisabled(true)
        setDialogOption((prev) => (
            {
                ...prev,
                isOpen: true,
                message: "Did you really want to disband this team?",
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
                message: "Did you really want to leave this team?",
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
                    <DialogTitle>Edit team - { teamModel.name || "" }</DialogTitle>
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
                                            <FormLabel>TeamName</FormLabel>
                                            <FormControl>
                                                <Input placeholder="a1team" disabled={!isLeader()} {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                This is your team's public display name.
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
                                    <FormLabel>Slogan</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="We can win!" disabled={!isLeader()} {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        This is your team's public display slogan.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormItem>
                            <FormLabel>Members</FormLabel>
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
                                            <Badge className={`pl-2 pr-2 ${ e.captain ? "bg-yellow-500 hover:bg-yellow-400" : "bg-blue-500 hover:bg-blue-400" }`}> { e.captain ? "Leader" : "Member" } </Badge>
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
                            >Disband</Button>
                        ) : (
                            <Button type="button" className="transition-all duration-300 mr-4" variant="destructive" disabled={submitDisabled}
                                onClick={handleLeaveTeam}
                            >LeaveTeam</Button> 
                        ) }
                        <Button type="submit" className="transition-all duration-300" disabled={submitDisabled || !isLeader()}>Save</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}