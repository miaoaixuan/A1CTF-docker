"use client";

import { Label } from "@radix-ui/react-label";
import ToggleTheme from "@/components/ToggleTheme"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { CategorySidebar } from "@/components/CategorySideBar";
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
import { useEffect, useRef, useState } from "react";

import api, { ChallengeDetailModel, GameDetailModel, DetailedGameInfoModel, GameNotice, NoticeType } from '@/utils/GZApi'
import { Skeleton } from "./ui/skeleton";

import * as signalR from '@microsoft/signalr'

import dayjs from "dayjs";
import { LoadingPage } from "./LoadingPage";
import { Button } from "./ui/button";
import { CalendarClock, Clock, FoldHorizontal, UnfoldHorizontal } from "lucide-react";
import { AxiosError } from "axios";
import ScoreBoardPage from "./ScoreBoardPage";


function formatDuration(duration: number) {

    // 以防万一
    duration = Math.floor(duration)

    const days = Math.floor(duration / (24 * 3600));
    const hours = Math.floor((duration % (24 * 3600)) / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    if (days > 0) {
        return `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
    } else if (hours > 0) {
        return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    } else if (minutes > 0) {
        return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    } else {
        return `${String(seconds).padStart(2, '0')}s`;
    }
}

export function ChallengesView({ lng, id }: { lng: string, id: string }) {

    const [challenge, setChallenge] = useState<ChallengeDetailModel>({})
    const prevChallenge = useRef<ChallengeDetailModel>({});

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

    const [foldedItems, setFoldedItems] = useState<Record<number, boolean>>({});

    const updateChallenge = () => {
        if (!prevChallenge.current.title) return
        api.game.gameGetChallenge(parseInt(id, 10), prevChallenge.current.id || 0).then((response) => {
            setChallenge(response.data || {})
        }).catch((error: AxiosError) => {})
    }

    const toggleFolded = (itemId: number) => {
        setFoldedItems((prevState) => ({
          ...prevState,
          [itemId]: !prevState[itemId], // 切换该项的折叠状态
        }));
    }

    useEffect(() => {
        // 切换题目重置折叠状态
        if (JSON.stringify(challenge) == JSON.stringify(prevChallenge.current)) return
        prevChallenge.current = challenge

        const noneDict: Record<number, boolean> = {}
        for (let i = 0; i < (challenge.hints?.length || 0); i++) {
            noneDict[i] = true
        }
        setFoldedItems(noneDict)
    }, [challenge]);

    useEffect(() => {
        api.account.accountProfile().then((res) => {
            setAvatarURL(res.data.avatar || "")
        })

        let iter: any = null;

        api.game.gameGame(parseInt(id, 10)).then((res) => {
            setGameInfo(res.data)

            const totalTime = Math.floor(dayjs(res.data.end).diff(dayjs(res.data.start)) / 1000)

            iter = setInterval(() => {
                const curLeft = Math.floor(dayjs(res.data.end).diff(dayjs()) / 1000)

                setRemainTime(formatDuration(curLeft))
                setRemainTimePercent(Math.floor((curLeft / totalTime) * 100))
            }, 500)

            setTimeout(() => setLoadingVisibility(false), 500)
        })

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`/hub/user?game=${id}`)
            .withHubProtocol(new signalR.JsonHubProtocol())
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.None)
            .build()

        connection.serverTimeoutInMilliseconds = 60 * 1000 * 60 * 2

        connection.on('ReceivedGameNotice', (message: GameNotice) => {
            console.log(message)

            if (message.type == NoticeType.NewHint && message.values[0] == prevChallenge.current.title) {
                updateChallenge()
            }
        })

        connection.start().catch((error) => {
            console.error(error)
        })

        return () => {
            if (iter) clearInterval(iter)

            connection.stop().catch((err) => {
                console.error(err)
            })
        }
    }, [id])

    return (
        <>
            <LoadingPage visible={loadingVisiblity} />
            <ScoreBoardPage gmid={parseInt(id, 10)}/>
            <SidebarProvider>
                <div className="z-20">
                    <CategorySidebar gameid={id} setChallenge={setChallenge} setGameDetail={setGameDeatail} lng={lng} />
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
                                <div className="bg-black bg-opacity-10 pl-4 pr-4 pt-1 pb-1 rounded-2xl overflow-hidden select-none dark:bg-[#2A2A2A] hidden lg:flex relative">
                                    <div className="absolute top-0 left-0 bg-black dark:bg-white"
                                        style={{ width: `${ remainTimePercent }%`, height: '100%' }}
                                    />
                                    <Label className="text-white mix-blend-difference z-20 font-mono transition-all duration-500">RT: { remainTime }</Label>
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
                                        <div className="bg-black bg-opacity-10 pl-4 pr-4 pt-1 pb-1 rounded-2xl overflow-hidden select-none dark:bg-[#2A2A2A] relative">
                                            <div
                                                className="absolute top-0 left-0 bg-black dark:bg-white"
                                                style={{ width: `${ remainTimePercent }%`, height: '100%' }}
                                            />
                                            <Label className="text-white mix-blend-difference z-20 font-mono">RT: { remainTime }</Label>
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
                        <ResizableScrollablePanel defaultSize={60} minSize={20} className="overflow-auto relative">
                            { !challenge.title ? (
                                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                                    <div className="">
                                        <Label className="text-xl">Choose something?</Label>
                                    </div>
                                </div>
                            ) : <></> }
                            <div className="absolute bottom-2 right-2 flex flex-col gap-2 p-2 transition-all duration-500 opacity-100 ease-in-out">
                                { 
                                    challenge.hints?.map((value, index) => {
                                        return (
                                            <div className="flex" key={index}>
                                                <div className="flex-1" />
                                                <div className={`inline-flex bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 pt-2 pb-2 pl-3 pr-[25px] rounded-xl shadow-lg shadow-yellow-500/30 min-w-0 transition-all duration-300 ease-in-out text-black text-md gap-2 ${ !foldedItems[index] ? "translate-x-[calc(30px)]" : "translate-x-[calc(100%-80px)]" }`}>
                                                    {
                                                        !foldedItems[index] ? (
                                                            <FoldHorizontal className="hover:text-white flex-shrink-0 transition-all duration-200 ease-in-out" onClick={() => {
                                                                toggleFolded(index)
                                                            }} />
                                                        ): (
                                                            <UnfoldHorizontal className="hover:text-white flex-shrink-0 transition-all duration-200 ease-in-out" onClick={() => {
                                                                toggleFolded(index)
                                                            }} />
                                                        )
                                                    }
                                                    <div className="inline-flex gap-1">
                                                        <Label className="font-bold w-[50px] flex-shrink-0 overflow-hidden font-mono select-none">Hint{index + 1}</Label>
                                                        <Label className="font-bold">{value}</Label>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }) 
                                }
                            </div>
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