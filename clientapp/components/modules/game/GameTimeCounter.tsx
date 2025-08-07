import dayjs from "dayjs"
import { useGame } from "hooks/UseGame";
import { useEffect } from "react"
import { GameStage } from "utils/A1API";
import { A1GameStatus } from "./GameStatusEnum";
import TimeCounterWithProgressBar from "components/user/game/TimeCounterWithProgressBar";
import useConditionalState from "hooks/ContidionalState";
import { DropdownMenu, DropdownMenuContent } from "components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { ClockArrowDown, ClockArrowUp, SquareChartGantt } from "lucide-react";

export default function GameTimeCounter(
    { gameID }: {
        gameID: number,
    }
) {
    const { gameInfo, gameStatus } = useGame(gameID)
    const stageMode = gameInfo?.stages != undefined && gameInfo.stages.length > 0

    const getCurGameStage = (): GameStage | undefined => {
        if (gameInfo?.stages) {
            return gameInfo.stages.find((e) => dayjs(e.start_time) <= dayjs() && dayjs(e.end_time) >= dayjs())
        }
        return undefined
    }

    const [curGameStage, setCurGameStage] = useConditionalState<GameStage | undefined>(getCurGameStage())

    const gameStagesModule = () => {

        if (!stageMode || !curGameStage) {
            return (
                <TimeCounterWithProgressBar
                    start_time={gameInfo?.start_time ?? dayjs()}
                    target_time={gameInfo?.end_time ?? dayjs()}
                />
            )
        }

        return (
            <TimeCounterWithProgressBar
                start_time={curGameStage?.start_time ?? dayjs()}
                target_time={curGameStage?.end_time ?? dayjs()}
                prefix={curGameStage?.stage_name + " - "}
            />
        )
    }

    useEffect(() => {
        const gameStageInter = setInterval(() => {
            setCurGameStage(getCurGameStage())
        }, 500)

        return () => {
            clearInterval(gameStageInter)
        }
    }, [gameInfo])

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="select-none cursor-pointer" title="查看比赛时间详细">
                    {/* 未开始 */}
                    {gameStatus == A1GameStatus.Pending && (
                        <div className="bg-background rounded-2xl">
                            <div className="bg-black/10 pl-4 pr-4 pt-1 pb-1 rounded-2xl overflow-hidden select-none dark:bg-[#2A2A2A] hidden lg:flex relative transition-colors duration-300">
                                <div className="absolute top-0 left-0 bg-black dark:bg-white transition-colors duration-300"
                                    style={{ width: `100%`, height: '100%' }}
                                />
                                <span className="text-white mix-blend-difference z-20 transition-all duration-500">比赛未开始</span>
                            </div>
                        </div>
                    )}

                    {/* 比赛已结束 */}
                    {gameStatus == A1GameStatus.Ended || gameStatus == A1GameStatus.PracticeMode && (
                        <div className="bg-background rounded-2xl">
                            <div className="bg-black/10 pl-4 pr-4 pt-1 pb-1 rounded-2xl overflow-hidden select-none dark:bg-[#2A2A2A] hidden lg:flex relative transition-colors duration-300">
                                <div className="absolute top-0 left-0 bg-black dark:bg-white transition-colors duration-300"
                                    style={{ width: `0%`, height: '100%' }}
                                />
                                <span className="text-white mix-blend-difference z-20 transition-all duration-500">{gameStatus == A1GameStatus.PracticeMode ? "练习模式" : "比赛已结束"}</span>
                            </div>
                        </div>
                    )}

                    {gameStatus == A1GameStatus.Running && gameStagesModule()}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-background/5 backdrop-blur-sm px-4 py-4 flex flex-col gap-2 mt-2 select-none">
                <div className="flex gap-2 items-center">
                    <SquareChartGantt className="w-4 h-4" />
                    <span className="text-sm font-bold">比赛时间段</span>
                </div>
                <div className="flex flex-col px-2 py-1 bg-foreground/10 rounded-sm gap-1 mt-1">
                    <div className="flex gap-2 items-center">
                        <ClockArrowUp className="w-4 h-4" />
                        <span className="text-sm font-bold">比赛开始时间: {dayjs(gameInfo?.start_time).format("YYYY-MM-DD HH:mm:ss")}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                        <ClockArrowDown className="w-4 h-4" />
                        <span className="text-sm font-bold">比赛结束时间: {dayjs(gameInfo?.end_time).format("YYYY-MM-DD HH:mm:ss")}</span>
                    </div>
                </div>
                {stageMode && (
                    <div className="flex flex-col gap-2 mt-1">
                        {gameInfo.stages.map((e, idx) => (
                            <div className={`flex flex-col gap-1 ${ e.stage_name == curGameStage?.stage_name ? "text-orange-400" : "" }`} key={idx}>
                                <span className="text-sm font-bold">Stage{idx + 1} - {e.stage_name}</span>
                                <div className="flex gap-1 items-center">
                                    <div className="flex gap-2 items-center bg-foreground/10 rounded-full px-2 py-1">
                                        <ClockArrowUp className="w-4 h-4" />
                                        <span className="text-sm font-bold">{dayjs(e.start_time).format("YYYY-MM-DD HH:mm:ss")}</span>
                                    </div>
                                    <span>-</span>
                                    <div className="flex gap-2 items-center bg-foreground/10 rounded-full px-2 py-1">
                                        <ClockArrowDown className="w-4 h-4" />
                                        <span className="text-sm font-bold">{dayjs(e.end_time).format("YYYY-MM-DD HH:mm:ss")}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}