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

// import { api, ChallengeDetailModel, GameDetailModel, DetailedGameInfoModel, GameNotice, NoticeCategory, ChallengeInfo, ChallengeType, ErrorMessage, TeamInfoModel, ParticipationStatus, ContainerStatus, ContainerInfoModel } from '@/utils/GZApi'

import { api } from "@/utils/ApiHelper"
import { AttachmentType, ErrorMessage, GameNotice, NoticeCategory, ParticipationStatus, UserDetailGameChallenge, UserFullGameInfo, UserSimpleGameChallenge } from "@/utils/A1API"

import { Skeleton } from "./ui/skeleton";

import * as signalR from '@microsoft/signalr'

import dayjs from "dayjs";
import { LoadingPage } from "./LoadingPage";
import { Button } from "./ui/button";
import { AlarmClock, AppWindow, Ban, CalendarClock, CircleCheckBig, ClockArrowUp, CloudDownload, Container, Copy, Files, Flag, FlaskConical, FoldHorizontal, Hourglass, Info, Link, ListCheck, LoaderCircle, LoaderPinwheel, NotebookPen, PackageOpen, Pickaxe, Presentation, Rocket, ScanHeart, ShieldX, Target, TriangleAlert, UnfoldHorizontal, Users, X } from "lucide-react";
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

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner";
import { TransitionLink } from "./TransitionLink";
import copy from "copy-to-clipboard";
import { SolvedAnimation } from "./SolvedAnimation";
import { useCookies } from "react-cookie";
import { CreateTeamDialog } from "./dialogs/CreateTeamDialog";
import { JoinTeamDialog } from "./dialogs/JoinTeamDialog";

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

export function ChallengesView({ id, lng }: { id: string, lng: string }) {

    const t = useTranslations('challenge_view');
    const t2 = useTranslations("notices_view")

    // 所有题目
    const [challenges, setChallenges] = useState<Record<string, UserSimpleGameChallenge[]>>({})

    // 当前选中的题目
    const [curChallenge, setCurChallenge] = useState<UserDetailGameChallenge>()
    const curChallengeDetail = useRef<UserDetailGameChallenge>()

    // 比赛信息
    // const [gameDetail, setGameDeatail] = useState<GameDetailModel>({
    //     teamToken: "",
    //     writeupRequired: false,
    //     writeupDeadline: 0,
    //     challenges: undefined,
    //     challengeCount: undefined,
    //     rank: null,
    // })

    // 前一个题目
    const prevChallenge = useRef<UserDetailGameChallenge>();

    // 头像 URL
    const [avatarURL, setAvatarURL] = useState("#")

    // 剩余时间 & 剩余时间百分比
    const [remainTime, setRemainTime] = useState("")
    const [remainTimePercent, setRemainTimePercent] = useState(100)

    // 用户名
    const [userName, setUserName] = useState("")

    // 比赛详细信息
    const [gameInfo, setGameInfo] = useState<UserFullGameInfo>()

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

    const [gameStatus, setGameStatus] = useState("")
    const [beforeGameTime, setBeforeGameTime] = useState("")

    const checkInterStarted = useRef(false)

    // FIXME TeamInfoModel
    // const [availableTeams, setAvailableTeams] = useState<TeamInfoModel[]>([])
    const [preJoinDataPrepared, setPreJoinDataPrepared] = useState(false)

    const [curChoosedTeam, setCurChoosedTeam] = useState<number>(-1)

    const [containerLaunching, setContainerLaunching] = useState(false)
    // FIXME ContainerInfoModel
    // const [containerInfo, setContainerInfo] = useState<ContainerInfoModel>({})
    const [containerLeftTime, setContainerLeftTime] = useState("")

    const [blood, setBlood] = useState("")
    const [bloodMessage, setBloodMessage] = useState("")

    const gameID = parseInt(id, 10)

    const [cookies, setCookie, removeCookie] = useCookies(["uid"])


    // 更新当前选中题目信息, 根据 Websocket 接收到的信息被动调用
    const updateChallenge = () => {
        if (!prevChallenge.current) return
        api.user.userGetGameChallenge(gameID, prevChallenge.current.challenge_id || 0).then((response) => {
            setCurChallenge(response.data.data || {})
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

        // TODO 初始化阶段的靶机存活判断重写
        // if (curChallenge.context?.closeTime) {
        //     setContainerInfo({
        //         entry: curChallenge.context.instanceEntry || "",
        //         status: ContainerStatus.Running,
        //         expectStopAt: curChallenge.context?.closeTime
        //     })
        //     setContainerLaunching(true)
        // } else {
        //     setContainerLaunching(false)
        //     setContainerInfo({})
        // }

        // 切换题目重置折叠状态
        if (JSON.stringify(curChallenge) == JSON.stringify(prevChallenge.current)) return
        prevChallenge.current = curChallenge

        Object.keys(challenges).forEach((obj) => {
            const detail = challenges[obj].find((obj) => obj.challenge_id == curChallenge?.challenge_id)
            if (detail) curChallengeDetail.current = detail
        })

        const noneDict: Record<number, boolean> = {}
        for (let i = 0; i < (curChallenge?.hints?.length || 0); i++) {
            noneDict[i] = true
        }
        setFoldedItems(noneDict)

        const timeout = setTimeout(() => setPageSwitch(false), 300)

        return () => {
            clearTimeout(timeout)
        }
    }, [curChallenge]);

    // TODO 靶机生存时间判断重写
    // useEffect(() => {
    //     if (dayjs(containerInfo.expectStopAt) > dayjs()) {
    //         setContainerLeftTime(formatDuration(dayjs(containerInfo.expectStopAt).diff(dayjs()) / 1000))
    //         const leftTimeInter = setInterval(() => {
    //             if (dayjs(containerInfo.expectStopAt) > dayjs()) {
    //                 setContainerLeftTime(formatDuration(dayjs(containerInfo.expectStopAt).diff(dayjs()) / 1000))
    //             } else {
    //                 setContainerInfo({})
    //             }
    //         }, 500)

    //         return () => clearInterval(leftTimeInter)
    //     } else if (dayjs(containerInfo.expectStopAt) < dayjs()) {
    //         setContainerInfo({})
    //     }
    // }, [containerInfo])

    useEffect(() => {

        // 获取比赛信息以及剩余时间
        api.user.userGetGameInfoWithTeamInfo(gameID).then((res) => {
            setGameInfo(res.data.data)

            // 第一步 检查是否报名
            if (res.data.data.team_status == ParticipationStatus.UnRegistered) {
                // 未报名
                setGameStatus("unRegistered")
            } else if (res.data.data.team_status == ParticipationStatus.Pending) {
                // 审核中
                setGameStatus("waitForProcess")
            } else if (res.data.data.team_status == ParticipationStatus.Approved) {
                if (dayjs() < dayjs(res.data.data.start_time)) {
                    // 等待比赛开始
                    setGameStatus("pending")
                } else if (dayjs() < dayjs(res.data.data.end_time)) {
                    // 比赛进行中
                    setGameStatus("running")
                } else if (dayjs() > dayjs(res.data.data.end_time)) {
                    if (!res.data.data.practice_mode) {
                        setGameStatus("ended")
                    } else {
                        // 练习模式
                        setGameStatus("practiceMode")
                    }
                }
            } else if (res.data.data.team_status == ParticipationStatus.Banned) {
                // 禁赛
                setGameStatus("banned")
            }
        }).catch((error: AxiosError) => {
            if (error.response?.status) {
                const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                if (error.response.status == 401) {
                    setGameStatus("unLogin")
                } else if (error.response.status == 404) {
                    setGameStatus("noSuchGame")
                }
            }
        })
    }, [id])

    useEffect(() => {
        console.log("GameStatus", gameStatus)
        // 根据比赛状态处理事件
        if (gameStatus == "running" || gameStatus == "practiceMode") {

            const totalTime = Math.floor(dayjs(gameInfo?.end_time).diff(dayjs(gameInfo?.start_time)) / 1000)
            let timeIter: NodeJS.Timeout;

            // 比赛时间倒计时
            if (gameStatus != "practiceMode") {
                timeIter = setInterval(() => {
                    const curLeft = Math.floor(dayjs(gameInfo?.end_time).diff(dayjs()) / 1000)

                    setRemainTime(formatDuration(curLeft))
                    setRemainTimePercent(Math.floor((curLeft / totalTime) * 100))
                }, 500)
            } else {
                setRemainTime(t("practice_time"))
                setRemainTimePercent(0)
            }

            setTimeout(() => setLoadingVisibility(false), 200)

            // 获取比赛通知
            api.user.userGetGameNotices(gameID).then((res) => {
                const filtedNotices: GameNotice[] = []
                let curIndex = 0

                res.data.data.sort((a, b) => (dayjs(b.create_time).unix() - dayjs(a.create_time).unix()))

                res.data.data.forEach((obj) => {
                    if (obj.notice_category == NoticeCategory.NewAnnouncement) filtedNotices[curIndex++] = obj
                })

                res.data.data.forEach((obj) => {
                    if ([NoticeCategory.FirstBlood, NoticeCategory.SecondBlood, NoticeCategory.ThirdBlood].includes(obj.notice_category)) filtedNotices[curIndex++] = obj
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

                if (message.notice_category == NoticeCategory.NewHint && message.data[0] == prevChallenge.current?.challenge_name) {
                    // 防止并发
                    setTimeout(updateChallenge, randomInt(200, 600))
                }

                if (message.notice_category == NoticeCategory.NewAnnouncement) {

                    const newNotices: GameNotice[] = []

                    newNotices[0] = message
                    noticesRef.current.forEach((ele, index) => {
                        newNotices[index + 1] = ele
                    })

                    noticesRef.current = newNotices
                    setNotices(newNotices)

                    toastNewNotice({ title: message.data[0], time: dayjs(message.create_time).unix(), openNotices: setNoticeOpened })
                }

                if ([NoticeCategory.FirstBlood, NoticeCategory.SecondBlood, NoticeCategory.ThirdBlood].includes(message.notice_category) && gameInfo?.team_info?.team_name?.toString().trim() == message.data[0].toString().trim()) {
                    switch (message.notice_category) {
                        case NoticeCategory.FirstBlood:
                            setBloodMessage(`${t2("congratulations")}${t2("blood_message_p1")} ${message.data[1]} ${t2("blood1")}`)
                            setBlood("gold")
                            break
                        case NoticeCategory.SecondBlood:
                            setBloodMessage(`${t2("congratulations")}${t2("blood_message_p1")} ${message.data[1]} ${t2("blood2")}`)
                            setBlood("silver")
                            break
                        case NoticeCategory.ThirdBlood:
                            setBloodMessage(`${t2("congratulations")}${t2("blood_message_p1")} ${message.data[1]} ${t2("blood3")}`)
                            setBlood("copper")
                            break
                    }
                }
            })

            connection.start().catch((error) => {
                console.error(error)
            })

            return () => {
                if (connection) {
                    connection.stop().catch((err) => {
                        console.error(err)
                    })
                }

                if (timeIter) clearInterval(timeIter)
            }

        } else if (gameStatus == "unRegistered") {
            // 未注册 先获取队伍信息

            // TODO 修改每场比赛创建一个队伍
            setTimeout(() => setLoadingVisibility(false), 200)

            // api.team.teamGetTeamsInfo().then((res) => {
            //     setAvailableTeams(res.data)

            //     // 设置加载遮罩状态
            //     setPreJoinDataPrepared(true)
            //     setTimeout(() => setLoadingVisibility(false), 200)
            // }).catch((error: AxiosError) => {
            //     if (error.response?.status) {
            //         if (error.response.status == 401) {
            //             setGameStatus("unLogin")
            //         }
            //     }
            // })
            setTimeout(() => setLoadingVisibility(false), 200)
        } else if (gameStatus == "waitForProcess") {
            // 启动一个监听进程
            const refershTeamStatusInter = setInterval(() => {
                api.user.userGetGameInfoWithTeamInfo(gameID).then((res) => {
                    if (res.data.data.team_status == ParticipationStatus.Approved) {
                        if (dayjs() < dayjs(res.data.data.start_time)) {
                            // 等待比赛开始
                            setGameStatus("pending")
                        } else if (dayjs() < dayjs(res.data.data.end_time)) {
                            // 比赛进行中
                            setGameStatus("running")
                        } else if (dayjs() > dayjs(res.data.data.end_time)) {
                            setGameStatus("ended")
                        }
                        // 结束监听
                        clearInterval(refershTeamStatusInter)
                    }
                })
            }, 2000)

            setTimeout(() => setLoadingVisibility(false), 200)
        } else if (gameStatus == "banned" || gameStatus == "ended" || gameStatus == "noSuchGame" || gameStatus == "unLogin") {
            setTimeout(() => setLoadingVisibility(false), 200)
        } else if (gameStatus == "pending") {
            const penddingTimeInter = setInterval(() => {
                // 如果当前时间大于开始时间
                if (dayjs() > dayjs(gameInfo?.start_time)) {
                    clearInterval(penddingTimeInter)
                    const checkGameStartedInter = setInterval(() => {
                        api.user.userGetGameChallenges(gameID).then((res) => {
                            clearInterval(checkGameStartedInter)

                            // 防卡
                            setTimeout(() => {
                                setGameStatus("running")
                            }, randomInt(1000, 2000))
                        }).catch((error: AxiosError) => { })
                    }, 2000)
                } else {
                    setBeforeGameTime(formatDuration(Math.floor(dayjs(gameInfo?.start_time).diff(dayjs()) / 1000)))
                }
            }, 500)

            setTimeout(() => setLoadingVisibility(false), 500)

            return () => {
                if (penddingTimeInter) clearInterval(penddingTimeInter)
            }
        }
    }, [gameStatus])

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
        // TODO 下载文件逻辑重写
        // if (curChallenge.context?.url) {
        //     const url = curChallenge.context?.url;

        //     // 判断是否是本地附件
        //     if (curChallenge.context.fileSize) {
        //         const fileName = getAttachmentName(url);
        //         setDownloadName(fileName);

        //         // 开始下载
        //         const fetchFile = async () => {
        //             try {
        //                 const response = await fetch(url);
        //                 const contentLength = response.headers.get("Content-Length") || "";
        //                 if (!response.ok) {
        //                     throw new Error("Network response was not ok");
        //                 }

        //                 const reader = response.body!.getReader();
        //                 const totalBytes = parseInt(contentLength, 10);
        //                 let receivedBytes = 0;

        //                 // 创建一个新的 Blob 来保存文件内容
        //                 const chunks: Uint8Array[] = [];
        //                 const pump = async () => {
        //                     const { done, value } = await reader.read();
        //                     if (done) {
        //                         const blob = new Blob(chunks);
        //                         const downloadUrl = URL.createObjectURL(blob);

        //                         setTimeout(() => {
        //                             setDownloadName("");  // 清除文件名
        //                             setAttachDownloadProgress(0); // 重置进度条

        //                             setTimeout(() => {
        //                                 const a = document.createElement("a");
        //                                 a.href = downloadUrl;
        //                                 a.download = dayjs().format("HHmmss") + "_" + fileName;
        //                                 a.click();
        //                                 URL.revokeObjectURL(downloadUrl);
        //                             }, 300)
        //                         }, 1500)

        //                         return;
        //                     }

        //                     // 保存当前的下载进度
        //                     chunks.push(value);
        //                     receivedBytes += value.length;
        //                     const progress = Math.min(100, (receivedBytes / totalBytes) * 100);
        //                     if (progress < 100) {
        //                         setAttachDownloadProgress(progress);
        //                     } else {
        //                         setAttachDownloadProgress(100);
        //                         setTimeout(() => {
        //                             setAttachDownloadProgress(101);
        //                         }, 500)
        //                     }

        //                     pump();  // 继续读取数据
        //                 };

        //                 pump();
        //             } catch (error) {
        //                 console.error("Download failed:", error);
        //                 setDownloadName("");  // 清除文件名
        //                 setAttachDownloadProgress(0); // 重置进度条
        //             }
        //         };

        //         setTimeout(() => {
        //             fetchFile();
        //         }, 500)
        //     } else {
        //         // 如果是直接通过 URL 打开文件
        //         setRedirectURL(url)
        //     }
        // }
    };

    const submitTeam = () => {
        // TODO 创建比赛队伍逻辑重写
        // if (curChoosedTeam != -1) {
        //     api.game.gameJoinGame(gameID, {
        //         teamId: curChoosedTeam
        //     }).then((res) => {
        //         // 更新队伍信息
        //         api.game.gameGame(gameID).then((res) => {
        //             setGameInfo(res.data)
        //             toast.success(t("team_submitted"), { position: "top-center" })

        //             setGameStatus("waitForProcess")
        //         }).catch((error: AxiosError) => {
        //             if (error.response?.status) {
        //                 const errorMessage: ErrorMessage = error.response.data as ErrorMessage
        //                 toast.error(errorMessage.title, { position: "top-center" })
        //             } else {
        //                 toast.error(t("unknow_error"), { position: "top-center" })
        //             }
        //         })
        //     })
        // } else {
        //     toast.error(t("choose_team_first"), { position: "top-center" })
        // }
    }

    const updateContainer = (inter?: NodeJS.Timeout) => {
        // TODO 创建靶机逻辑重写
        // api.game.gameCreateContainer(gameID, curChallenge.challenge_id!).then((res) => {
        //     setContainerInfo(res.data)

        //     if (res.data.status == ContainerStatus.Running || res.data.status == ContainerStatus.Destroyed) {
        //         toast.success(t("container_start_success"), { position: "top-center" })
        //         if (inter) clearInterval(inter)
        //     }
        // }).catch((error: AxiosError) => {
        //     if (error.response?.status) {
        //         const errorMessage: ErrorMessage = error.response.data as ErrorMessage
        //         toast.error(errorMessage.title, { position: "top-center" })
        //     } else {
        //         toast.error(t("unknow_error"), { position: "top-center" })
        //     }

        //     if (inter) clearInterval(inter)
        //     setContainerLaunching(false)
        // })
    }

    const handleLaunchContainer = () => {
        setContainerLaunching(true)

        const updateContainerInter = setInterval(() => {
            updateContainer(updateContainerInter)
        }, 2000)
    }

    const handleExtendContainer = () => {
        // TODO 延长靶机逻辑重写
        // api.game.gameExtendContainerLifetime(gameID, curChallenge.challenge_id!).then((res) => {
        //     setContainerInfo(res.data)
        //     toast.success(t("container_extend_success"), { position: "top-center" })
        // }).catch((error: AxiosError) => {
        //     if (error.response?.status) {
        //         const errorMessage: ErrorMessage = error.response.data as ErrorMessage
        //         toast.error(errorMessage.title, { position: "top-center" })
        //     } else {
        //         toast.error(t("unknow_error"), { position: "top-center" })
        //     }
        // })
    }

    const handleDestoryContainer = () => {
        // TOOD 销毁靶机逻辑重写
        // api.game.gameDeleteContainer(gameID, curChallenge.challenge_id!).then((res) => {
        //     toast.success(t("container_destory_success"), { position: "top-center" })
        //     setContainerInfo({})
        //     setContainerLaunching(false)
        // }).catch((error: AxiosError) => {
        //     if (error.response?.status) {
        //         const errorMessage: ErrorMessage = error.response.data as ErrorMessage
        //         toast.error(errorMessage.title, { position: "top-center" })
        //     } else {
        //         toast.error(t("unknow_error"), { position: "top-center" })
        //     }
        // })
    }

    return (
        <>
            <GameSwitchHover animation={false} />
            <LoadingPage visible={loadingVisiblity} />
            <SolvedAnimation blood={blood} setBlood={setBlood} bloodMessage={bloodMessage} />

            {gameStatus == "banned" && (
                <motion.div
                    className={`absolute top-0 left-0 w-screen h-screen flex items-center justify-center z-[40]`}
                    initial={{
                        backgroundColor: "rgb(239 68 68 / 0)",
                        backdropFilter: "blur(0px)"
                    }}
                    animate={{
                        backgroundColor: "rgb(239 68 68 / 0.9)",
                        backdropFilter: "blur(16px)"
                    }}
                    transition={{
                        duration: 0.5
                    }}
                >
                    <div className="flex flex-col items-center gap-4 select-none">
                        <div className="flex flex-col items-center gap-6 text-white">
                            <TriangleAlert size={120} />
                            <span className="text-3xl">{t("you_have_be_banned")}</span>
                        </div>
                        <div className="flex gap-4 mt-6">
                            <Button variant="secondary"
                                onClick={() => setScoreBoardVisible(true)}
                            ><Presentation />{t("rank")}</Button>
                            <TransitionLink className="transition-colors" href={`/${lng}/games`}>
                                <Button variant="secondary">{t("back_to_main")}</Button>
                            </TransitionLink>
                        </div>
                    </div>
                </motion.div>
            )}

            { ["pending", "ended", "unRegistered", "waitForProcess", "unLogin"].includes(gameStatus) && (
                <div className="absolute top-0 left-0 w-screen h-screen backdrop-blur-xl z-40">
                    <div className="flex w-full h-full relative">
                        <div className="w-full h-full hidden md:block">
                            <div className="w-full h-full flex flex-col overflow-hidden">
                                <MacScrollbar className="h-full w-full"
                                    skin={theme ==  "light" ? "light" : "dark"}
                                    trackStyle={(horizontal) => ({ [horizontal ? "height" : "width"]: 0, borderWidth: 0})}
                                >
                                    <div className="pt-5 lg:pt-10">
                                        <span className="text-2xl font-bold px-8 select-none mb-4 text-nowrap overflow-hidden text-ellipsis">✨ 比赛须知 - { gameInfo?.name }</span>
                                        <div className="px-5 pb-5 lg:px-10 lg:pb-10 w-[60%]">
                                            <Mdx source={gameInfo?.description ?? "没有比赛通知哦"} />
                                        </div>
                                    </div>
                                </MacScrollbar>
                            </div>
                        </div>

                        <div className="absolute left-[60%] w-[40%] h-full flex-1 md:flex-none pointer-events-none">
                            {(gameStatus == "pending" || gameStatus == "ended") && (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="flex flex-col text-3xl items-center gap-4 select-none">
                                        <AlarmClock size={80} className="mb-4" />
                                        {gameStatus == "ended" ? (<span className="font-bold">{t("game_ended")}</span>) : (<span className="font-bold">{t("game_pending")}</span>)}
                                        {gameStatus == "pending" && (<span className="text-2xl">{t("game_start_countdown")} {beforeGameTime}</span>)}
                                        <div className="flex mt-2">
                                            <TransitionLink className="transition-colors pointer-events-auto" href={`/${lng}/games`}>
                                                <Button>{t("back_to_main")}</Button>
                                            </TransitionLink>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {gameStatus == "unRegistered"  && (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-4 select-none">
                                        <NotebookPen size={80} className="mb-4" />
                                        <span className="text-2xl mb-2 font-bold">{t("not_participated")}</span>
                                        <div className="flex gap-[15px] mt-4 pointer-events-auto">
                                            <Button variant="outline"
                                                onClick={() => setScoreBoardVisible(true)}
                                            ><Presentation />{t("rank")}</Button>
                                            <TransitionLink className="transition-colors" href={`/${lng}/games`}>
                                                <Button variant="outline">{t("back_to_main")}</Button>
                                            </TransitionLink>
                                        </div>
                                        <div className="flex gap-[15px] mt-[-5px] pointer-events-auto">
                                            <CreateTeamDialog updateTeam={() => {}} gameID={gameID}>
                                                <Button variant="default" type="button"><Pickaxe />创建队伍</Button>
                                            </CreateTeamDialog>
                                            <JoinTeamDialog updateTeam={() => {}}>
                                                <Button variant="default" type="button"><Users />加入队伍</Button>
                                            </JoinTeamDialog>
                                            
                                        </div>
                                    </div>
                                </div>
                            )}

                            {gameStatus == "waitForProcess" && (
                                <div
                                    className={`w-full h-full flex items-center justify-center`}
                                >
                                    <div className="flex flex-col items-center gap-4 select-none">
                                        <ListCheck size={80} className="mb-4" />
                                        <span className="text-2xl font-bold">{t("wait_for_process")}</span>
                                    </div>
                                </div>
                            )}

                            {gameStatus == "unLogin" && (
                                <div
                                    className={`w-full h-full flex items-center justify-center`}
                                >
                                    <div className="flex flex-col items-center gap-8 select-none">
                                        <Ban size={80} className="mb-4" />
                                        <span className="text-2xl font-bold mb-4">{t("login_first")}</span>
                                        <div className="flex gap-6 pointer-events-auto">
                                            <Button variant="outline"
                                                onClick={() => setScoreBoardVisible(true)}
                                            ><Presentation />{t("rank")}</Button>
                                            <TransitionLink className="transition-colors" href={`/${lng}/games`}>
                                                <Button variant="outline">{t("back_to_main")}</Button>
                                            </TransitionLink>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* New */}
            {gameStatus == "noSuchGame" && (
                <div
                    className={`absolute top-0 left-0 w-screen h-screen backdrop-blur-xl flex items-center justify-center z-[40]`}
                >
                    <div className="flex flex-col items-center gap-4 select-none">
                        <Info size={80} className="mb-4"/>
                        <span className="text-2xl mb-4">{t("no_such_game")}</span>
                        <TransitionLink className="transition-colors" href={`/${lng}/games`}>
                            <Button variant="outline">{t("back_to_main")}</Button>
                        </TransitionLink>
                    </div>
                </div>
            )}

            {/* 下载动画 */}
            <DownloadBar key={"download-panel"} progress={attachDownloadProgress} downloadName={downloadName}></DownloadBar>
            <ScoreBoardPage gmid={gameID} visible={scoreBoardVisible} setVisible={setScoreBoardVisible} gameStatus={gameStatus} />
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
                        // setGameDetail={setGameDeatail}
                        resizeTrigger={setResizeTrigger}
                        setPageSwitching={setPageSwitch}
                        lng={lng}
                        challenges={challenges || {}}
                        setChallenges={setChallenges}
                        challengeSolvedList={challengeSolvedList}
                        setChallengeSolvedList={setChallengeSolvedList}
                        gameStatus={gameStatus}
                        setGameStatus={setGameStatus}
                    />
                </div>
                <main className="flex flex-col top-0 left-0 h-screen w-screen overflow-hidden backdrop-blur-sm relative">
                    <div className="h-[70px] flex items-center pl-4 pr-4 z-20 w-full bg-transparent border-b-[1px] transition-[border-color] duration-300">
                        <div className="flex items-center min-w-0 h-[32px]">
                            <SidebarTrigger className="transition-colors duration-300" />
                            {/* <span className="font-bold ml-3">{ challenge.category } - { challenge.title }</span> */}
                            <span className="font-bold ml-1 text-ellipsis overflow-hidden text-nowrap transition-colors duration-300">{gameInfo?.name}</span>
                        </div>
                        <div className="flex-1" />
                        <div id="rightArea" className="justify-end flex h-ful gap-[6px] lg:gap-[10px] items-center pointer-events-auto">
                            <div className="bg-background rounded-2xl">
                                <div className="bg-black bg-opacity-10 pl-4 pr-4 pt-1 pb-1 rounded-2xl overflow-hidden select-none dark:bg-[#2A2A2A] hidden lg:flex relative transition-colors duration-300">
                                    <div className="absolute top-0 left-0 bg-black dark:bg-white transition-colors duration-300"
                                        style={{ width: `${remainTimePercent}%`, height: '100%' }}
                                    />
                                    <span className="text-white mix-blend-difference z-20 transition-all duration-500">{remainTime}</span>
                                </div>
                            </div>
                            <DropdownMenu modal={false}>
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
                                                <span className="text-white mix-blend-difference z-20">{remainTime}</span>
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setNoticeOpened(true)} disabled={notices.length == 0}>
                                            <PackageOpen />
                                            <span>{t("open_notices")}</span>
                                            {notices.length ? <Badge variant="destructive" className="p-0 pl-1 pr-1">{notices.filter((e) => e.notice_category == NoticeCategory.NewAnnouncement).length}</Badge> : <></>}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setScoreBoardVisible(true)}>
                                            <Presentation />
                                            <span>{t("rank")}</span>
                                        </DropdownMenuItem>
                                    </div>

                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button variant="outline" className="select-none hidden lg:flex" onClick={() => setNoticeOpened(true)} disabled={notices.length == 0}>
                                <div className="flex items-center gap-1">
                                    <PackageOpen />
                                    <span>{t("open_notices")}</span>
                                    {notices.length ? <Badge variant="destructive" className="p-0 pl-1 pr-1">{notices.filter((e) => e.notice_category == NoticeCategory.NewAnnouncement).length}</Badge> : <></>}
                                </div>
                            </Button>
                            <Button variant="outline" className="select-none hidden lg:flex" onClick={() => setScoreBoardVisible(true)}>
                                <div className="flex items-center gap-1">
                                    <Presentation />
                                    <span>{t("rank")}</span>
                                </div>
                            </Button>
                            {/* <Button size="icon" variant="outline" onClick={testFunction}><FlaskConical /></Button> */}
                            <ToggleTheme lng={lng} />
                            <Avatar className="select-none">
                                {curProfile.avatar ? (
                                    <>
                                        <AvatarImage src={curProfile.avatar || "#"} alt="@shadcn"
                                            className={`rounded-2xl`}
                                        />
                                        <AvatarFallback><Skeleton className="h-full w-full rounded-full" /></AvatarFallback>
                                    </>
                                ) : (
                                    <div className='w-full h-full bg-foreground/80 flex items-center justify-center rounded-2xl'>
                                        <span className='text-background text-md'> {curProfile.userName?.substring(0, 2)} </span>
                                    </div>
                                )}
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
                            {!curChallenge ? (
                                <div className="absolute top-0 left-0 w-full h-full flex p-7 flex-col">
                                    {gameInfo?.description ? (
                                        <Mdx source={gameInfo.description || ""}></Mdx>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center select-none">
                                            <span className="font-bold text-lg">{t("choose_something")}</span>
                                        </div>
                                    )}
                                </div>
                            ) : <></>}
                            <div className="absolute bottom-2 right-2 flex flex-col gap-2 p-2 opacity-100 ease-in-out">
                                {
                                    curChallenge && curChallenge.hints?.map((value, index) => {
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
                                                        <span className="font-bold">{value.content}</span>
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
                                        {
                                        // TODO 靶机状态重写
                                        /* {curChallenge.challenge_name && (
                                            <div className="w-full border-b-[1px] h-[50px] p-2 transition-[border-color] duration-300 flex items-center gap-1">
                                                <div className="flex items-center gap-2 transition-colors duration-300 overflow-hidden">
                                                    <Info size={21} className="flex-none" />
                                                    <span className="text-lg overflow-hidden text-ellipsis text-nowrap">{curChallenge.challenge_name}</span>
                                                </div>
                                                <div className="flex-1" />
                                                <div className="flex justify-end gap-4 transition-colors duration-300">
                                                    {challengeSolvedList[curChallenge.challenge_id || 0] ? (
                                                        <div className="flex items-center gap-2 text-purple-600">
                                                            <ScanHeart className="flex-none" />
                                                            <span className="text-sm lg:text-md font-bold">{curChallengeDetail.current.score} pts</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-amber-600">
                                                            <Flag className="flex-none" />
                                                            <span className="text-sm lg:text-md font-bold">{curChallengeDetail.current.score} pts</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2 text-green-600">
                                                        <CircleCheckBig />
                                                        <span className="text-sm lg:text-md font-bold">{curChallengeDetail.current.solved} solves</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {(curChallenge.type == ChallengeType.DynamicContainer || curChallenge.type == ChallengeType.StaticContainer) && (
                                            <div className="w-full border-b-[1px] h-[50px] p-2 transition-[border-color] duration-300 flex items-center">
                                                <div className="flex items-center gap-2 transition-colors duration-300 select-none">
                                                    <Target size={21} />
                                                    <span className="text-md">{t("live_container")}</span>
                                                </div>
                                                <div className="flex-1" />
                                                <div className="flex justify-end gap-4 h-full">
                                                    {(containerInfo.status != ContainerStatus.Running && containerInfo.status != ContainerStatus.Destroyed) && (
                                                        <Button variant="ghost" className="pl-4 pr-4 pt-0 pb-0 text-md text-green-600 font-bold [&_svg]:size-6 transition-colors duration-300 select-none" disabled={containerLaunching}
                                                            onClick={() => { handleLaunchContainer() }}
                                                        >
                                                            {containerLaunching ? (
                                                                <div className="flex gap-[8px]">
                                                                    <LoaderCircle className="animate-spin" />
                                                                    <span className="">{t("launching")}</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex gap-[6px]">
                                                                    <Rocket />
                                                                    <span className="">{t("launch")}</span>
                                                                </div>
                                                            )}
                                                        </Button>
                                                    )}

                                                    {containerInfo.status == ContainerStatus.Running && (
                                                        <>
                                                            <div className="flex h-full gap-2">
                                                                <div className="gap-2 h-full items-center pl-4 pr-4 border-[1px] rounded-2xl hidden xl:flex">
                                                                    <Hourglass size={20} />
                                                                    <span>{containerLeftTime}</span>
                                                                </div>
                                                                <div className="gap-2 h-full items-center pl-4 pr-4 border-[1px] rounded-2xl hidden xl:flex">
                                                                    <Container size={22} />
                                                                    <span>{containerInfo.entry}</span>
                                                                </div>
                                                                <DropdownMenu modal={false}>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="outline" size="icon" className="xl:hidden"><Container /></Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent className="mt-2">
                                                                        <div className="flex flex-col gap-2 p-2">
                                                                            <div className="gap-2 items-center h-[33px] pl-4 pr-4 border-[1px] rounded-2xl flex xl:hidden">
                                                                                <Hourglass size={20} />
                                                                                <span>{containerLeftTime}</span>
                                                                            </div>
                                                                            <div className="gap-2 items-center h-[33px] pl-4 pr-4 border-[1px] rounded-2xl flex xl:hidden">
                                                                                <Container size={22} />
                                                                                <span>{containerInfo.entry}</span>
                                                                            </div>
                                                                        </div>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                                <div className="h-full flex items-center">
                                                                    <Button variant={"outline"} size={"icon"} onClick={() => {
                                                                        const status = copy(containerInfo.entry!)
                                                                        if (status) {
                                                                            toast.success(t("copied"), { position: "top-center" })
                                                                        } else {
                                                                            toast.success(t("fail_copy"), { position: "top-center" })
                                                                        }
                                                                    }}><Copy /></Button>
                                                                </div>
                                                                <div className="h-full flex items-center">
                                                                    <Button variant={"outline"} size={"icon"} onClick={() => handleExtendContainer()} ><ClockArrowUp /></Button>
                                                                </div>
                                                                <div className="h-full flex items-center">
                                                                    <Button variant={"destructive"} className="[&_svg]:size-5" onClick={() => handleDestoryContainer()} size={"icon"}><X /></Button>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )} */}

                                        {curChallenge?.attachments?.length ? (
                                            <div className="w-full border-b-[1px] h-[50px] p-2 flex items-center gap-4 transition-[border-color] duration-300">
                                                <div className="flex items-center gap-2 transition-colors duration-300">
                                                    <Files size={21} />
                                                    <span className="text-md">{t("attachments")}</span>
                                                </div>
                                                <div className="flex justify-end gap-4">
                                                    {curChallenge.attachments.map((attach, i) => (
                                                        <Button variant="ghost" key={i} onClick={() => handleDownload()} className="pl-4 pr-4 pt-0 pb-0 text-md [&_svg]:size-5 transition-all duration-300" disabled={downloadName != ""}>
                                                            <div className="flex gap-[4px] items-center">
                                                                {attach.attach_type == AttachmentType.STATICFILE ? (
                                                                    // 有文件大小的是本地附件
                                                                    <>
                                                                        <CloudDownload />
                                                                        <span className=""> {attach.attach_name} </span>
                                                                    </>
                                                                ) : (
                                                                    // 远程附件
                                                                    <>
                                                                        <Link />
                                                                        <span className=""> {t("external_links")} </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (<></>)}


                                        {curChallenge?.challenge_name && (
                                            <div className="w-full p-8 flex-1">
                                                {curChallenge.description ? (
                                                    <Mdx source={curChallenge.description} />
                                                ) : (
                                                    <div className="w-full h-full flex justify-center items-center select-none gap-4">
                                                        <Image
                                                            src="/images/peter.png"
                                                            alt="Peter"
                                                            width={200}
                                                            height={40}
                                                            priority
                                                        />
                                                        <span className="text-3xl font-bold">{t("oops_empty")}</span>
                                                    </div>
                                                )}

                                            </div>
                                        )}
                                    </MacScrollbar>
                                </SafeComponent>
                            </div>
                        </ResizableScrollablePanel>
                        {curChallenge?.challenge_name ? (
                            <>
                                <ResizableHandle withHandle={true} className="transition-colors duration-300" />
                                <ResizableScrollablePanel defaultSize={40} minSize={10}>
                                    <div className="flex flex-col p-0 h-full resize-y">
                                        {userName ? (
                                            <></>
                                            // FIXME 终端需要修复
                                            // <GameTerminal challenge={curChallenge} gameid={id} pSize={resizeTrigger!} userName={gameInfo?.team_info?.team_name || ""} setChallengeSolved={setChallengeSolved} />
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