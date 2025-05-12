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
import { useEffect, useMemo, useRef, useState } from "react";

// import { api, ChallengeDetailModel, GameDetailModel, DetailedGameInfoModel, GameNotice, NoticeCategory, ChallengeInfo, ChallengeType, ErrorMessage, TeamInfoModel, ParticipationStatus, ContainerStatus, ContainerInfoModel } from '@/utils/GZApi'

import { api } from "@/utils/ApiHelper"
import { AttachmentType, ContainerStatus, ErrorMessage, ExposePortInfo, GameNotice, NoticeCategory, ParticipationStatus, UserAttachmentConfig, UserDetailGameChallenge, UserFullGameInfo, UserSimpleGameChallenge } from "@/utils/A1API"


import * as signalR from '@microsoft/signalr'

import dayjs from "dayjs";
import { LoadingPage } from "./LoadingPage";
import { Button } from "./ui/button";
import { AlarmClock, AppWindow, ArrowDownUp, Ban, CalendarClock, CheckCheck, CircleCheckBig, CirclePower, CircleX, ClockArrowUp, CloudDownload, Container, Copy, EthernetPort, File, FileDown, Files, Flag, FlaskConical, FoldHorizontal, Hourglass, Info, Link, ListCheck, Loader2, LoaderCircle, LoaderPinwheel, Network, NotebookPen, Package, PackageOpen, Paperclip, Pickaxe, PowerOff, Presentation, Rocket, ScanHeart, ShieldX, Target, TriangleAlert, UnfoldHorizontal, Users, X } from "lucide-react";
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
import TimerDisplay from "./modules/TimerDisplay";
import ChallengesViewHeader from "./modules/ChallengeViewHeader";
import SubmitFlagView from "./modules/SubmitFlagView";
import { Progress } from "./ui/progress";
import FileDownloader from "./modules/FileDownloader";
import ChallengeNameTitle from "./modules/ChallengeNameTitle";

import { useSpring, animated } from "@react-spring/web";

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

export interface ChallengeSolveStatus {
    solved: boolean;
    solve_count: number;
    cur_score: number;
}

export function ChallengesView({ id, lng }: { id: string, lng: string }) {

    const t = useTranslations('challenge_view');
    const t2 = useTranslations("notices_view")

    // 所有题目
    const [challenges, setChallenges] = useState<Record<string, UserSimpleGameChallenge[]>>({})

    // 当前选中的题目
    const [curChallenge, setCurChallenge] = useState<UserDetailGameChallenge>()
    const curChallengeDetail = useRef<UserDetailGameChallenge>()

    // 附件下载信息
    interface DownloadInfo {
        size: string;
        progress: number;
        speed: string;
    };

    const [downloadSpeed, setDownloadSpeed] = useState<Record<string, DownloadInfo>>({})

    // 前一个题目
    const prevChallenge = useRef<UserDetailGameChallenge>();

    // 头像 URL
    const [avatarURL, setAvatarURL] = useState("#")

    // 用户名
    const [userName, setUserName] = useState("")

    // 比赛详细信息
    const [gameInfo, setGameInfo] = useState<UserFullGameInfo>()

    // 加载动画
    const [loadingVisiblity, setLoadingVisibility] = useState(true)

    // 侧栏打开关闭的时候更新 Terminal 宽度用的钩子
    const [resizeTrigger, setResizeTrigger] = useState<number>(0)

    // Hints 折叠状态
    // const [foldedItems, setFoldedItems] = useState<Record<number, boolean>>({});

    // 页面切换动画
    const [pageSwitch, setPageSwitch] = useState(false)

    // 题目是否解决
    const [challengeSolveStatusList, setChallengeSolveStatusList] = useState<Record<number, ChallengeSolveStatus>>({});

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

    const [containerInfo, setContainerInfo] = useState<ExposePortInfo[]>([])
    const [containerRunningTrigger, setContainerRunningTrigger] = useState(false);
    const [refreshContainerTrigger, setRefreshContainerTrigger] = useState(false);
    const [containerExpireTime, setContainerExpireTime] = useState<dayjs.Dayjs | null>(dayjs())

    const [blood, setBlood] = useState("")
    const [bloodMessage, setBloodMessage] = useState("")

    const gameID = parseInt(id, 10)

    const [cookies, setCookie, removeCookie] = useCookies(["uid"])

    const [submitFlagWindowVisible, setSubmitFlagWindowVisible] = useState(false)

    const wsRef = useRef<WebSocket | null>(null)


    // 更新当前选中题目信息, 根据 Websocket 接收到的信息被动调用
    const updateChallenge = () => {
        if (!prevChallenge.current) return
        api.user.userGetGameChallenge(gameID, prevChallenge.current.challenge_id || 0).then((response) => {
            setCurChallenge(response.data.data || {})
        }).catch((error: AxiosError) => { })
    }

    const setChallengeSolved = (id: number) => {
        setChallengeSolveStatusList((prev) => ({
            ...prev,
            [id]: {
                solved: true,
                solve_count: (prev[id]?.solve_count ?? 0) + 1,
                cur_score: prev[id]?.cur_score ?? 0,
            },
        }))

        if (curChallengeDetail.current?.challenge_id == id) {
            curChallengeDetail.current.solve_count = (curChallengeDetail.current.solve_count ?? 0) + 1
        }
    }

    // 开关某一 Hint 项的折叠状态
    // const toggleFolded = (itemId: number) => {
    //     setFoldedItems((prevState) => ({
    //         ...prevState,
    //         [itemId]: !prevState[itemId], // 切换该项的折叠状态
    //     }));
    // }

    useEffect(() => {
        if (refreshContainerTrigger == true) {
            const inter = setInterval(() => {
                api.user.userGetContainerInfoForAChallenge(gameID, curChallenge?.challenge_id ?? 0).then((res) => {
                    if (res.data.data.container_status == ContainerStatus.ContainerRunning) {
                        setContainerInfo(res.data.data.containers)
                        setContainerLaunching(false)
                        setContainerRunningTrigger(true)

                        setContainerExpireTime(res.data.data.container_expiretime
                            ? dayjs(res.data.data.container_expiretime)
                            : null)

                        toast.success(t("container_start_success"), { position: "top-center" })

                        clearInterval(inter)
                        setRefreshContainerTrigger(false)
                    } else if (res.data.data.container_status != ContainerStatus.ContainerQueueing &&
                        res.data.data.container_status != ContainerStatus.ContainerStarting
                    ) {
                        setContainerLaunching(false)
                        setContainerRunningTrigger(false)

                        clearInterval(inter)

                        setRefreshContainerTrigger(false)
                    }
                }).catch(() => {
                    toast.error("靶机开启失败", { position: "top-center" })
                    setContainerLaunching(false)
                    setContainerRunningTrigger(false)

                    clearInterval(inter)

                    setRefreshContainerTrigger(false)
                })
            }, randomInt(3000, 5000))

            return () => {
                clearInterval(inter)
            }
        }
    }, [refreshContainerTrigger])

    useEffect(() => {
        console.log(curChallenge)

        setContainerInfo(curChallenge?.containers ?? [])
        setContainerExpireTime(curChallenge?.container_expiretime
            ? dayjs(curChallenge.container_expiretime)
            : null)

        if (curChallenge?.container_status == ContainerStatus.ContainerRunning) {
            setContainerRunningTrigger(true)
        } else if (curChallenge?.container_status == ContainerStatus.ContainerQueueing) {
            setContainerLaunching(true)
            setRefreshContainerTrigger(true)
        } else {
            setContainerRunningTrigger(false)
        }

        // 切换题目重置折叠状态
        if (JSON.stringify(curChallenge) == JSON.stringify(prevChallenge.current)) return
        prevChallenge.current = curChallenge

        Object.keys(challenges).forEach((obj) => {
            const detail = challenges[obj].find((obj) => obj.challenge_id == curChallenge?.challenge_id)
            if (detail) curChallengeDetail.current = detail
        })

        // const noneDict: Record<number, boolean> = {}
        // for (let i = 0; i < (curChallenge?.hints?.length || 0); i++) {
        //     noneDict[i] = true
        // }
        // setFoldedItems(noneDict)

        const timeout = setTimeout(() => setPageSwitch(false), 300)

        return () => {
            clearTimeout(timeout)
        }
    }, [curChallenge]);

    const containerCountDownInter: NodeJS.Timeout | null = null;

    // useEffect(() => {
    //     if (containerRunningTrigger == true) {
    //         if (containerCountDownInter != null) {
    //             clearInterval(containerCountDownInter);
    //         }

    //         containerCountDownInter = setInterval(() => {
    //             if (curChallenge?.containers?.length) {
    //                 const leftTime = Math.floor(dayjs(curChallenge?.containers[0].close_time).diff(dayjs()) / 1000)
    //                 setContainerLeftTime(formatDuration(leftTime))
    //             }
    //         }, 1000)
    //     } else {
    //         if (containerCountDownInter != null) {
    //             clearInterval(containerCountDownInter);
    //         }
    //     }
    // }, [containerRunningTrigger])

    useEffect(() => {

        // 获取比赛信息以及剩余时间
        api.user.userGetGameInfoWithTeamInfo(gameID).then((res) => {
            setGameInfo(res.data.data)

            // 第一步 检查是否报名
            if (dayjs() > dayjs(res.data.data.end_time) && !res.data.data.practice_mode) {
                setGameStatus("ended")
            } else {
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
            const socket = new WebSocket(`ws://localhost:3000/api/hub?game=${gameID}`)
            wsRef.current = socket

            socket.onopen = () => {
                console.log('WebSocket connected')
            }

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    if (data.type === 'Notice') {
                        const message: GameNotice = data.message
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

                            toastNewNotice({
                                title: message.data[0],
                                time: new Date(message.create_time).getTime() / 1000,
                                openNotices: setNoticeOpened
                            })
                        }

                        if ([NoticeCategory.FirstBlood, NoticeCategory.SecondBlood, NoticeCategory.ThirdBlood].includes(message.notice_category) &&
                            gameInfo?.team_info?.team_name?.toString().trim() == message.data[0]?.toString().trim()) {
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
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error)
                }
            }

            socket.onerror = (error) => {
                console.error('WebSocket error:', error)
            }

            socket.onclose = () => {
                console.log('WebSocket disconnected')
            }

            return () => {
                if (wsRef.current) {
                    wsRef.current.close()
                }
            }

        } else if (gameStatus == "unRegistered") {
            // 未注册 先获取队伍信息
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

    const handleLaunchContainer = () => {
        setContainerLaunching(true)

        api.user.userCreateContainerForAChallenge(gameID, curChallenge?.challenge_id ?? 0).then((res) => {
            // 开始刷新靶机状态
            setRefreshContainerTrigger(true)
            // const leftTime = Math.floor(dayjs(res.data.close_time).diff(dayjs()) / 1000)
            // setContainerLeftTime(formatDuration(leftTime))
        })
    }

    const handleExtendContainer = () => {

        api.user.userExtendContainerLifeForAChallenge(gameID, curChallenge?.challenge_id ?? 0)
    }

    const handleDestoryContainer = () => {

        api.user.userDeleteContainerForAChallenge(gameID, curChallenge?.challenge_id ?? 0).then((res) => {
            setContainerRunningTrigger(false)

            const newContainers = containerInfo

            for (let i = 0; i < newContainers.length; i++) {
                newContainers[i].container_ports = []
            }

            setContainerInfo(newContainers)
            setContainerExpireTime(null)
        })
    }

    const handleCountdownFinish = () => {
        setContainerRunningTrigger(false)

        const newContainers = containerInfo

        for (let i = 0; i < newContainers.length; i++) {
            newContainers[i].container_ports = []
        }

        setContainerInfo(newContainers)
        setContainerExpireTime(null)
    }

    const memoizedDescription = useMemo(() => {
        return curChallenge?.description ? (
            <div className="flex flex-col gap-0">
                <Mdx source={curChallenge.description} />
            </div>
        ) : (
            <span>题目简介为空哦</span>
        );
    }, [curChallenge?.description]); // 只依赖description

    const fade = useSpring({
        opacity: pageSwitch ? 0 : 1,
        config: { tension: 320, friction: 50 },
        immediate: pageSwitch
    });

    return (
        <>
            <GameSwitchHover animation={false} />
            <LoadingPage visible={loadingVisiblity} />
            {/* 抢血动画 */}
            <SolvedAnimation blood={blood} setBlood={setBlood} bloodMessage={bloodMessage} />
            {/* 提交 Flag 组件 */}
            <SubmitFlagView lng={lng} curChallenge={curChallenge} gameID={gameID} setChallengeSolved={setChallengeSolved} challengeSolveStatusList={challengeSolveStatusList} visible={submitFlagWindowVisible} setVisible={setSubmitFlagWindowVisible} />

            {/* 比赛各种状态页 */}
            <>
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

                {["pending", "ended", "unRegistered", "waitForProcess", "unLogin"].includes(gameStatus) && (
                    <div className="absolute top-0 left-0 w-screen h-screen backdrop-blur-xl z-40">
                        <div className="flex w-full h-full relative">
                            <div className="w-full h-full hidden md:block">
                                <div className="w-full h-full flex flex-col overflow-hidden">
                                    <MacScrollbar className="h-full w-full"
                                        skin={theme == "light" ? "light" : "dark"}
                                        trackStyle={(horizontal) => ({ [horizontal ? "height" : "width"]: 0, borderWidth: 0 })}
                                    >
                                        <div className="pt-5 lg:pt-10">
                                            <span className="text-2xl font-bold px-8 select-none mb-4 text-nowrap overflow-hidden text-ellipsis">✨ 比赛须知 - {gameInfo?.name}</span>
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
                                            <div className="flex mt-2 items-center gap-4 pointer-events-auto">
                                                <Button variant="outline"
                                                    onClick={() => setScoreBoardVisible(true)}
                                                ><Presentation />{t("rank")}</Button>
                                                <TransitionLink className="transition-colors flex items-center" href={`/${lng}/games`}>
                                                    <Button>{t("back_to_main")}</Button>
                                                </TransitionLink>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {gameStatus == "unRegistered" && (
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
                                                <CreateTeamDialog updateTeam={() => { }} gameID={gameID}>
                                                    <Button variant="default" type="button"><Pickaxe />创建队伍</Button>
                                                </CreateTeamDialog>
                                                <JoinTeamDialog updateTeam={() => { }}>
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
                            <Info size={80} className="mb-4" />
                            <span className="text-2xl mb-4">{t("no_such_game")}</span>
                            <TransitionLink className="transition-colors" href={`/${lng}/games`}>
                                <Button variant="outline">{t("back_to_main")}</Button>
                            </TransitionLink>
                        </div>
                    </div>
                )}

            </>

            {/* 下载动画 */}
            <DownloadBar key={"download-panel"} progress={attachDownloadProgress} downloadName={downloadName}></DownloadBar>
            <ScoreBoardPage gmid={gameID} visible={scoreBoardVisible} setVisible={setScoreBoardVisible} gameStatus={gameStatus} gameInfo={gameInfo} challenges={challenges} />
            {/* 重定向警告页 */}
            <RedirectNotice redirectURL={redirectURL} setRedirectURL={setRedirectURL} />
            {/* 公告页 */}
            <NoticesView opened={noticesOpened} setOpened={setNoticeOpened} notices={notices} />

            {/* 题目侧栏和题目信息 */}
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
                        challengeSolveStatusList={challengeSolveStatusList}
                        setChallengeSolveStatusList={setChallengeSolveStatusList}
                        gameStatus={gameStatus}
                        setGameStatus={setGameStatus}
                    />
                </div>
                <div className="w-full h-screen relative">
                    {/* Suck Chrome's backdrop blur */}
                    <div className="absoulte h-full w-full top-0 left-0 backdrop-blur-sm" />
                    <div className="absolute h-full w-full top-0 left-0">
                        <div className="flex flex-col h-full w-full overflow-hidden relative">
                            <ChallengesViewHeader
                                gameStatus={gameStatus} gameInfo={gameInfo}
                                setNoticeOpened={setNoticeOpened} setScoreBoardVisible={setScoreBoardVisible}
                                notices={notices}
                                lng={lng}
                                curProfile={curProfile}
                            />
                            <ResizablePanelGroup direction="vertical" className="relative">
                                <AnimatePresence>
                                    {pageSwitch ? (
                                        <motion.div className="absolute top-0 left-0 w-full h-full z-20 flex justify-center items-center"
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
                                <ResizableScrollablePanel defaultSize={60} minSize={20} className={`relative ${pageSwitch ? "opacity-0" : ""} `} onResize={(size, prevSize) => {
                                    setResizeTrigger(size)
                                }}>
                                    {!curChallenge ? (
                                        <div className="absolute top-0 left-0 w-full h-full flex flex-col">
                                            {gameInfo?.description ? (
                                                <MacScrollbar
                                                    className="w-full flex flex-col"
                                                    skin={theme === "dark" ? "dark" : "light"}
                                                >
                                                    <div className="p-10">
                                                        <Mdx source={gameInfo.description || ""}></Mdx>
                                                    </div>
                                                </MacScrollbar>

                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center select-none">
                                                    <span className="font-bold text-lg">{t("choose_something")}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : <></>}
                                    {/* <div className="absolute bottom-2 right-2 flex flex-col gap-2 p-2 opacity-100 ease-in-out">
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
                                    </div> */}
                                    <div className="flex h-full">
                                        <SafeComponent>
                                            {curChallenge && challengeSolveStatusList && (
                                                <div className="absolute bottom-5 right-7 z-10">
                                                    {challengeSolveStatusList[curChallenge?.challenge_id ?? 0].solved ? (
                                                        <Button
                                                            className="h-[57px] px-5 rounded-3xl backdrop-blur-sm bg-green-600/70 hover:bg-green-800/70 [&_svg]:size-9 gap-2 flex items-center justify-center text-white disabled:opacity-100"
                                                            onClick={() => { }}
                                                        >
                                                            <CheckCheck />
                                                            <span className="font-bold text-xl">Solved!</span>
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            className="h-[57px] px-6 rounded-3xl backdrop-blur-sm bg-red-600/70 hover:bg-red-800/70 [&_svg]:size-8 gap-2 flex items-center justify-center text-white"
                                                            onClick={() => setSubmitFlagWindowVisible(true)}
                                                        >
                                                            <Flag className="rotate-12" />
                                                            <span className="font-bold text-xl">Submit!</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                            <MacScrollbar
                                                className="p-5 lg:p-10 w-full flex flex-col"
                                                skin={theme === "dark" ? "dark" : "light"}
                                            >
                                                {curChallenge?.challenge_name && (
                                                    <div className="flex flex-col gap-4 mb-4">
                                                        <ChallengeNameTitle challengeSolveStatusList={challengeSolveStatusList} curChallenge={curChallenge} />
                                                        {memoizedDescription}
                                                    </div>
                                                )}

                                                {curChallenge?.containers?.length ? (
                                                    <div className="flex flex-col gap-4 mb-8">
                                                        <div className={`flex items-center gap-2 px-5 py-[9px] border-2 rounded-xl bg-foreground/[0.04] backdrop-blur-md select-none`}>
                                                            <Package />
                                                            <span className="font-bold text-lg">靶机列表</span>
                                                            <div className="flex-1" />
                                                            {!containerRunningTrigger ? (
                                                                <div className="flex gap-2 items-center">
                                                                    <Button className="h-[34px] rounded-[10px] p-0 border-2 px-2 border-foreground bg-background hover:bg-foreground/20 [&_svg]:size-[24px] text-foreground"
                                                                        onClick={handleLaunchContainer}
                                                                        disabled={containerLaunching}
                                                                    >
                                                                        {containerLaunching ? (
                                                                            <>
                                                                                <Loader2 className="animate-spin" />
                                                                                <span className="font-bold text-[1.125em]">Launching</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <CirclePower />
                                                                                <span className="font-bold text-[1.125em]">Launch</span>
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex gap-2 items-center">
                                                                    <div className="h-[34px] rounded-[10px] border-2 border-green-500 px-2 text-green-500 items-center flex justify-center gap-2">
                                                                        <AlarmClock />
                                                                        <TimerDisplay target_time={containerExpireTime} onFinishCallback={handleCountdownFinish} className="font-bold text-md" />
                                                                    </div>
                                                                    <Button className="h-[34px] rounded-[10px] p-0 border-2 px-2 border-blue-400 text-blue-400 bg-background dark:hover:bg-blue-200/20 hover:bg-blue-200/60 [&_svg]:size-[24px]"
                                                                        onClick={handleExtendContainer}
                                                                    >
                                                                        <ClockArrowUp />
                                                                        <span className="font-bold text-[1.125em]">延长靶机</span>
                                                                    </Button>
                                                                    <Button className="h-[34px] rounded-[10px] p-0 border-2 px-2 border-red-400 text-red-400 bg-background dark:hover:bg-red-200/20 hover:bg-red-200/60 [&_svg]:size-[24px]"
                                                                        onClick={handleDestoryContainer}
                                                                    >
                                                                        <CircleX />
                                                                        <span className="font-bold text-[1.125em]">销毁</span>
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className={`flex flex-col gap-4 mt-4 select-none`}>
                                                            {containerInfo.map((container, i) => (
                                                                <div key={i} className="flex flex-col gap-[2px]">
                                                                    <span className="font-bold text-xl mb-2">{container.container_name}</span>
                                                                    <div className="flex gap-2 items-center">
                                                                        <Network />
                                                                        {container.container_ports?.length ? (
                                                                            <div className="flex gap-2">
                                                                                {container.container_ports.map((port, j) => (
                                                                                    <div key={j} className="flex gap-2 items-center">
                                                                                        <span className="text-sm font-bold">{port.port_name}:</span>
                                                                                        <div className="border-2 border-foreground px-2 rounded-md flex items-center justify-center hover:bg-foreground/30 transition-colors duration-300"
                                                                                            onClick={() => {
                                                                                                const status = copy(`${port.ip}:${port.port}`)
                                                                                                if (status) {
                                                                                                    toast.success(t("copied"), { position: "top-center" })
                                                                                                } else {
                                                                                                    toast.success(t("fail_copy"), { position: "top-center" })
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <span className="font-bold text-sm">{port.ip}:{port.port}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <span className="font-bold">等待启动</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : <></>}

                                                {curChallenge?.attachments?.length ? (
                                                    <div className="flex flex-col gap-2 mb-4">
                                                        <div className={`flex items-center gap-2 px-5 py-3 border-2 rounded-xl bg-foreground/[0.04] backdrop-blur-md `}>
                                                            <Paperclip />
                                                            <span className="font-bold text-lg">附件列表</span>
                                                        </div>
                                                        <div className="flex gap-6 mt-4 flex-col lg:flex-row">
                                                            {curChallenge?.attachments?.map((attach, attach_index) => (
                                                                <FileDownloader key={attach_index} attach={attach} setRedirectURL={setRedirectURL} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (<></>)}
                                            </MacScrollbar>
                                        </SafeComponent>
                                    </div>
                                </ResizableScrollablePanel>
                            </ResizablePanelGroup>
                        </div>
                    </div>
                </div>
            </SidebarProvider>
        </>
    )
}