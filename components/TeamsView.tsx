"use client";

import api, { TeamInfoModel } from "@/utils/GZApi";
import { Avatar } from "@radix-ui/react-avatar";
import { MacScrollbar } from "mac-scrollbar";
import { useEffect, useRef, useState } from "react";
import { AvatarFallback, AvatarImage } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";
import { Asterisk, Clipboard, Eye, EyeOff, Plus, RefreshCcw, Settings, SquareAsterisk, Users, Wrench } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Tooltip } from "react-tooltip";
import { toast } from "sonner";

import copy from 'copy-to-clipboard';
import { CreateTeamDialog } from "./dialogs/CreateTeamDialog";
import { JoinTeamDialog } from "./dialogs/JoinTeamDialog";
import { EditTeamDialog } from "./dialogs/EditTeamDialog";
import { AxiosError } from "axios";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LoadingPage } from "./LoadingPage";

interface ErrorMessage {
    status: number;
    title: string;
}

export function TeamsView() {

    const [teams, setTeams] = useState<TeamInfoModel[]>([])

    const [inviteCodes, setInviteCodes] = useState<Record<number, string>>({})
    const [showInviteCodes, setShowInviteCodes] = useState<Record<number, boolean>>({})
    const curTeamRef = useRef<number[]>([])

    const [loadingPageVisible, setLoadingPageVisible] = useState(true)

    const t = useTranslations("teams")

    const lng = useLocale()
    const { theme } = useTheme()
    const router = useRouter()

    const updateTeams = (first?: boolean) => {
        api.team.teamGetTeamsInfo().then((res) => {

            setTimeout(() => {
                setLoadingPageVisible(false)
            }, 200)

            res.data.forEach((e) => {
                if (curTeamRef.current.findIndex((val) => val == e.id!) == -1) {
                    setShowInviteCodes((prev) => ({
                        ...prev,
                        [e.id!]: false
                    }))
                    setInviteCodes((prev) => ({
                        ...prev,
                        [e.id!]: "null"
                    }))
                    curTeamRef.current.push(e.id!)
                }
            })

            setTeams(res.data)
        }).catch((error: AxiosError) => {
            if (error.response?.status == 401) {
                toast.error(t("please_login_first"), { position: "top-center" })
                router.push(`/${lng}/login`)
            }
        })
    }

    useEffect(() => {

        updateTeams(true)

        const updateInter = setInterval(() => {
            updateTeams()
        }, 5000)

        return () => {
            clearInterval(updateInter)
        }
    }, [])

    const handleShowInviteCode = (team: TeamInfoModel) => {
        if (team.id != undefined) {
            if (inviteCodes[team.id] == "null") {
                api.team.teamInviteCode(team.id).then((res) => {
                    setInviteCodes((prev) => ({
                        ...prev,
                        [team.id!]: res.data
                    }))
    
                    setShowInviteCodes((prev) => ({
                        ...prev,
                        [team.id!]: !showInviteCodes[team.id!]
                    }))
                })
            } else {
                setShowInviteCodes((prev) => ({
                    ...prev,
                    [team.id!]: !showInviteCodes[team.id!]
                }))
            }
        }
    }

    const refreshInviteCode = (team: TeamInfoModel) => {
        api.team.teamUpdateInviteToken(team.id!).then((res) => {
            toast.success(t("update_invite_code_success"), { position: "top-center" })
            setInviteCodes((prev) => ({
                ...prev,
                [team.id!]: res.data
            }))
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
        <div className="flex w-full h-full relative">
            <LoadingPage visible={loadingPageVisible} screen={false} absolute={true} />
            <MacScrollbar className="w-full h-full p-5 lg:p-20 overflow-y-auto" skin={theme == "light" ? "light" : "dark"}>
                <div className={`grid auto-rows-[300px] gap-6 w-full ${ teams.length >= 2 ? "grid-cols-[repeat(auto-fill,minmax(320px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(600px,1fr))] " : "grid-cols-[repeat(auto-fill,minmax(320px,600px))] lg:grid-cols-[repeat(auto-fill,minmax(500px,600px))]"}`}>
                    { teams.map((e, index) => (
                        <div className="flex flex-col p-6 w-full h-full gap-3 bg-background transition-[background,border-color,box-shadow] duration-300 rounded-2xl border-2 shadow-md hover:shadow-xl shadow-foreground/15 hover:shadow-foreground/15" key={index}>
                            <div className="flex items-center gap-4">
                                <Avatar className="select-none w-12 h-12">
                                    { e.avatar ? (
                                        <>
                                            <AvatarImage src={e.avatar || "#"} alt="@shadcn" className="rounded-xl" />
                                            <AvatarFallback><Skeleton className="h-12 w-12 rounded-full" /></AvatarFallback>
                                        </>
                                    ) : ( 
                                        <div className='w-full h-full bg-foreground/80 flex items-center justify-center rounded-xl'>
                                            <span className='text-background text-xl'> { e.name?.substring(0, 2) } </span>
                                        </div>
                                    ) }
                                </Avatar>
                                <span className="text-2xl">{ e.name }</span>
                                <div className="flex-1" />
                                <EditTeamDialog updateTeam={updateTeams} teamModel={e} >
                                    <Button className="w-12 h-12 [&_svg]:size-7" variant="ghost"><Settings /></Button>
                                </EditTeamDialog>
                            </div>
                            <div className="flex-1 w-full flex flex-col gap-2 justify-center">
                                <div className="flex items-center gap-2 select-none">
                                    <SquareAsterisk size={28} />
                                    <span className="text-lg">{ t("invite_code") }</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input className="border-2 focus-visible:ring-0" onMouseDown={(e) => e.preventDefault()} width={4} readOnly value={!showInviteCodes[e.id || 0] ? "**************************************" : inviteCodes[e.id || 0]} />
                                    <Button className="w-[36px] h-[36px] border-2" variant={"outline"} onClick={() => handleShowInviteCode(e)}
                                        title="show invite code"
                                    >
                                        { showInviteCodes[e.id || 0] ? (
                                            <EyeOff />
                                        ) : (
                                            <Eye />
                                        ) }
                                    </Button>
                                    <Button className="w-[36px] h-[36px] border-2 transition-all duration-300" variant={"outline"} 
                                        title="copy invite code"
                                        disabled={ !showInviteCodes[e.id!] }
                                        onClick={() => {
                                            if (inviteCodes[e.id!] != "null") {
                                                const status = copy(inviteCodes[e.id!])
                                                if (status) toast.success(t("copied"), { position: "top-center" })
                                                else toast.error(t("fail_copy"), { position: "top-center" })
                                            } else {
                                                toast.error(t("unknow_error"), { position: "top-center" })
                                            }
                                        }}>
                                        <Clipboard />
                                    </Button>
                                    <Button className="w-[36px] h-[36px] border-2 transition-all duration-300" variant={"outline"} 
                                        title="refresh invite code"
                                        disabled={ !showInviteCodes[e.id!] }
                                        onClick={() => refreshInviteCode(e)}>
                                        <RefreshCcw />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2 mt-2 select-none">
                                    <Users size={28} />
                                    <span className="text-lg">{ t("members") }</span>
                                </div>
                                <div className="flex gap-4 mt-1">
                                    { e.members?.map((member, index) => (
                                        <Avatar className="select-none w-12 h-12" key={`user-${index}`}>
                                            { member.avatar ? (
                                                <>
                                                    <AvatarImage src={member.avatar || "#"} alt="@shadcn"
                                                        className={`rounded-xl shadow-[5px_5px_1px_var(--tw-shadow-colored)] ${ member.captain ? "shadow-yellow-400/50" : "shadow-blue-400/50" }`}
                                                        data-tooltip-id="challengeTooltip3"
                                                        data-tooltip-html={ `<div class='text-sm flex flex-col'><span>${ member.userName }${ member.bio ? " - " + member.bio : "" }</span><span>${ member.captain ? t("leader") : t("member") }</span></div>` }
                                                    />
                                                    <AvatarFallback><Skeleton className="h-12 w-12 rounded-full" /></AvatarFallback>
                                                </>
                                            ) : ( 
                                                <div className='w-full h-full bg-foreground/80 flex items-center justify-center rounded-xl'>
                                                    <span className='text-background text-xl'> { member.userName?.substring(0, 2) } </span>
                                                </div>
                                            ) }
                                        </Avatar>
                                    )) }
                                </div>
                            </div>
                        </div>
                    )) }
                    <div className="flex w-full gap-10 lg:gap-12 items-center justify-center select-none h-full border-2 border-cyan-500 border-dashed bg-background transition-[background,border-color,box-shadow] duration-300 rounded-2xl">
                        <CreateTeamDialog updateTeam={updateTeams}>
                            <div className="w-[100px] h-[100px] lg:w-32 lg:h-32 flex-col transition-[transform] duration-300 border-2 hover:scale-105 border-cyan-500 border-dashed rounded-2xl flex items-center justify-center p-3">
                                <Plus className="size-9 stroke-cyan-500" />
                                <span className="text-cyan-500 text-lg lg:text-xl">{ t("create_button") }</span>
                            </div>
                        </CreateTeamDialog>
                        <JoinTeamDialog updateTeam={updateTeams}>
                            <div className="w-[100px] h-[100px] lg:w-32 lg:h-32 border-2 flex-col transition-[transform] duration-300 hover:scale-105 border-cyan-500 border-dashed rounded-2xl flex items-center justify-center p-3">
                                <Asterisk className="size-9 stroke-cyan-500" />
                                <span className="text-cyan-500 text-lg lg:text-xl">{ t("join_button") }</span>
                            </div>
                        </JoinTeamDialog>
                    </div>
                </div>
            </MacScrollbar>
        </div>
    )
}