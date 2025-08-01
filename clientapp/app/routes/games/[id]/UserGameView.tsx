import { A1LogoWithoutAnimation } from "components/A1LogoWithoutAnimation";

import { ChallengesView } from 'components/user/game/ChallengesView';
import MyTeamInfomationView from "components/user/game/MyTeamInfomationView";
import ScoreBoardPage from "components/user/game/ScoreBoardPage";
import GameViewSidebar from "components/user/game/GameViewSidebar";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { ErrorMessage, ParticipationStatus, UserFullGameInfo } from "utils/A1API";
import dayjs from "dayjs";
import { api, createSkipGlobalErrorConfig } from "utils/ApiHelper";
import { parse } from "path";
import { AxiosError } from "axios";
import GameCountDowner from "components/modules/game/GameCountDowner";
import GameInfoView from "components/user/game/GameInfoView";
import { useGameSwitchContext } from "contexts/GameSwitchContext";
import { LoadingPage } from "components/LoadingPage";
import { Panda } from "lucide-react";
import { A1GameStatus } from "components/modules/game/GameStatusEnum";
import useConditionalState from "hooks/ContidionalState";
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";

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
    const [gameInfo, setGameInfo] = useConditionalState<UserFullGameInfo>()
    const [gameStatus, setGameStatus] = useConditionalState<A1GameStatus | undefined>(undefined)
    const [teamStatus, setTeamStatus] = useState<ParticipationStatus>(ParticipationStatus.UnLogin)

    const [curChoicedModule, setCurChoicedModule] = useState(module || "info")

    // 切换比赛动画
    const { isChangingGame, setIsChangingGame } = useGameSwitchContext();

    const { isAdmin } = useGlobalVariableContext()

    let updateGameInterval: NodeJS.Timeout | undefined = undefined

    const fetchGameInfoWithTeamInfo = () => {
        api.user.userGetGameInfoWithTeamInfo(gameID).then((res) => {
            setGameInfo(res.data.data)

            // 先设置队伍状态
            setTeamStatus(res.data.data.team_status)

            // 检查比赛状态
            if (dayjs() < dayjs(res.data.data.start_time)) {
                // 等待比赛开始
                setGameStatus(A1GameStatus.Pending)
            } else if (dayjs() < dayjs(res.data.data.end_time)) {
                // 比赛进行中
                setGameStatus(A1GameStatus.Running)
            } else if (dayjs() > dayjs(res.data.data.end_time)) {
                if (!res.data.data.practice_mode) {
                    // 比赛已结束，非练习模式
                    setGameStatus(A1GameStatus.Ended)
                } else {
                    // 练习模式
                    setGameStatus(A1GameStatus.PracticeMode)
                }
            }
        }, createSkipGlobalErrorConfig()).catch((error: AxiosError) => {
            clearInterval(updateGameInterval)
            if (error.response?.status) {
                const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                if (error.response.status == 401) {
                    setTeamStatus(ParticipationStatus.UnLogin)
                } else if (error.response.status == 404) {
                    setGameStatus(A1GameStatus.NoSuchGame)
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


    if (gameStatus == A1GameStatus.NoSuchGame) {
        return (
            <div className="w-screen h-screen flex items-center justify-center gap-6 select-none">
                <Panda size={64} />
                <span className="text-4xl font-bold">没有该比赛</span>
            </div>
        )
    }

    if (!gameInfo || gameStatus == undefined) {
        return <></>
    }

    return (
        <div className="p-0 h-screen relative"> 
            <div className="flex w-full h-full">
                <GameViewSidebar 
                    curChoicedModule={curChoicedModule} 
                    gameID={id}
                    gameInfo={gameInfo}
                    gameStatus={gameStatus}
                    teamStatus={teamStatus}
                />
                <div className="flex-1 h-full overflow-hidden">
                    { curChoicedModule == "challenges" ? ( 
                        [A1GameStatus.Running, A1GameStatus.PracticeMode].includes(gameStatus) || teamStatus == ParticipationStatus.Banned || isAdmin() ? (
                            <ChallengesView 
                                id={id} 
                                gameInfo={gameInfo} 
                                gameStatus={gameStatus} 
                                setGameStatus={setGameStatus} 
                                teamStatus={teamStatus}
                                setTeamStatus={setTeamStatus}
                                fetchGameInfoWithTeamInfo={fetchGameInfoWithTeamInfo}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-2xl font-bold">比赛未开始</span>
                            </div>
                        )
                    ) : <></> }

                    { curChoicedModule == "scoreboard" ? ( 
                        [A1GameStatus.Running, A1GameStatus.PracticeMode, A1GameStatus.Ended].includes(gameStatus) || teamStatus == ParticipationStatus.UnLogin || teamStatus == ParticipationStatus.Banned ? (
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
                            gameInfo={gameInfo}
                            gameStatus={gameStatus}
                        />
                    ) }

                    { curChoicedModule == "info" && (
                        <GameInfoView 
                            gameInfo={gameInfo} 
                            gameStatus={gameStatus} 
                            teamStatus={teamStatus}
                        />
                    ) }
                </div>
            </div>
        </div>
    );
}
