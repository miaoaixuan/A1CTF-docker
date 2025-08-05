import { A1LogoWithoutAnimation } from "components/A1LogoWithoutAnimation";

import { ChallengesView } from 'components/user/game/ChallengesView';
import MyTeamInfomationView from "components/user/game/MyTeamInfomationView";
import ScoreBoardPage from "components/user/game/ScoreBoardPage";
import GameViewSidebar from "components/user/game/GameViewSidebar";
import { Suspense, useEffect, useState } from "react";
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
import { randomInt } from "mathjs";
import { useGame } from "hooks/UseGame";

export default function Games() {
    
    const { id } = useParams();
    const { module } = useParams()

    if (!id) {
        return <div>404</div>
    }

    const gameID = parseInt(id, 10)

    const { gameStatus, isLoading } = useGame(gameID)

    useEffect(() => {
        setCurChoicedModule(module || "info")
    }, [module])

    const [curChoicedModule, setCurChoicedModule] = useState(module || "info")

    // 切换比赛动画
    const { setIsChangingGame } = useGameSwitchContext();

    let updateGameInterval: NodeJS.Timeout | undefined = undefined


    useEffect(() => {
        setTimeout(() => {
            setIsChangingGame(false)
        }, 500)

        return () => {
            clearInterval(updateGameInterval)
        }
    }, [])

    if (isLoading) return <></>

    if (gameStatus == A1GameStatus.NoSuchGame) {
        return (
            <div className="w-screen h-screen flex items-center justify-center gap-6 select-none">
                <Panda size={64} />
                <span className="text-4xl font-bold">没有该比赛</span>
            </div>
        )
    }

    return (
        <div className="p-0 h-screen relative"> 
            <div className="flex w-full h-full">
                <GameViewSidebar 
                    curChoicedModule={curChoicedModule} 
                    gameID={gameID}
                />
                <div className="flex-1 h-full overflow-hidden">
                    { curChoicedModule == "challenges" ? ( 
                        <ChallengesView 
                            gameID={gameID}
                        />
                    ) : <></> }

                    { curChoicedModule == "scoreboard" ? ( 
                        <div className="relative w-full h-full">
                            <ScoreBoardPage gmid={parseInt(id)} />
                        </div>
                    ) : <></> }

                    { curChoicedModule == "team" && (
                        <MyTeamInfomationView 
                            gameID={gameID} 
                        />
                    ) }

                    { curChoicedModule == "info" && (
                        <GameInfoView 
                            gameID={gameID}
                        />
                    ) }
                </div>
            </div>
        </div>
    );
}
