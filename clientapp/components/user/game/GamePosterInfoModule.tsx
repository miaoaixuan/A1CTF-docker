import { A1GameStatus } from "components/modules/game/GameStatusEnum";
import ImageLoader from "components/modules/ImageLoader";
import TimerDisplay from "components/modules/TimerDisplay";
import { Button } from "components/ui/button";
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";
import dayjs from "dayjs";
import { useNavigateFrom } from "hooks/NavigateFrom";
import { Album, CalendarArrowDown, CalendarArrowUp, CirclePlay, ClockAlert, Dumbbell, Hourglass, IdCard, Key, Lock, Package, PencilLine, Pickaxe, ScanFace, ScanText, Users, UsersRound } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { FastAverageColor } from "fast-average-color";
import { ParticipationStatus, UserFullGameInfo } from "utils/A1API";

export default function GamePosterInfoModule(
    {
        gameInfo,
        gameStatus,
        teamStatus
    }: {
        gameInfo: UserFullGameInfo | undefined,
        gameStatus: A1GameStatus,
        teamStatus: ParticipationStatus
    }
) {

    const { clientConfig } = useGlobalVariableContext()
    const { theme } = useTheme()

    const [posterTextPrimaryColor, setPosterTextPrimaryColor] = useState("white")

    const getGameIcon = () => {
        if (theme === "dark") {
            return gameInfo?.game_icon_dark ?? clientConfig.SVGIcon
        } else {
            return gameInfo?.game_icon_light ?? clientConfig.SVGIcon
        }
    }

    const [navigateFrom, getNavigateFrom] = useNavigateFrom()

    const gameStatusElement = {
        "ended": (
            <div className="flex gap-4 items-center">
                <ClockAlert size={36} />
                <span className="text-2xl font-bold">比赛已结束</span>
            </div>
        ),
        "practiceMode": (
            <div className="flex gap-4 items-center">
                <Dumbbell size={36} />
                <span className="text-2xl font-bold">练习模式</span>
            </div>
        ),
        "running": (
            <div className="flex flex-col gap-4 items-center">
                <div className="flex gap-4 items-center">
                    <CirclePlay size={36} />
                    <span className="text-2xl font-bold">距离比赛结束还有</span>
                </div>
                <TimerDisplay
                    className="text-xl font-bold"
                    targetTime={dayjs(gameInfo?.end_time)}
                    onFinishCallback={() => { }}
                />
            </div>
        ),
        "pending": (
            <div className="flex flex-col gap-4 items-center">
                <div className="flex gap-4 items-center">
                    <Hourglass size={36} />
                    <span className="text-2xl font-bold">距离比赛开始还有</span>
                </div>
                <TimerDisplay
                    className="text-xl font-bold"
                    targetTime={dayjs(gameInfo?.start_time)}
                    onFinishCallback={() => { }}
                />
            </div>
        ),
    }

    useEffect(() => {
        console.log(teamStatus)
    }, [teamStatus])

    return (
        <div className="flex flex-col w-full overflow-hidden select-none lg:gap-16 gap-6">
            <div className="relative">
                <div className="w-full aspect-video bg-background rounded-xl overflow-hidden">
                    <ImageLoader
                        src={gameInfo?.poster || clientConfig.DefaultBGImage}
                        className=""
                        onLoad={(e) => {
                            const fac = new FastAverageColor();
                            const container = e.target as HTMLImageElement;

                            fac.getColorAsync(container)
                                .then((color: any) => {
                                    const brightness = 0.2126 * color.value[0] + 0.7152 * color.value[1] + 0.0722 * color.value[2];
                                    const brightColor = brightness > 128 ? "white" : "black";
                                    setPosterTextPrimaryColor(brightColor)
                                })
                                .catch((e: any) => {
                                    console.log(e);
                                });
                        }}
                    />
                </div>
                <div className="absolute bottom-0 w-full rounded-b-2xl overflow-hidden backdrop-blur-md bg-background/10">
                    <div className="w-full h-full py-4 px-7">
                        <div className="flex gap-6 items-center">
                            <img
                                width={"12%"}
                                height={"12%"}
                                className="min-w-[48px] min-h-[48px]"
                                src={
                                    posterTextPrimaryColor == "white" ? gameInfo?.game_icon_light ?? clientConfig.SVGIcon : gameInfo?.game_icon_dark ?? clientConfig.SVGIcon
                                }
                                alt={gameInfo?.name ?? "A1CTF ???????"}
                            />
                            <div className={`flex flex-col min-w-0 ${ posterTextPrimaryColor == "white" ? "text-black" : "text-white" }`}>
                                <span className="font-bold text-2xl text-nowrap pointer-events-auto overflow-ellipsis overflow-hidden whitespace-nowrap block"
                                    data-tooltip-content={gameInfo?.name}
                                    data-tooltip-id="my-tooltip"
                                    data-tooltip-place="top"
                                >{gameInfo?.name}</span>
                                <span className="text-md text-nowrap overflow-ellipsis pointer-events-auto overflow-hidden whitespace-nowrap block"
                                    data-tooltip-content={gameInfo?.summary}
                                    data-tooltip-id="my-tooltip"
                                    data-tooltip-place="bottom"
                                >{gameInfo?.summary}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex gap-2 w-full justify-center items-center">
                {(gameStatusElement as any)[gameStatus]}
            </div>
            <div className="flex flex-col w-full justify-center items-center gap-4 mt-[-16px]">
                <div className="flex gap-4 items-center">
                    <div className="flex gap-2 rounded-full border-1 items-center bg-blue-400/60 border-blue-400 px-4 py-1 text-black/70">
                        <UsersRound size={20} />
                        <span>人数限制: {gameInfo?.team_number_limit}</span>
                    </div>
                    <div className="flex gap-2 rounded-full border-1 items-center bg-orange-400/60 border-orange-400 px-4 py-1 text-black/70">
                        <Package size={20} />
                        <span>容器限制: {gameInfo?.container_number_limit}</span>
                    </div>
                </div>
                <div className="flex gap-2 rounded-full border-1 items-center bg-green-400/60 border-green-500 px-4 py-1 text-black/70">
                    <CalendarArrowUp size={20} />
                    <span>{ dayjs(gameInfo?.start_time).format("YYYY-MM-DD HH:mm:ss") }</span>
                    <span>-</span>
                    <CalendarArrowDown size={20} />
                    <span>{ dayjs(gameInfo?.end_time).format("YYYY-MM-DD HH:mm:ss") }</span>
                </div>
            </div>
        </div>
    )
}