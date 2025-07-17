import { A1LogoWithoutAnimation } from "components/A1LogoWithoutAnimation";

import { ChallengesView } from 'components/user/game/ChallengesView';
import MyTeamInfomationView from "components/user/game/MyTeamInfomationView";
import ScoreBoardPage from "components/user/game/ScoreBoardPage";
import GameViewSidebar from "components/user/game/GameViewSidebar";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { ErrorMessage, ParticipationStatus, UserFullGameInfo } from "utils/A1API";
import dayjs from "dayjs";
import { api } from "utils/ApiHelper";
import { parse } from "path";
import { AxiosError } from "axios";
import GameCountDowner from "components/modules/game/GameCountDowner";
import GameInfoView from "components/user/game/GameInfoView";
import { useGameSwitchContext } from "contexts/GameSwitchContext";
import { LoadingPage } from "components/LoadingPage";
import { Panda } from "lucide-react";

export default function Games() {
    
    const { id } = useParams();
    const { module } = useParams()

    if (!id) {
        return <div>404</div>
    }

    const gameID = parseInt(id, 10)

    useEffect(() => {
        setCurChoicedModule(module || "info")
    }, [module])

    // 比赛详细信息
    const [gameInfo, setGameInfo] = useState<UserFullGameInfo>()
    const [gameStatus, setGameStatus] = useState("")

    const [curChoicedModule, setCurChoicedModule] = useState(module || "info")

    // 切换比赛动画
    const { isChangingGame, setIsChangingGame } = useGameSwitchContext();

    let updateGameInterval: NodeJS.Timeout | undefined = undefined

    const fetchGameInfoWithTeamInfo = () => {
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
            clearInterval(updateGameInterval)
            if (error.response?.status) {
                const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                if (error.response.status == 401) {
                    setGameStatus("unLogin")
                } else if (error.response.status == 404) {
                    setGameStatus("noSuchGame")
                }
            }
        })
    }

    useEffect(() => {
        fetchGameInfoWithTeamInfo()
        updateGameInterval = setInterval(fetchGameInfoWithTeamInfo, 2000)

        setTimeout(() => {
            setIsChangingGame(false)
        }, 500)

        return () => {
            clearInterval(updateGameInterval)
        }
    }, [])


    if (gameStatus == "noSuchGame") {
        return (
            <div className="w-screen h-screen flex items-center justify-center gap-6 select-none">
                <Panda size={64} />
                <span className="text-4xl font-bold">没有该比赛</span>
            </div>
        )
    }

    if (!gameInfo || gameStatus == "") {
        return <></>
    }

    return (
        <div className="p-0 h-screen relative">
            <div className="absolute top-0 left-0 w-screen h-screen z-[-19] overflow-hidden">
                <div className="w-[400px] h-[400px] absolute bottom-[-120px] right-[-120px] rotate-[-20deg]">
                    <A1LogoWithoutAnimation />
                </div>
            </div>
            <div className="flex w-full h-full">
                <GameViewSidebar 
                    curChoicedModule={curChoicedModule} 
                    gameID={id}
                    gameInfo={gameInfo}
                    gameStatus={gameStatus}
                />
                <div className="flex-1 h-full overflow-hidden">
                    { curChoicedModule == "challenges" ? ( 
                        ["running", "practiceMode", "banned"].includes(gameStatus) ? (
                            <ChallengesView 
                                id={id} 
                                gameInfo={gameInfo} 
                                gameStatus={gameStatus} 
                                setGameStatus={setGameStatus} 
                                fetchGameInfoWithTeamInfo={fetchGameInfoWithTeamInfo}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-2xl font-bold">比赛未开始</span>
                            </div>
                        )
                    ) : <></> }

                    { curChoicedModule == "scoreboard" ? ( 
                        ["running", "practiceMode", "ended", "banned", "unLogin"].includes(gameStatus) ? (
                            <div className="relative w-full h-full">
                                <ScoreBoardPage gmid={parseInt(id)} />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-2xl font-bold">比赛未开始</span>
                            </div>
                        )
                    ) : <></> }

                    { curChoicedModule == "team" && (
                        <MyTeamInfomationView 
                            gameid={parseInt(id)} 
                        />
                    ) }

                    { curChoicedModule == "info" && (
                        <GameInfoView 
                            gameInfo={gameInfo} 
                            gameStatus={gameStatus} 
                        />
                    ) }
                </div>
            </div>
        </div>
    );
}
