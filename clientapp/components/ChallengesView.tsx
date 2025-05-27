import { SidebarProvider } from "components/ui/sidebar"
import { CategorySidebar } from "components/CategorySideBar";

import { toastNewNotice } from "utils/ToastUtil";


import {
    ResizablePanelGroup,
} from "components/ui/resizable"


import { ResizableScrollablePanel } from "components/ResizableScrollablePanel"

import { Mdx } from "./MdxCompoents";
import { useEffect, useMemo, useRef, useState } from "react";

import { api } from "utils/ApiHelper"
import { ContainerStatus, ErrorMessage, ExposePortInfo, GameNotice, GameScoreboardData, NoticeCategory, ParticipationStatus, UserDetailGameChallenge, UserFullGameInfo, UserSimpleGameChallenge } from "utils/A1API"



import dayjs from "dayjs";
import { LoadingPage } from "./LoadingPage";
import { Button } from "./ui/button";
import { AlarmClock, AudioWaveform, ChartNoAxesColumn, ChartNoAxesCombined, CheckCheck, CirclePower, CircleX, ClockArrowUp, Flag, Loader2, LoaderPinwheel, Network, Package, Paperclip } from "lucide-react";
import { AxiosError } from "axios";

import { AnimatePresence, motion } from "framer-motion";
import { DownloadBar } from "./DownloadBar";
import { RedirectNotice } from "./RedirectNotice";
import { NoticesView } from "./NoticesView";
import SafeComponent from "./SafeComponent";

import { MacScrollbar } from 'mac-scrollbar';
import { useTheme } from "next-themes";

import { useGameSwitchContext } from "contexts/GameSwitchContext";
import GameSwitchHover from "./GameSwitchHover";
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";
import ScoreBoardPage from "./ScoreBoardPage";

import { randomInt, re } from "mathjs";

import { toast } from "sonner";
import copy from "copy-to-clipboard";
import { SolvedAnimation } from "./SolvedAnimation";
import { useCookies } from "react-cookie";
import TimerDisplay from "./modules/TimerDisplay";
import ChallengesViewHeader from "components/modules/challenge/ChallengeViewHeader";
import SubmitFlagView from "components/modules/challenge/SubmitFlagView";
import FileDownloader from "components/modules/challenge/FileDownloader";
import ChallengeNameTitle from "components/modules/challenge/ChallengeNameTitle";

import { useSpring } from "@react-spring/web";
import GameStatusMask from "components/modules/game/GameStatusMask";
import ChallengeHintPage from "./modules/challenge/ChallengeHintPage";
import { useTranslation } from "react-i18next";

export interface ChallengeSolveStatus {
    solved: boolean;
    solve_count: number;
    cur_score: number;
}

export function ChallengesView({ id }: { id: string }) {

    const { t } = useTranslation()

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

    // 页面切换动画
    const [pageSwitch, setPageSwitch] = useState(false)

    // 题目是否解决
    const [challengeSolveStatusList, setChallengeSolveStatusList] = useState<Record<number, ChallengeSolveStatus>>({});

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

    const [containerLaunching, setContainerLaunching] = useState(false)

    const [containerInfo, setContainerInfo] = useState<ExposePortInfo[]>([])
    const [containerRunningTrigger, setContainerRunningTrigger] = useState(false);
    const [refreshContainerTrigger, setRefreshContainerTrigger] = useState(false);
    const [containerExpireTime, setContainerExpireTime] = useState<dayjs.Dayjs | null>(dayjs())

    const [blood, setBlood] = useState("")
    const [bloodMessage, setBloodMessage] = useState("")

    const gameID = parseInt(id, 10)

    const [cookies, setCookie, removeCookie] = useCookies(["uid"])

    const [submitFlagWindowVisible, setSubmitFlagWindowVisible] = useState(false)
    const [showHintsWindowVisible, setShowHintsWindowVisible] = useState(false)

    const wsRef = useRef<WebSocket | null>(null)

    const [scoreBoardModel, setScoreBoardModel] = useState<GameScoreboardData | undefined>(undefined)


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

                        toast.success(t("container_start_success"))

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
                    toast.error("靶机开启失败")
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

    useEffect(() => {

        // 获取比赛信息以及剩余时间
        api.user.userGetGameInfoWithTeamInfo(gameID).then((res) => {
            setGameInfo(res.data.data)

            // 第一步 检查是否报名
            if (dayjs() > dayjs(res.data.data.end_time) && !res.data.data.practice_mode) {
                setGameStatus("ended")
            } else {
                if (res.data.data.team_status == ParticipationStatus.UnLogin) {
                    // 未登录
                    setGameStatus("unLogin")
                } else if (res.data.data.team_status == ParticipationStatus.UnRegistered) {
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
                                    setBloodMessage(`${t("notices_view.congratulations")}${t("notices_view.blood_message_p1")} ${message.data[1]} ${t("notices_view.blood1")}`)
                                    setBlood("gold")
                                    break
                                case NoticeCategory.SecondBlood:
                                    setBloodMessage(`${t("notices_view.congratulations")}${t("notices_view.blood_message_p1")} ${message.data[1]} ${t("notices_view.blood2")}`)
                                    setBlood("silver")
                                    break
                                case NoticeCategory.ThirdBlood:
                                    setBloodMessage(`${t("notices_view.congratulations")}${t("notices_view.blood_message_p1")} ${message.data[1]} ${t("notices_view.blood3")}`)
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
            setTimeout(() => setLoadingVisibility(false), 500)
            return () => {
                // if (penddingTimeInter) clearInterval(penddingTimeInter)
            }
        }
    }, [gameStatus])

    useEffect(() => {
        setAvatarURL(curProfile.avatar || "#")
        setUserName(curProfile.username || "")
    }, [curProfile])

    useEffect(() => {
        if (!loadingVisiblity) {
            setTimeout(() => {
                setIsChangingGame(false)
            }, 500)
        }
    }, [loadingVisiblity])

    const startCheckForGameStart = () => {
        const checkGameStartedInter = setInterval(() => {
            api.user.userGetGameChallenges(gameID).then((res) => {
                clearInterval(checkGameStartedInter)

                // 防卡
                setTimeout(() => {
                    setGameStatus("running")
                }, randomInt(1000, 2000))
            }).catch((error: AxiosError) => { })
        }, 2000)
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

    // 为游戏描述创建 memo 化的 Mdx 组件
    const memoizedGameDescription = useMemo(() => {
        return gameInfo?.description ? (
            <div className="p-10">
                <Mdx source={gameInfo.description || ""} />
            </div>
        ) : null;
    }, [gameInfo?.description]); // 只依赖游戏描述

    const fade = useSpring({
        opacity: pageSwitch ? 0 : 1,
        config: { tension: 320, friction: 50 },
        immediate: pageSwitch
    });

    const rankColor = (rank: number) => {
        if (rank == 1) return "text-red-400 font-bold"
        else if (rank == 2) return "text-green-400 font-bold"
        else if (rank == 3) return "text-blue-400 font-bold"
        else return ""
    }

    return (
        <>
            <GameSwitchHover animation={false} />
            <LoadingPage visible={loadingVisiblity} />

            {/* 抢血动画 */}
            <SolvedAnimation blood={blood} setBlood={setBlood} bloodMessage={bloodMessage} />
            {/* 提交 Flag 组件 */}
            <SubmitFlagView curChallenge={curChallenge} gameID={gameID} setChallengeSolved={setChallengeSolved} challengeSolveStatusList={challengeSolveStatusList} visible={submitFlagWindowVisible} setVisible={setSubmitFlagWindowVisible} />

            {/* Hint 列表 */}
            <ChallengeHintPage curChallenge={curChallenge} visible={showHintsWindowVisible} setVisible={setShowHintsWindowVisible} />

            {/* 比赛各种状态页 */}
            <GameStatusMask
                gameStatus={gameStatus}
                gameID={gameID}
                gameInfo={gameInfo}
                setScoreBoardVisible={setScoreBoardVisible}
                startCheckForGameStart={startCheckForGameStart}
            />

            {/* 记分板 */}
            <ScoreBoardPage 
                gmid={gameID} 
                visible={scoreBoardVisible} 
                setVisible={setScoreBoardVisible} 
                gameStatus={gameStatus} 
                gameInfo={gameInfo} 
                challenges={challenges} 
                scoreBoardModel={scoreBoardModel} setScoreBoardModel={setScoreBoardModel}
            />
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
                                                    {memoizedGameDescription}
                                                </MacScrollbar>

                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center select-none">
                                                    <span className="font-bold text-lg">{t("choose_something")}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : <></>}
                                    <div className="flex h-full">
                                        <SafeComponent>
                                            <div className="absolute bottom-5 right-7 z-10 flex justify-end flex-col gap-[8px]">
                                                <div className="flex">
                                                    <div className="flex-1" />
                                                    {curChallenge && challengeSolveStatusList ? challengeSolveStatusList[curChallenge?.challenge_id ?? 0].solved ? (
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
                                                        ) : (<></>)
                                                    }
                                                </div>
                                                <div className="flex px-5 py-2 flex-col gap-2 backdrop-blur-md rounded-2xl select-none border-2 shadow-xl shadow-foreground/5">
                                                    <div className="flex gap-2 items-center">
                                                        <AudioWaveform className="size-5" />
                                                        <span>{ gameInfo?.team_info?.team_name }</span>
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <div className="flex gap-2 items-center">
                                                            <Flag className="size-5" />
                                                            <span>{ scoreBoardModel != undefined ? (scoreBoardModel?.your_team?.score) : (gameInfo?.team_info?.team_score ?? 0) } pts</span>
                                                        </div>
                                                        <div className={`flex gap-2 items-center transition-colors duration-300 ${rankColor(scoreBoardModel != undefined ? (scoreBoardModel?.your_team?.rank ?? 0) : (gameInfo?.team_info?.rank ?? 0))}`}>
                                                            <ChartNoAxesCombined className="size-5" />
                                                            <span>Rank { scoreBoardModel != undefined ? (scoreBoardModel?.your_team?.rank ?? 0) : (gameInfo?.team_info?.rank ?? 0) }</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div> 
                                            <MacScrollbar
                                                className="p-5 lg:p-10 w-full flex flex-col"
                                                skin={theme === "dark" ? "dark" : "light"}
                                            >
                                                {curChallenge?.challenge_name && (
                                                    <div className="flex flex-col gap-4 mb-4">
                                                        <ChallengeNameTitle challengeSolveStatusList={challengeSolveStatusList} curChallenge={curChallenge} setShowHintsWindowVisible={setShowHintsWindowVisible} />
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
                                                                                                    toast.success(t("copied"))
                                                                                                } else {
                                                                                                    toast.success(t("fail_copy"))
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