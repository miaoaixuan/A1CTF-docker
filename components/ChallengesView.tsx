"use client";

import { Label } from "@radix-ui/react-label";
import ToggleTheme from "@/components/ToggleTheme"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { CategorySidebar } from "@/components/CategorySideBar";

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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { ResizableScrollablePanel } from "@/components/ResizableScrollablePanel"

import { Mdx } from "./MdxCompoents";
import { useEffect, useRef, useState } from "react";

import api, { ChallengeDetailModel, GameDetailModel, DetailedGameInfoModel, GameNotice, NoticeType, ChallengeInfo } from '@/utils/GZApi'
import { Skeleton } from "./ui/skeleton";

import * as signalR from '@microsoft/signalr'

import dayjs from "dayjs";
import { LoadingPage } from "./LoadingPage";
import { Button } from "./ui/button";
import { CalendarClock, FoldHorizontal, LoaderPinwheel, UnfoldHorizontal } from "lucide-react";
import { AxiosError } from "axios";


import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";

const GameTerminal = dynamic(
    () => import("@/components/GameTerminal2").then((mod) => mod.GameTerminal),
    {
        ssr: false, // 禁用服务器端渲染
        loading: () => (
            // <div className="w-full h-full">
            //     <SkeletonCard />
            // </div>
            <></>
        ), // 占位符
    }
);

// 格式化时间
const formatDuration = (duration: number) => {
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

    // 所有题目
    const [ challenges, setChallenges ] = useState<Record<string, ChallengeInfo[]>> ({})

    // 当前选中的题目
    const [curChallenge, setCurChallenge] = useState<ChallengeDetailModel>({})

    // 比赛信息
    const [gameDetail, setGameDeatail] = useState<GameDetailModel>({
        teamToken: "",
        writeupRequired: false,
        writeupDeadline: 0,
        challenges: undefined,
        challengeCount: undefined,
        rank: null,
    })

    // 前一个题目
    const prevChallenge = useRef<ChallengeDetailModel>({});

    // 头像 URL
    const [avatarURL, setAvatarURL] = useState("#")

    // 剩余时间 & 剩余时间百分比
    const [remainTime, setRemainTime] = useState("")
    const [remainTimePercent, setRemainTimePercent] = useState(100)

    // 用户名
    const [userName, setUserName] = useState("")

    // 比赛详细信息
    const [gameInfo, setGameInfo] = useState<DetailedGameInfoModel>({})

    // 加载动画
    const [loadingVisiblity, setLoadingVisibility] = useState(true)

    // 侧栏打开关闭的时候更新 Terminal 宽度用的钩子
    const [ resizeTrigger, setResizeTrigger ] = useState<number>(0)

    // Hints 折叠状态
    const [foldedItems, setFoldedItems] = useState<Record<number, boolean>>({});

    // 页面切换动画
    const [ pageSwitch, setPageSwitch ] = useState(false)

    // 题目是否解决
    const [challengeSolvedList, setChallengeSolvedList] = useState<Record<number, boolean>>({});

    // 更新当前选中题目信息, 根据 Websocket 接收到的信息被动调用
    const updateChallenge = () => {
        if (!prevChallenge.current.title) return
        api.game.gameGetChallenge(parseInt(id, 10), prevChallenge.current.id || 0).then((response) => {
            setCurChallenge(response.data || {})
        }).catch((error: AxiosError) => {})
    }

    const setChallengeSolved = (id: number) => {
        setChallengeSolvedList((prev) => ({
            ...prev,
            [id]: true
        }))
    }

    // 开关某一 Hint 项的折叠状态
    const toggleFolded = (itemId: number) => {
        setFoldedItems((prevState) => ({
          ...prevState,
          [itemId]: !prevState[itemId], // 切换该项的折叠状态
        }));
    }

    useEffect(() => {
        // 切换题目重置折叠状态
        if (JSON.stringify(curChallenge) == JSON.stringify(prevChallenge.current)) return
        prevChallenge.current = curChallenge

        const noneDict: Record<number, boolean> = {}
        for (let i = 0; i < (curChallenge.hints?.length || 0); i++) {
            noneDict[i] = true
        }
        setFoldedItems(noneDict)

        const timeout = setTimeout(() => setPageSwitch(false), 300)

        return () => {
            clearTimeout(timeout)
        }
    }, [curChallenge]);

    useEffect(() => {
        // 获取账户信息
        api.account.accountProfile().then((res) => {
            setAvatarURL(res.data.avatar || "")
            setUserName(res.data.userName || "")
        })

        // 更新时间迭代器
        let timeIter: any = null;

        // 获取比赛信息以及剩余时间
        api.game.gameGame(parseInt(id, 10)).then((res) => {
            setGameInfo(res.data)

            const totalTime = Math.floor(dayjs(res.data.end).diff(dayjs(res.data.start)) / 1000)

            timeIter = setInterval(() => {
                const curLeft = Math.floor(dayjs(res.data.end).diff(dayjs()) / 1000)

                setRemainTime(formatDuration(curLeft))
                setRemainTimePercent(Math.floor((curLeft / totalTime) * 100))
            }, 500)

            setTimeout(() => setLoadingVisibility(false), 500)
        })

        // Websocket
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

        // 测试代码
        // setTimeout(() => {
        //     setChallengeSolvedList((prev) => ({
        //         ...prev,
        //         [105]: true
        //     }))
        // }, 8000)

        return () => {
            if (timeIter) clearInterval(timeIter)

            connection.stop().catch((err) => {
                console.error(err)
            })
        }
    }, [id])

    return (
        <>
            <LoadingPage visible={loadingVisiblity} />
            {/* <ScoreBoardPage gmid={parseInt(id, 10)}/> */}
            <SidebarProvider>
                <div className="z-20">
                    <CategorySidebar 
                        gameid={id} 
                        curChallenge={curChallenge} 
                        setCurChallenge={setCurChallenge} 
                        setGameDetail={setGameDeatail} 
                        resizeTrigger={setResizeTrigger} 
                        setPageSwitching={setPageSwitch} 
                        lng={lng} 
                        challenges={challenges || {}}
                        setChallenges={setChallenges}
                        challengeSolvedList={challengeSolvedList}
                        setChallengeSolvedList={setChallengeSolvedList}
                    />
                </div>
                <main className="flex flex-col top-0 left-0 h-screen w-screen overflow-hidden backdrop-blur-sm">
                    <div className="h-[60px] flex items-center pl-4 pr-4 z-20 pt-2 w-full">
                        <div className="flex items-center min-w-0 h-[32px]">
                            <SidebarTrigger/>
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
                    <ResizablePanelGroup direction="vertical" className="relative">
                        <AnimatePresence>
                            { pageSwitch ? ( 
                                <motion.div className="absolute top-0 left-0 w-full h-full bg-background z-20 flex justify-center items-center"
                                    exit={{
                                        opacity: 0
                                    }}
                                >
                                    {/* <SkeletonCard /> */}
                                    <div className="flex">
                                        <LoaderPinwheel className="animate-spin" />
                                        <Label className="font-bold ml-3">Loading...</Label>
                                    </div>
                                </motion.div>
                            ) : (null) }
                        </AnimatePresence>
                        <ResizableScrollablePanel defaultSize={60} minSize={20} className="overflow-auto relative" onResize={(size, prevSize) => {
                            setResizeTrigger(size)
                        }}>
                            { !curChallenge.title ? (
                                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                                    <div className="">
                                        <Label className="text-xl">Choose something?</Label>
                                    </div>
                                </div>
                            ) : <></> }
                            <div className="absolute bottom-2 right-2 flex flex-col gap-2 p-2 transition-all duration-500 opacity-100 ease-in-out">
                                { 
                                    curChallenge.hints?.map((value, index) => {
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
                                <Mdx source={curChallenge.content || ""} />
                            </div>
                        </ResizableScrollablePanel>
                        { curChallenge.title ? (
                            <>
                                <ResizableHandle withHandle={true} className="duration-300 transition-all"/>
                                <ResizableScrollablePanel defaultSize={40} minSize={10}>
                                    <div className="flex flex-col p-0 h-full resize-y">
                                        { userName ? (
                                            <GameTerminal challenge={curChallenge} gameid={id} pSize={resizeTrigger!} userName={userName} setChallengeSolved={setChallengeSolved} />
                                        ) : (<></>) }
                                    </div>
                                </ResizableScrollablePanel>
                            </>
                        ) : (<></>) }
                    </ResizablePanelGroup>
                </main>
            </SidebarProvider>
        </>
    )
}