"use client";

import { Label } from "@radix-ui/react-label";
import ToggleTheme from "@/components/ToggleTheme"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/CategorySideBar";
import { GameTerminal } from "@/components/GameTerminal"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"

import {
    ResizableHandle,
    ResizablePanelGroup,
} from "@/components/ui/resizable"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { ResizableScrollablePanel } from "@/components/ResizableScrollablePanel"

import { Mdx } from "./MdxCompoents";
import { useEffect, useState } from "react";

import api, { ChallengeDetailModel, GameDetailModel, DetailedGameInfoModel } from '@/utils/GZApi'
import { Skeleton } from "./ui/skeleton";

import dayjs from "dayjs";
import { LoadingPage } from "./LoadingPage";
import { Button } from "./ui/button";
import { CalendarClock, Clock } from "lucide-react";


function formatDuration(duration: number) {

    // 以防万一
    duration = Math.floor(duration)

    const days = Math.floor(duration / (24 * 3600));
    const hours = Math.floor((duration % (24 * 3600)) / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

export function ChallengesView({ lng, id }: { lng: string, id: string }) {

    const [challenge, setChallenge] = useState<ChallengeDetailModel>({})
    const [avatarURL, setAvatarURL] = useState("#")
    const [gameDetail, setGameDeatail] = useState<GameDetailModel>({
        teamToken: "",
        writeupRequired: false,
        writeupDeadline: 0,
        challenges: undefined,
        challengeCount: undefined,
        rank: null,
    })
    const [remainTime, setRemainTime] = useState("")
    const [remainTimePercent, setRemainTimePercent] = useState(100)

    const [gameInfo, setGameInfo] = useState<DetailedGameInfoModel>({})
    const [loadingVisiblity, setLoadingVisibility] = useState(true)


    useEffect(() => {
        api.account.accountProfile().then((res) => {
            setAvatarURL(`https://ctf.a1natas.com${res.data.avatar}`)
        })

        let iter: any = null;

        api.game.gameGame(parseInt(id, 10)).then((res) => {
            setGameInfo(res.data)

            const totalTime = dayjs(res.data.end).diff(dayjs(res.data.start)) / 1000

            iter = setInterval(() => {
                const curLeft = dayjs(res.data.end).diff(dayjs()) / 1000
                setRemainTime(formatDuration(curLeft))
                setRemainTimePercent(Math.floor(((totalTime - curLeft) / totalTime) * 100))
            }, 500)
            setTimeout(() => setLoadingVisibility(false), 500)
        })

        return () => {
            if (iter) clearInterval(iter)
        }
    }, [id])

    return (
        <>
            <LoadingPage visible={loadingVisiblity} />
            <SidebarProvider>
                <div className="z-20">
                    <AppSidebar gameid={id} setChallenge={setChallenge} setGameDetail={setGameDeatail} />
                </div>
                <main className="flex flex-col top-0 left-0 h-screen w-screen overflow-hidden backdrop-blur-sm">
                    <div className="h-[60px] flex items-center pl-4 pr-4 z-20 pt-2 w-full">
                        <div className="flex items-center min-w-0 h-[32px]">
                            <SidebarTrigger />
                            {/* <Label className="font-bold ml-3">{ challenge.category } - { challenge.title }</Label> */}
                            <Label className="font-bold ml-1 text-ellipsis overflow-hidden text-nowrap">{gameInfo.title}</Label>
                        </div>
                        <div className="flex-1" />
                        <div id="rightArea" className="justify-end flex h-ful gap-[6px] lg:gap-[10px] items-center pointer-events-auto">
                            <div className="bg-background rounded-2xl">
                                <div className="bg-black bg-opacity-10 pl-4 pr-4 pt-1 pb-1 rounded-2xl overflow-hidden select-none dark:invert hidden lg:flex relative">
                                    <div
                                        className="absolute top-0 left-0 bg-black"
                                        style={{ width: `${ remainTimePercent }%`, height: '100%' }}
                                    />
                                    <Label className="text-white mix-blend-difference z-20">Left time: { remainTime }</Label>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="lg:hidden" size="icon">
                                        <CalendarClock />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-54 mr-4 mt-2">
                                    <div className="w-full h-full">
                                        <div className="bg-black bg-opacity-10 pl-4 pr-4 pt-1 pb-1 rounded-2xl overflow-hidden select-none dark:invert relative">
                                            <div
                                                className="absolute top-0 left-0 bg-black"
                                                style={{ width: `${ remainTimePercent }%`, height: '100%' }}
                                            />
                                            <Label className="text-white mix-blend-difference z-20">Left time: { remainTime }</Label>
                                        </div>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <ToggleTheme lng={lng} />
                            <Avatar>
                                <AvatarImage src={avatarURL} alt="@shadcn" />
                                <AvatarFallback><Skeleton className="h-12 w-12 rounded-full" /></AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                    <ResizablePanelGroup direction="vertical">
                        <ResizableScrollablePanel defaultSize={60} minSize={20} className="overflow-auto">
                            <div className="pl-7 pr-5 pb-5 flex-1">
                                <Mdx source={challenge.content || ""} />
                            </div>
                        </ResizableScrollablePanel>
                        <ResizableHandle withHandle={true} className="duration-300 transition-all"/>
                        <ResizableScrollablePanel defaultSize={40} minSize={10}>
                            <div className="flex flex-col p-0 h-full resize-y">
                                <GameTerminal challenge={challenge} gameid={id} />
                            </div>
                        </ResizableScrollablePanel>
                    </ResizablePanelGroup>
                </main>
            </SidebarProvider>
        </>
    )
}