"use client";

import api, { TeamInfoModel } from "@/utils/GZApi";
import { Avatar } from "@radix-ui/react-avatar";
import { MacScrollbar } from "mac-scrollbar";
import { useEffect, useRef, useState } from "react";
import { AvatarFallback, AvatarImage } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";
import { Clipboard, Eye, EyeOff, Settings, SquareAsterisk, Users, Wrench } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Tooltip } from "react-tooltip";
import { toast } from "sonner";

import copy from 'copy-to-clipboard';

export function TeamsView() {

    const [teams, setTeams] = useState<TeamInfoModel[]>([])

    const [inviteCodes, setInviteCodes] = useState<Record<number, string>>({})
    const [showInviteCodes, setShowInviteCodes] = useState<Record<number, boolean>>({})

    useEffect(() => {
        api.team.teamGetTeamsInfo().then((res) => {
            
            const tmpInviteCodes: Record<string, string> = {}
            const tmpShowInvite: Record<string, boolean> = {}
            res.data.forEach((e) => {
                tmpInviteCodes[e.id || 0] = "null"
                tmpShowInvite[e.id || 0] = false
            })
            setInviteCodes(tmpInviteCodes)

            setTeams(res.data)
            console.log(res.data)
        })
    }, [])

    const handleShowInviteCode = (team: TeamInfoModel) => {
        if (team.id != undefined) {
            console.log(team)
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

    return (
        <div className="flex w-full h-full">
            <Tooltip id="challengeTooltip2" opacity={0.9} className='z-[200]'/>
            <MacScrollbar className="w-full h-full p-20 overflow-y-auto">
                <div className={`grid auto-rows-[300px] gap-6 w-full ${ teams.length > 2 ? "grid-cols-[repeat(auto-fill,minmax(600px,1fr))] " : "grid-cols-[repeat(auto-fill,minmax(500px,600px))]"}`}>
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
                                <Button className="w-12 h-12 [&_svg]:size-7" variant="ghost"><Settings /></Button>
                            </div>
                            <div className="flex-1 w-full flex flex-col gap-2 justify-center">
                                <div className="flex items-center gap-2 select-none">
                                    <SquareAsterisk size={28} />
                                    <span className="text-lg">Invite Code</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input className="border-2 focus-visible:ring-0" onMouseDown={(e) => e.preventDefault()} width={4} readOnly value={!showInviteCodes[e.id || 0] ? "**************************************" : inviteCodes[e.id || 0]} />
                                    <Button className="w-[36px] h-[36px] border-2" variant={"outline"} onClick={() => handleShowInviteCode(e)}>
                                        { showInviteCodes[e.id || 0] ? (
                                            <EyeOff />
                                        ) : (
                                            <Eye />
                                        ) }
                                    </Button>
                                    <Button className="w-[36px] h-[36px] border-2 transition-all duration-300" variant={"outline"} 
                                        disabled={ !showInviteCodes[e.id!] }
                                        onClick={() => {
                                            if (inviteCodes[e.id!] != "null") {
                                                const status = copy(inviteCodes[e.id!])
                                                if (status) toast.success("已复制", { position: "top-center" })
                                                else toast.error("复制到剪切板失败", { position: "top-center" })
                                            } else {
                                                toast.error("未知错误", { position: "top-center" })
                                            }
                                        }}>
                                        <Clipboard />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2 mt-2 select-none">
                                    <Users size={28} />
                                    <span className="text-lg">Members</span>
                                </div>
                                <div className="flex gap-4 mt-1">
                                    { e.members?.map((member, index) => (
                                        <Avatar className="select-none w-12 h-12" key={`user-${index}`}>
                                            { member.avatar ? (
                                                <>
                                                    <AvatarImage src={member.avatar || "#"} alt="@shadcn"
                                                        className={`rounded-xl shadow-[5px_5px_1px_var(--tw-shadow-colored)] ${ member.captain ? "shadow-yellow-400/50" : "shadow-blue-400/50" }`}
                                                        data-tooltip-id="challengeTooltip2"
                                                        data-tooltip-html={ `<div class='text-sm flex flex-col'><span>${ member.userName }${ member.bio ? " - " + member.bio : "" }</span><span>${ member.captain ? "Leader" : "Member" }</span></div>` }
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
                </div>
            </MacScrollbar>
        </div>
    )
}