"use client";

import ToggleTheme from "@/components/ToggleTheme"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { CategorySidebar } from "@/components/CategorySideBar";

import { toastNewNotice } from "@/utils/ToastUtil";

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
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { ResizableScrollablePanel } from "@/components/ResizableScrollablePanel"

import { Mdx } from "./MdxCompoents";
import { useEffect, useRef, useState } from "react";

import api, { ChallengeDetailModel, GameDetailModel, DetailedGameInfoModel, GameNotice, NoticeType, ChallengeInfo, ChallengeType } from '@/utils/GZApi'
import { Skeleton } from "./ui/skeleton";

import * as signalR from '@microsoft/signalr'

import dayjs from "dayjs";
import { LoadingPage } from "./LoadingPage";
import { Button } from "./ui/button";
import { AppWindow, CalendarClock, CircleCheckBig, CloudDownload, Files, Flag, FlaskConical, FoldHorizontal, Info, Link, LoaderPinwheel, PackageOpen, Presentation, Rocket, ScanHeart, Target, UnfoldHorizontal } from "lucide-react";
import { AxiosError } from "axios";

import Image from "next/image";


import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { DownloadBar } from "./DownloadBar";
import { RedirectNotice } from "./RedirectNotice";
import { NoticesView } from "./NoticesView";
import SafeComponent from "./SafeComponent";

import { MacScrollbar } from 'mac-scrollbar';
import { useTheme } from "next-themes";

import { Badge } from "@/components/ui/badge"
import { useGameSwitchContext } from "@/contexts/GameSwitchContext";
import GameSwitchHover from "./GameSwitchHover";
import { useGlobalVariableContext } from "@/contexts/GlobalVariableContext";
import ScoreBoardPage from "./ScoreBoardPage";
import { useLocale, useTranslations } from "next-intl";
import { randomInt } from "mathjs";

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

export function ChallengesView({ id }: { id: string }) {

    const t = useTranslations('challenge_view');

    const lng = useLocale();

    // 所有题目
    const [challenges, setChallenges] = useState<Record<string, ChallengeInfo[]>>({})

    // 当前选中的题目
    const [curChallenge, setCurChallenge] = useState<ChallengeDetailModel>({})
    const curChallengeDetail = useRef<ChallengeInfo>({})

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
    const [resizeTrigger, setResizeTrigger] = useState<number>(0)

    // Hints 折叠状态
    const [foldedItems, setFoldedItems] = useState<Record<number, boolean>>({});

    // 页面切换动画
    const [pageSwitch, setPageSwitch] = useState(false)

    // 题目是否解决
    const [challengeSolvedList, setChallengeSolvedList] = useState<Record<number, boolean>>({});

    // 附件下载进度
    const [attachDownloadProgress, setAttachDownloadProgress] = useState<number>(0)
    const [downloadName, setDownloadName] = useState<string>("")

    const [redirectURL, setRedirectURL] = useState<string>("")

    // 公告页面是否打开
    const [noticesOpened, setNoticeOpened] = useState<boolean>(false)
    const [notices, setNotices] = useState<GameNotice[]>([])

    const noticesRef = useRef<GameNotice[]>([])

    const [scoreBoardVisible, setScoreBoardVisible] = useState(false)

    const { theme } = useTheme()

    // 切换比赛动画
    const { isChangingGame, setIsChangingGame } = useGameSwitchContext();

    const { curProfile } = useGlobalVariableContext()

    // 更新当前选中题目信息, 根据 Websocket 接收到的信息被动调用
    const updateChallenge = () => {
        if (!prevChallenge.current.title) return
        api.game.gameGetChallenge(parseInt(id, 10), prevChallenge.current.id || 0).then((response) => {
            setCurChallenge(response.data || {})
        }).catch((error: AxiosError) => { })
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

        Object.keys(challenges).forEach((obj) => {
            const detail = challenges[obj].find((obj) => obj.id == curChallenge.id)
            if (detail) curChallengeDetail.current = detail
        })

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
        // api.account.accountProfile().then((res) => {
        //     setAvatarURL(res.data.avatar || "")
        //     setUserName(res.data.userName || "")
        // })

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

        // 获取比赛通知
        api.game.gameNotices(parseInt(id, 10)).then((res) => {
            const filtedNotices: GameNotice[] = []
            let curIndex = 0

            res.data.sort((a, b) => b.time - a.time)

            res.data.forEach((obj) => {
                if (obj.type == NoticeType.Normal) filtedNotices[curIndex++] = obj
            })

            noticesRef.current = filtedNotices
            setNotices(filtedNotices)
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
                // 防止并发
                setTimeout(updateChallenge, randomInt(200, 600))
            }

            if (message.type == NoticeType.Normal) {

                const newNotices: GameNotice[] = []

                newNotices[0] = message
                noticesRef.current.forEach((ele, index) => {
                    newNotices[index + 1] = ele
                })

                noticesRef.current = newNotices
                setNotices(newNotices)

                toastNewNotice({ title: message.values[0], time: message.time, openNotices: setNoticeOpened })
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

    useEffect(() => {
        setAvatarURL(curProfile.avatar || "#")
        setUserName(curProfile.userName || "")
    }, [curProfile])

    useEffect(() => {
        if (!loadingVisiblity) {
            setTimeout(() => {
                setIsChangingGame(false)
            }, 500)
        }
    }, [loadingVisiblity])

    const getAttachmentName = (url: string) => {
        const parts = url.split("/")
        return parts[parts.length - 1]
    }

    const handleDownload = () => {
        if (curChallenge.context?.url) {
            const url = curChallenge.context?.url;
    
            // 判断是否是本地附件
            if (curChallenge.context.fileSize) {
                const fileName = getAttachmentName(url);
                setDownloadName(fileName);
    
                // 开始下载
                const fetchFile = async () => {
                    try {
                        const response = await fetch(url);
                        const contentLength = response.headers.get("Content-Length") || "";
                        if (!response.ok) {
                            throw new Error("Network response was not ok");
                        }
    
                        const reader = response.body!.getReader();
                        const totalBytes = parseInt(contentLength, 10);
                        let receivedBytes = 0;
    
                        // 创建一个新的 Blob 来保存文件内容
                        const chunks: Uint8Array[] = [];
                        const pump = async () => {
                            const { done, value } = await reader.read();
                            if (done) {
                                const blob = new Blob(chunks);
                                const downloadUrl = URL.createObjectURL(blob);
                                
                                setTimeout(() => {
                                    setDownloadName("");  // 清除文件名
                                    setAttachDownloadProgress(0); // 重置进度条

                                    setTimeout(() => {
                                        const a = document.createElement("a");
                                        a.href = downloadUrl;
                                        a.download = dayjs().format("HHmmss") + "_" + fileName;
                                        a.click();
                                        URL.revokeObjectURL(downloadUrl);
                                    }, 300)
                                }, 1500)

                                return;
                            }
    
                            // 保存当前的下载进度
                            chunks.push(value);
                            receivedBytes += value.length;
                            const progress = Math.min(100, (receivedBytes / totalBytes) * 100);
                            if (progress < 100) {
                                setAttachDownloadProgress(progress);
                            } else {
                                setAttachDownloadProgress(100);
                                setTimeout(() => {
                                    setAttachDownloadProgress(101);
                                }, 500)
                            }
    
                            pump();  // 继续读取数据
                        };
    
                        pump();
                    } catch (error) {
                        console.error("Download failed:", error);
                        setDownloadName("");  // 清除文件名
                        setAttachDownloadProgress(0); // 重置进度条
                    }
                };
    
                setTimeout(() => {
                    fetchFile();
                }, 500)
            } else {
                // 如果是直接通过 URL 打开文件
                setRedirectURL(url)
            }
        }
    };

    const testFunction = () => {
        setScoreBoardVisible(!scoreBoardVisible)
    }
    

    return (
        <>
            <GameSwitchHover animation={false} />
            <LoadingPage visible={loadingVisiblity} />
            {/* 下载动画 */}
            <DownloadBar key={"download-panel"} progress={attachDownloadProgress} downloadName={downloadName}></DownloadBar>
            <ScoreBoardPage gmid={parseInt(id, 10)} visible={scoreBoardVisible} setVisible={setScoreBoardVisible}/>
            {/* 重定向警告页 */}
            <RedirectNotice redirectURL={redirectURL} setRedirectURL={setRedirectURL} />
            {/* 公告页 */}
            <NoticesView opened={noticesOpened} setOpened={setNoticeOpened} notices={notices} />
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
                <main className="flex flex-col top-0 left-0 h-screen w-screen overflow-hidden backdrop-blur-sm relative">
                    <div className="h-[70px] flex items-center pl-4 pr-4 z-20 w-full bg-transparent border-b-[1px] transition-[border-color] duration-300">
                        <div className="flex items-center min-w-0 h-[32px]">
                            <SidebarTrigger className="transition-colors duration-300" />
                            {/* <span className="font-bold ml-3">{ challenge.category } - { challenge.title }</span> */}
                            <span className="font-bold ml-1 text-ellipsis overflow-hidden text-nowrap transition-colors duration-300">{gameInfo.title}</span>
                        </div>
                        <div className="flex-1" />
                        <div id="rightArea" className="justify-end flex h-ful gap-[6px] lg:gap-[10px] items-center pointer-events-auto">
                            <div className="bg-background rounded-2xl">
                                <div className="bg-black bg-opacity-10 pl-4 pr-4 pt-1 pb-1 rounded-2xl overflow-hidden select-none dark:bg-[#2A2A2A] hidden lg:flex relative transition-colors duration-300">
                                    <div className="absolute top-0 left-0 bg-black dark:bg-white transition-colors duration-300"
                                        style={{ width: `${remainTimePercent}%`, height: '100%' }}
                                    />
                                    <span className="text-white mix-blend-difference z-20 font-mono transition-all duration-500">{remainTime}</span>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="lg:hidden" size="icon">
                                        <AppWindow />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="mr-4 mt-2">
                                    <div className="w-full h-full flex flex-col gap-1">
                                        <DropdownMenuItem>
                                            <div className="bg-black bg-opacity-10 pl-4 pr-4 pt-1 pb-1 rounded-2xl overflow-hidden select-none dark:bg-[#2A2A2A] relative">
                                                <div
                                                    className="absolute top-0 left-0 bg-black dark:bg-white"
                                                    style={{ width: `${remainTimePercent}%`, height: '100%' }}
                                                />
                                                <span className="text-white mix-blend-difference z-20 font-mono">{remainTime}</span>
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setNoticeOpened(true)} disabled={notices.length == 0}>
                                            <PackageOpen />
                                            <span>{ t("open_notices") }</span>
                                            { notices.length ? <Badge variant="destructive" className="p-0 pl-1 pr-1">{ notices.length }</Badge> : <></> }
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setScoreBoardVisible(true)}>
                                            <Presentation />
                                            <span>{ t("rank") }</span>
                                        </DropdownMenuItem>
                                    </div>
                                    
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button variant="outline" className="select-none hidden lg:flex" onClick={() => setNoticeOpened(true)} disabled={notices.length == 0}>
                                <div className="flex items-center gap-1">
                                    <PackageOpen />
                                    <span>{ t("open_notices") }</span>
                                    { notices.length ? <Badge variant="destructive" className="p-0 pl-1 pr-1">{ notices.length }</Badge> : <></> }
                                </div>
                            </Button>
                            <Button variant="outline" className="select-none hidden lg:flex" onClick={() => setScoreBoardVisible(true)}>
                                <div className="flex items-center gap-1">
                                    <Presentation />
                                    <span>{ t("rank") }</span>
                                </div>
                            </Button>
                            {/* <Button size="icon" variant="outline" onClick={testFunction}><FlaskConical /></Button> */}
                            <ToggleTheme />
                            <Avatar className="select-none">
                                <AvatarImage src={avatarURL} alt="@shadcn" />
                                <AvatarFallback><Skeleton className="h-12 w-12 rounded-full" /></AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                    <ResizablePanelGroup direction="vertical" className="relative">
                        <AnimatePresence>
                            {pageSwitch ? (
                                <motion.div className="absolute top-0 left-0 w-full h-full bg-background z-20 flex justify-center items-center"
                                    exit={{
                                        opacity: 0
                                    }}
                                >
                                    {/* <SkeletonCard /> */}
                                    <div className="flex">
                                        <LoaderPinwheel className="animate-spin" />
                                        <span className="font-bold ml-3">Loading...</span>
                                    </div>
                                </motion.div>
                            ) : (null)}
                        </AnimatePresence>
                        <ResizableScrollablePanel defaultSize={60} minSize={20} className="relative" onResize={(size, prevSize) => {
                            setResizeTrigger(size)
                        }}>
                            {!curChallenge.title ? (
                                <div className="absolute top-0 left-0 w-full h-full flex p-7 flex-col">
                                    { gameInfo.content ? (
                                        <Mdx source={gameInfo.content || ""}></Mdx>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center select-none">
                                            <span className="font-bold text-lg">{ t("choose_something") }</span>
                                        </div>
                                    ) }
                                </div>
                            ) : <></>}
                            <div className="absolute bottom-2 right-2 flex flex-col gap-2 p-2 opacity-100 ease-in-out">
                                {
                                    curChallenge.hints?.map((value, index) => {
                                        return (
                                            <div className="flex" key={index}>
                                                <div className="flex-1" />
                                                <div className={`inline-flex bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 pt-2 pb-2 pl-3 pr-[25px] rounded-xl shadow-lg shadow-yellow-500/30 min-w-0 transition-transform duration-300 ease-in-out text-black text-md gap-2 ${!foldedItems[index] ? "translate-x-[calc(30px)]" : "translate-x-[calc(100%-80px)]"}`}>
                                                    {
                                                        !foldedItems[index] ? (
                                                            <FoldHorizontal className="hover:text-white flex-shrink-0 transition-colors duration-200 ease-in-out" onClick={() => {
                                                                toggleFolded(index)
                                                            }} />
                                                        ) : (
                                                            <UnfoldHorizontal className="hover:text-white flex-shrink-0 transition-colors duration-200 ease-in-out" onClick={() => {
                                                                toggleFolded(index)
                                                            }} />
                                                        )
                                                    }
                                                    <div className="inline-flex gap-1">
                                                        <span className="font-bold w-[50px] flex-shrink-0 overflow-hidden font-mono select-none">Hint{index + 1}</span>
                                                        <span className="font-bold">{value}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                            <div className="flex h-full">
                                <SafeComponent>
                                    <MacScrollbar
                                        className="pl-5 pr-5 lg:pl-20 lg:pr-20 pt-5 pb-5 w-full flex flex-col"
                                        skin={theme === "dark" ? "dark" : "light"}
                                    >
                                        {curChallenge.title && (
                                            <div className="w-full border-b-[1px] h-[50px] p-2 transition-[border-color] duration-300 flex items-center gap-1">
                                                <div className="flex items-center gap-2 transition-colors duration-300 overflow-hidden">
                                                    <Info size={21} className="flex-none" />
                                                    <span className="text-lg overflow-hidden text-ellipsis text-nowrap">{curChallenge.title}</span>
                                                </div>
                                                <div className="flex-1" />
                                                <div className="flex justify-end gap-4 transition-colors duration-300">
                                                    { challengeSolvedList[curChallenge.id || 0] ? (
                                                        <div className="flex items-center gap-2 text-purple-600">
                                                            <ScanHeart className="flex-none" />
                                                            <span className="text-sm lg:text-md font-bold">{curChallengeDetail.current.score} pts</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-amber-600">
                                                            <Flag className="flex-none" />
                                                            <span className="text-sm lg:text-md font-bold">{curChallengeDetail.current.score} pts</span>
                                                        </div>
                                                    ) }
                                                    <div className="flex items-center gap-2 text-green-600">
                                                        <CircleCheckBig />
                                                        <span className="text-sm lg:text-md font-bold">{curChallengeDetail.current.solved} solves</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {curChallenge.type == ChallengeType.DynamicContainer && (
                                            <div className="w-full border-b-[1px] h-[50px] p-2 transition-[border-color] duration-300 flex items-center">
                                                <div className="flex items-center gap-2 transition-colors duration-300 select-none">
                                                    <Target size={21} />
                                                    <span className="text-md">{ t("live_container") }</span>
                                                </div>
                                                <div className="flex-1" />
                                                <div className="flex justify-end gap-4">
                                                    <Button asChild variant="ghost" className="pl-4 pr-4 pt-0 pb-0 text-md text-green-600 font-bold [&_svg]:size-6 transition-colors duration-300 select-none">
                                                        <div className="flex gap-[4px]">
                                                            <Rocket />
                                                            <span className="">{ t("launch") }</span>
                                                        </div>
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        {curChallenge.context?.url ? (
                                            <div className="w-full border-b-[1px] h-[50px] p-2 flex items-center gap-4 transition-[border-color] duration-300">
                                                <div className="flex items-center gap-2 transition-colors duration-300">
                                                    <Files size={21} />
                                                    <span className="text-md">{ t("attachments") }</span>
                                                </div>
                                                <div className="flex justify-end gap-4">
                                                    <Button variant="ghost" onClick={() => handleDownload()} className="pl-4 pr-4 pt-0 pb-0 text-md [&_svg]:size-5 transition-all duration-300" disabled={downloadName != ""}>
                                                        <div className="flex gap-[4px] items-center">
                                                            {curChallenge.context.fileSize ? (
                                                                // 有文件大小的是本地附件
                                                                <>
                                                                    <CloudDownload />
                                                                    <span className=""> {getAttachmentName(curChallenge.context.url)} </span>
                                                                </>
                                                            ) : (
                                                                // 远程附件
                                                                <>
                                                                    <Link />
                                                                    <span className=""> { t("external_links") } </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (<></>)}
                                        { curChallenge.title && (
                                            <div className="w-full p-8 flex-1">
                                            { curChallenge.content ? (
                                                <Mdx source={curChallenge.content} />
                                            ) : (
                                                <div className="w-full h-full flex justify-center items-center select-none gap-4">
                                                    <Image
                                                        src="/images/peter.png"
                                                        alt="Peter"
                                                        width={200}
                                                        height={40}
                                                        priority
                                                    />
                                                    <span className="text-3xl font-bold">{ t("oops_empty") }</span>
                                                </div>
                                            ) }
                                            
                                        </div>
                                        ) }
                                    </MacScrollbar>
                                </SafeComponent>
                            </div>
                        </ResizableScrollablePanel>
                        {curChallenge.title ? (
                            <>
                                <ResizableHandle withHandle={true} className="transition-colors duration-300" />
                                <ResizableScrollablePanel defaultSize={40} minSize={10}>
                                    <div className="flex flex-col p-0 h-full resize-y">
                                        {userName ? (
                                            <GameTerminal challenge={curChallenge} gameid={id} pSize={resizeTrigger!} userName={userName} setChallengeSolved={setChallengeSolved} />
                                        ) : (<></>)}
                                    </div>
                                </ResizableScrollablePanel>
                            </>
                        ) : (<></>)}
                    </ResizablePanelGroup>
                </main>
            </SidebarProvider>
        </>
    )
}