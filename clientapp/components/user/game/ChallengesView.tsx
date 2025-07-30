import { SidebarProvider } from "components/ui/sidebar"
import { CategorySidebar } from "components/user/game/CategorySideBar";

import { toastNewNotice, toastNewHint } from "utils/ToastUtil";

import { Mdx } from "components/MdxCompoents";
import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";

import { api } from "utils/ApiHelper"
import { GameNotice, GameScoreboardData, NoticeCategory, ParticipationStatus, UserDetailGameChallenge, UserFullGameInfo, UserSimpleGameChallenge } from "utils/A1API"

import dayjs from "dayjs";
import { Loader2, Plus } from "lucide-react";
import { AxiosError } from "axios";

import { AnimatePresence, motion } from "framer-motion";
import { RedirectNotice } from "components/RedirectNotice";
import { NoticesView } from "components/NoticesView";

import { MacScrollbar } from 'mac-scrollbar';
import { useTheme } from "next-themes";

import { useGlobalVariableContext } from "contexts/GlobalVariableContext";

import { randomInt } from "mathjs";

import { SolvedAnimation } from "components/SolvedAnimation";
import ChallengesViewHeader from "components/modules/challenge/ChallengeViewHeader";
import SubmitFlagView from "components/modules/challenge/SubmitFlagView";

import GameStatusMask from "components/modules/game/GameStatusMask";
import ChallengeHintPage from "components/modules/challenge/ChallengeHintPage";
import { useTranslation } from "react-i18next";
import { useLocation, useSearchParams } from "react-router";
import ChallengeMainContent from "components/modules/challenge/ChallengeMainContent";
import LoadingModule from "components/modules/LoadingModule";
import GameTeamStatusCard from "components/modules/game/GameTeamStatusCard";
import { A1GameStatus } from "components/modules/game/GameStatusEnum";
import useConditionalState from "hooks/ContidionalState";
import AddChallengeFromLibraryDialog from "components/admin/game/AddChallengeFromLibraryDialog";
import { Button } from "components/ui/button";

export interface ChallengeSolveStatus {
    solved: boolean;
    solve_count: number;
    cur_score: number;
}

export function ChallengesView({
    id,
    gameInfo,
    gameStatus,
    setGameStatus,
    teamStatus,
    setTeamStatus,
    fetchGameInfoWithTeamInfo
}: {
    id: string,
    gameInfo: UserFullGameInfo | undefined,
    gameStatus: A1GameStatus,
    setGameStatus: Dispatch<SetStateAction<A1GameStatus | undefined>>,
    teamStatus: ParticipationStatus,
    setTeamStatus: Dispatch<SetStateAction<ParticipationStatus>>,
    fetchGameInfoWithTeamInfo: () => void
}) {

    const { t } = useTranslation()

    // 所有题目
    const [challenges, setChallenges] = useConditionalState<Record<string, UserSimpleGameChallenge[]>>({})

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

    // 加载动画
    const [loadingVisible, setLoadingVisibility] = useState(true)

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

    const { curProfile, isAdmin } = useGlobalVariableContext()


    const [beforeGameTime, setBeforeGameTime] = useState("")

    const checkInterStarted = useRef(false)

    const [blood, setBlood] = useState("")
    const [bloodMessage, setBloodMessage] = useState("")

    const gameID = parseInt(id, 10)

    const [submitFlagWindowVisible, setSubmitFlagWindowVisible] = useState(false)
    const [showHintsWindowVisible, setShowHintsWindowVisible] = useState(false)

    const wsRef = useRef<WebSocket | null>(null)
    const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected" | "ingore">("ingore")

    const [searchParams, setSearchParams] = useSearchParams()
    const location = useLocation()

    const challengeSearched = searchParams.get("id") ? true : false

    const [scoreBoardModel, setScoreBoardModel] = useConditionalState<GameScoreboardData | undefined>(undefined)

    useEffect(() => {
        const updateScoreBoard = () => {
            api.user.userGetGameScoreboard(gameID).then((res) => {
                setScoreBoardModel(res.data.data)
            })
        }

        updateScoreBoard()

        const updateScoreBoardInter = setInterval(updateScoreBoard, randomInt(2000, 4000))

        return () => {
            if (updateScoreBoardInter) clearInterval(updateScoreBoardInter)
        }
    }, [gameID])


    // 更新当前选中题目信息, 根据 Websocket 接收到的信息被动调用
    const updateChallenge = () => {
        if (!prevChallenge.current) return
        api.user.userGetGameChallenge(gameID, prevChallenge.current.challenge_id || 0).then((response) => {
            setCurChallenge(response.data.data || {})
        }).catch((error: AxiosError) => { })
    }

    const setChallengeSolved = (id: number) => {
        if (isAdmin()) {
            setChallengeSolveStatusList((prev) => ({
                ...prev,
                [id]: {
                    solved: true,
                    solve_count: (prev[id]?.solve_count ?? 0),
                    cur_score: prev[id]?.cur_score ?? 0,
                },
            }))
        } else {
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
    }

    useEffect(() => {
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

    const finishLoading = () => {
        // setTimeout(() => setLoadingVisibility(false), 200000)
        setLoadingVisibility(false)
    }

    useEffect(() => {
        // 根据比赛状态处理事件
        if (gameStatus == "running" || gameStatus == "practiceMode") {

            const challengeID = searchParams.get("id")
            if (challengeID) {
                const challengeIDInt = parseInt(challengeID, 10)
                api.user.userGetGameChallenge(gameID, challengeIDInt).then((response) => {
                    // console.log(response)
                    curChallengeDetail.current = response.data.data
                    setCurChallenge(response.data.data)
                    // setPageSwitch(true)

                    finishLoading()
                }).catch((error: AxiosError) => { })
            } else {
                finishLoading()
            }

            // 获取比赛通知
            api.user.userGetGameNotices(gameID).then((res) => {
                const filtedNotices: GameNotice[] = []
                let curIndex = 0

                res.data.data.sort((a, b) => (dayjs(b.create_time).unix() - dayjs(a.create_time).unix()))

                // 这里多次 forEach 是为了让公告优先在最上面
                res.data.data.forEach((obj) => {
                    if (obj.notice_category == NoticeCategory.NewAnnouncement) filtedNotices[curIndex++] = obj
                })

                res.data.data.forEach((obj) => {
                    if ([NoticeCategory.FirstBlood, NoticeCategory.SecondBlood, NoticeCategory.ThirdBlood, NoticeCategory.NewHint].includes(obj.notice_category)) filtedNotices[curIndex++] = obj
                })

                noticesRef.current = filtedNotices
                setNotices(filtedNotices)
            })

            // Websocket
            const baseURL = window.location.host
            let reconnectAttempts = 0
            const maxReconnectAttempts = 5
            const reconnectInterval = 3000 // 3秒重连间隔
            let reconnectTimer: NodeJS.Timeout | null = null
            let isManualClose = false

            const connectWebSocket = () => {
                // 显示连接中的toast
                const connectPromise = new Promise<void>((resolve, reject) => {
                    const socket = new WebSocket(`ws://${baseURL}/api/hub?game=${gameID}`)
                    wsRef.current = socket

                    setWsStatus("connecting")

                    const connectTimeout = setTimeout(() => {
                        socket.close()
                        reject(new Error('连接超时'))
                    }, 10000) // 10秒连接超时

                    socket.onopen = () => {
                        clearTimeout(connectTimeout)
                        setWsStatus("connected")
                        console.log('WebSocket connected')
                        reconnectAttempts = 0 // 重置重连次数
                        resolve()
                    }

                    socket.onmessage = (event) => {
                        try {
                            const data = JSON.parse(event.data)
                            console.log(data)
                            if (data.type === 'Notice') {
                                const message: GameNotice = data.message
                                console.log(message)

                                if (message.notice_category == NoticeCategory.NewHint) {
                                    // 将NewHint通知添加到通知列表
                                    const newNotices: GameNotice[] = []
                                    let insertIndex = 0

                                    // 先添加所有公告
                                    noticesRef.current.forEach((notice) => {
                                        if (notice.notice_category === NoticeCategory.NewAnnouncement) {
                                            newNotices[insertIndex++] = notice
                                        }
                                    })

                                    // 然后添加新的Hint通知
                                    newNotices[insertIndex++] = message

                                    // 最后添加其他通知
                                    noticesRef.current.forEach((notice) => {
                                        if (![NoticeCategory.NewAnnouncement].includes(notice.notice_category)) {
                                            newNotices[insertIndex++] = notice
                                        }
                                    })

                                    noticesRef.current = newNotices
                                    setNotices(newNotices)

                                    // 显示toast通知
                                    toastNewHint({
                                        challenges: message.data,
                                        time: dayjs(message.create_time).toDate().getTime() / 1000,
                                        openNotices: setNoticeOpened
                                    })
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
                                        time: dayjs(message.create_time).format("YYYY-MM-DD HH:mm:ss"),
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
                        clearTimeout(connectTimeout)
                        console.error('WebSocket error:', error)
                    }

                    socket.onclose = (event) => {
                        setWsStatus("disconnected")
                        clearTimeout(connectTimeout)

                        // 如果不是手动关闭且重连次数未达到上限，则尝试重连
                        if (!isManualClose && reconnectAttempts < maxReconnectAttempts) {
                            reconnectAttempts++

                            reconnectTimer = setTimeout(() => {
                                connectWebSocket()
                            }, reconnectInterval)
                        } else if (reconnectAttempts >= maxReconnectAttempts) {
                            // toast.error('WebSocket连接失败，请刷新页面重试')
                        }
                    }
                })

                return connectPromise
            }

            // 初始连接
            if ((gameStatus == A1GameStatus.Running || gameStatus == A1GameStatus.PracticeMode) && teamStatus == ParticipationStatus.Approved) {
                setWsStatus("disconnected")
                setTimeout(() => {
                    connectWebSocket()
                    console.log("Connect to websocket")
                }, 1000)
            } else {
                setWsStatus("ingore")
            }

            return () => {
                isManualClose = true // 标记为手动关闭

                if (reconnectTimer) {
                    clearTimeout(reconnectTimer)
                    reconnectTimer = null
                }

                if (wsRef.current) {
                    wsRef.current.close()
                }
            }

        } else if (teamStatus == ParticipationStatus.UnRegistered) {
            // 未注册 先获取队伍信息
            finishLoading()
        } else if (teamStatus == ParticipationStatus.Pending) {
            // 启动一个监听进程
            const refershTeamStatusInter = setInterval(() => {
                api.user.userGetGameInfoWithTeamInfo(gameID).then((res) => {
                    if (res.data.data.team_status == ParticipationStatus.Approved) {
                        if (dayjs() < dayjs(res.data.data.start_time)) {
                            // 等待比赛开始
                            setGameStatus(A1GameStatus.Pending)
                        } else if (dayjs() < dayjs(res.data.data.end_time)) {
                            // 比赛进行中
                            setGameStatus(A1GameStatus.Running)
                        } else if (dayjs() > dayjs(res.data.data.end_time)) {
                            setGameStatus(A1GameStatus.Ended)
                        }
                        // 结束监听
                        clearInterval(refershTeamStatusInter)
                    }
                })
            }, 2000)

            finishLoading()
        } else if (teamStatus == ParticipationStatus.Banned || gameStatus == A1GameStatus.Ended || gameStatus == A1GameStatus.NoSuchGame || teamStatus == ParticipationStatus.UnLogin) {
            finishLoading()
        } else if (gameStatus == A1GameStatus.Pending) {
            finishLoading()
            return () => {
                // if (penddingTimeInter) clearInterval(penddingTimeInter)
            }
        }
    }, [gameStatus])

    useEffect(() => {
        setAvatarURL(curProfile.avatar || "#")
        setUserName(curProfile.username || "")
    }, [curProfile])

    const startCheckForGameStart = () => {
        const checkGameStartedInter = setInterval(() => {
            api.user.userGetGameChallenges(gameID).then((res) => {
                clearInterval(checkGameStartedInter)

                // 防卡
                setTimeout(() => {
                    setGameStatus(A1GameStatus.Running)
                }, randomInt(1000, 2000))
            }).catch((error: AxiosError) => { })
        }, 2000)
    }

    // 为游戏描述创建 memo 化的 Mdx 组件
    const memoizedGameDescription = useMemo(() => {
        return gameInfo?.description ? (
            <div className="p-10">
                <Mdx source={gameInfo.description || ""} />
            </div>
        ) : null;
    }, [gameInfo?.description]); // 只依赖游戏描述

    useEffect(() => {
        if (curChallenge?.challenge_id) {
            setSearchParams({ id: curChallenge.challenge_id.toString() })
        }
    }, [curChallenge?.challenge_id])

    return (
        <>
            {/* <LoadingPage visible={loadingVisiblity} /> */}

            {/* <div className="absolute h-full w-full top-0 left-0 backdrop-blur-sm" /> */}

            {/* 抢血动画 */}
            <SolvedAnimation blood={blood} setBlood={setBlood} bloodMessage={bloodMessage} />
            {/* 提交 Flag 组件 */}
            <SubmitFlagView curChallenge={curChallenge} gameID={gameID} setChallengeSolved={setChallengeSolved} challengeSolveStatusList={challengeSolveStatusList} visible={submitFlagWindowVisible} setVisible={setSubmitFlagWindowVisible} />

            {/* Hint 列表 */}
            <ChallengeHintPage curChallenge={curChallenge} visible={showHintsWindowVisible} setVisible={setShowHintsWindowVisible} />

            {/* 比赛各种状态页 */}
            <GameStatusMask
                gameStatus={gameStatus}
                teamStatus={teamStatus}
            />

            {/* 重定向警告页 */}
            <RedirectNotice redirectURL={redirectURL} setRedirectURL={setRedirectURL} />
            {/* 公告页 */}
            <NoticesView opened={noticesOpened} setOpened={setNoticeOpened} notices={notices} />

            {/* 题目侧栏和题目信息 */}
            <SidebarProvider>
                <CategorySidebar
                    gameid={id}
                    curChallenge={curChallenge}
                    setCurChallenge={setCurChallenge}
                    // setGameDetail={setGameDeatail}
                    curChallengeRef={curChallengeDetail}
                    resizeTrigger={setResizeTrigger}
                    setPageSwitching={setPageSwitch}
                    challenges={challenges || {}}
                    setChallenges={setChallenges}
                    challengeSolveStatusList={challengeSolveStatusList}
                    setChallengeSolveStatusList={setChallengeSolveStatusList}
                    gameStatus={gameStatus}
                    setGameStatus={setGameStatus}
                    teamStatus={teamStatus}
                    setTeamStatus={setTeamStatus}
                    loadingVisible={loadingVisible}
                    gameInfo={gameInfo}
                />
                <div className="w-full h-screen relative">
                    <div className="absolute h-full w-full top-0 left-0">
                        <div className="flex flex-col h-full w-full overflow-hidden relative">
                            <ChallengesViewHeader
                                wsStatus={wsStatus}
                                gameStatus={gameStatus} gameInfo={gameInfo}
                                setNoticeOpened={setNoticeOpened} setScoreBoardVisible={setScoreBoardVisible}
                                notices={notices}
                                curProfile={curProfile}
                                loadingVisible={loadingVisible}
                            />
                            <div className="relative overflow-hidden h-full">
                                <AnimatePresence>
                                    {pageSwitch ? (
                                        <motion.div className="absolute top-0 left-0 w-full h-full z-20 flex justify-center items-center"
                                            exit={{
                                                opacity: 0
                                            }}
                                        >
                                            <div className="flex">
                                                <Loader2 className="animate-spin" />
                                                <span className="font-bold ml-3">Loading...</span>
                                            </div>
                                        </motion.div>
                                    ) : (null)}
                                </AnimatePresence>
                                <div className="absolute bottom-0 right-0 z-10 pr-7 pb-5">
                                    <GameTeamStatusCard
                                        gameInfo={gameInfo}
                                        scoreBoardModel={scoreBoardModel}
                                        teamStatus={teamStatus}
                                    />
                                </div>
                                {!challengeSearched && !loadingVisible ? (
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
                                ) : (
                                    !loadingVisible && curChallenge ? (
                                        <>
                                            {!pageSwitch ? (
                                                <ChallengeMainContent
                                                    gameID={gameID}
                                                    curChallenge={curChallenge}
                                                    setChallenges={setChallenges}
                                                    setCurChallenge={setCurChallenge}
                                                    challengeSolveStatusList={challengeSolveStatusList}
                                                    setSubmitFlagWindowVisible={setSubmitFlagWindowVisible}
                                                    gameInfo={gameInfo}
                                                    setShowHintsWindowVisible={setShowHintsWindowVisible}
                                                    setRedirectURL={setRedirectURL}
                                                    scoreBoardModel={scoreBoardModel}
                                                />
                                            ) : (
                                                <></>
                                            )}
                                        </>
                                    ) : (
                                        <LoadingModule />
                                    )
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            </SidebarProvider>
        </>
    )
}