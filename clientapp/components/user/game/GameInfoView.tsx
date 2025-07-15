import { Mdx } from "components/MdxCompoents";
import ImageLoader from "components/modules/ImageLoader";
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";
import { Captions, LibraryBig, QrCode } from "lucide-react";
import { MacScrollbar } from "mac-scrollbar";
import { useMemo } from "react";
import { UserFullGameInfo } from "utils/A1API";
import GamePosterInfoModule from "./GamePosterInfoModule";
import GameTeamStatusCard from "components/modules/game/GameTeamStatusCard";

export default function GameInfoView(
    {
        gameInfo,
        gameStatus
    }: {
        gameInfo: UserFullGameInfo | undefined,
        gameStatus: string
    }
) {

    const memoizedGameDescription = useMemo(() => {
        return gameInfo?.description ? (
            <Mdx source={gameInfo.description || ""} />
        ) : null;
    }, [gameInfo?.description]);

    const { clientConfig } = useGlobalVariableContext()

    return (
        <div className="w-full h-full">
            <MacScrollbar className="w-full h-full">
                <div className="px-10 flex">
                    <div className="lg:w-[60%] w-full h-full py-10 pr-5 flex flex-col">
                        <div className="lg:hidden w-full aspect-video mb-10">
                            <GamePosterInfoModule
                                gameInfo={gameInfo}
                                gameStatus={gameStatus}
                            />
                        </div>
                        <div className="flex gap-2 items-center mb-2 border-b-2 pb-4 select-none">
                            <LibraryBig />
                            <span className="text-2xl font-bold">比赛介绍</span>
                            <div className="flex-1" />
                            <QrCode />
                        </div>
                        {memoizedGameDescription}
                    </div>
                    <div className="lg:w-[40%] hidden lg:block h-full flex-none">
                        <div className="absolute p-5 pt-10 pr-8 pointer-events-none">
                            <GamePosterInfoModule
                                gameInfo={gameInfo}
                                gameStatus={gameStatus}
                            />
                        </div>
                    </div>
                </div>
            </MacScrollbar >
            { ["running", "ended"].includes(gameStatus) && (
                <div className="absolute bottom-5 right-7 z-10 flex justify-end flex-col gap-[8px]">
                    <GameTeamStatusCard 
                        gameInfo={gameInfo}
                        scoreBoardModel={undefined}
                    />
                </div>
            ) }
        </div >
    )
}