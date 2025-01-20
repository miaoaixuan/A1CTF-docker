"use client";

import { Calendar, CircleArrowLeft, Home, Inbox, Search, Settings } from "lucide-react"

import Image from "next/image";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "./ui/button"
import { Label } from "@radix-ui/react-label"

import { ChallengeItem } from "./ChallengeItem";
import { Cache, SWRConfiguration } from 'swr'
import api, { ChallengeInfo, ChallengeDetailModel, GameDetailModel } from '@/utils/GZApi'

const OnceSWRConfig: SWRConfiguration = {
    refreshInterval: 0,
    revalidateOnFocus: false,
}

import { AxiosError } from 'axios';
import { Dispatch, SetStateAction, useEffect, useState } from "react";

export function AppSidebar({ gameid, setChallenge, setGameDetail } : { 
    gameid: string, 
    setChallenge: Dispatch<SetStateAction<ChallengeDetailModel>>,
    setGameDetail: Dispatch<SetStateAction<GameDetailModel>>
}) {

    const gmid = parseInt(gameid, 10)
    const [ challenges, setChallenges ] = useState<Record<string, ChallengeInfo[]>> ()
    const [ CurChallenge, setCurChallenge ] = useState<ChallengeDetailModel>({})

    useEffect(() => {
        api.game.gameChallengesWithTeamInfo(gmid).then((response) => {
            setChallenges(response.data.challenges)
            setGameDetail(response.data)
        }).catch((error: AxiosError) => {
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gmid])

    const handleChangeChallenge = (id: number) => {
        return (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            api.game.gameGetChallenge(gmid, id).then((response) => {
                console.log(response)
                setChallenge(response.data || {})
                setCurChallenge(response.data || {})
            }).catch((error: AxiosError) => {})
        };
    };
    
    return (
        <Sidebar className="backdrop-blur-sm hide-scrollbar select-none">
            <SidebarContent>
                <SidebarGroup>
                    <div className="flex justify-center w-full items-center pl-2 pr-2 pt-2">
                        <div className="justify-start flex gap-2 items-center mt-[-6px]">
                            <Image
                                className="dark:invert"
                                src="/images/A1natas.svg"
                                alt="A1natas"
                                width={40}
                                height={30}
                                priority
                            />
                            <Label className="font-bold text-xl">A1CTF</Label>
                        </div>
                        <div className="flex-1" />
                        <div className="justify-end">
                            <Button className="rounded-3xl p-4 pointer-events-auto w-[100px] mt-[5px] ml-[5px] mb-[10px]">
                                <CircleArrowLeft/>
                                <Label>Back</Label>
                            </Button>
                        </div>
                    </div>
                    <div className="pl-[7px] pr-[7px]">
                        {Object.entries(challenges ?? {}).map(([category, challengeList]) => (
                            <div key={category}>
                                {/* Sidebar Group Label */}
                                <SidebarGroupLabel className="text-[0.9em]">{category}</SidebarGroupLabel>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                    <div className="flex flex-col pl-2 pr-2 pb-2 gap-3">
                                        {/* Render all ChallengeItems for this category */}
                                        {challengeList.map((challenge, index) => (
                                        <ChallengeItem
                                            key={index}
                                            type={challenge.category?.toLocaleLowerCase() || "None"}
                                            name={challenge.title || "None"}
                                            solved={challenge.solved || 0}
                                            score={challenge.score || 0}
                                            rank={3}
                                            choiced={ CurChallenge.id == challenge.id }
                                            onClick={handleChangeChallenge(challenge.id || 0)}
                                        />
                                        ))}
                                    </div>
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </div>
                        ))}

                    </div>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
