import { Mdx } from "components/MdxCompoents";
import ImageLoader from "components/modules/ImageLoader";
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";
import { Captions, LibraryBig, QrCode } from "lucide-react";
import { MacScrollbar } from "mac-scrollbar";
import { useMemo } from "react";
import { ParticipationStatus, UserFullGameInfo } from "utils/A1API";
import GamePosterInfoModule from "./GamePosterInfoModule";
import GameTeamStatusCard, { LoginFirstCard } from "components/modules/game/GameTeamStatusCard";
import { A1GameStatus } from "components/modules/game/GameStatusEnum";
import { useTheme } from "next-themes";

export default function GameInfoView(
    {
        gameInfo,
        gameStatus,
        teamStatus
    }: {
        gameInfo: UserFullGameInfo | undefined,
        gameStatus: A1GameStatus
        teamStatus: ParticipationStatus
    }
) {

    const memoizedGameDescription = useMemo(() => {
        return gameInfo?.description ? (
            <Mdx source={gameInfo.description || ""} />
        ) : null;
    }, [gameInfo?.description]);

    const { clientConfig, checkLoginStatus } = useGlobalVariableContext()

    const { theme } = useTheme()

    return (
        <div className="w-full h-full">
            <MacScrollbar className="w-full h-full"
                skin={theme == "light" ? "light" : "dark"}
            >
                <div className="px-10 flex">
                    <div className="lg:w-[60%] w-full h-full py-10 pr-5 flex flex-col">
                        <div className="lg:hidden w-full aspect-video mb-10">
                            <GamePosterInfoModule
                                gameInfo={gameInfo}
                                gameStatus={gameStatus}
                                teamStatus={teamStatus}
                            />
                        </div>
                        <div className="flex gap-2 items-center mb-2 border-b-2 pb-4 select-none">
                            <LibraryBig />
                            <span className="text-2xl font-bold">比赛介绍</span>
                            <div className="flex-1" />
                            <QrCode />
                        </div>
                        {gameInfo?.description ? memoizedGameDescription : (
                            <div className="w-full h-[60vh] flex items-center justify-center select-none">
                                <span className="font-bold text-lg">Emmmmmm</span>
                            </div>
                        )}
                    </div>
                    <div className="lg:w-[40%] hidden lg:block h-full flex-none">
                        <div className="absolute p-5 pt-10 pr-8 pointer-events-none">
                            <GamePosterInfoModule
                                gameInfo={gameInfo}
                                gameStatus={gameStatus}
                                teamStatus={teamStatus}
                            />
                        </div>
                    </div>
                </div>
            </MacScrollbar >
            {checkLoginStatus() ? (
                <div className="absolute bottom-5 right-7 z-10 flex justify-end flex-col gap-[8px]">
                    <GameTeamStatusCard
                        gameInfo={gameInfo}
                        scoreBoardModel={undefined}
                        teamStatus={teamStatus}
                    />
                </div>
            ) : (
                <div className="absolute bottom-5 right-0 z-10 flex justify-end flex-col gap-[8px]">
                    <LoginFirstCard />
                </div>
            )}
        </div >
    )
}