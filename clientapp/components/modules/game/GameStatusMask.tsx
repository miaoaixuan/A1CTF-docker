import { CreateTeamDialog } from "components/dialogs/CreateTeamDialog";
import { JoinTeamDialog } from "components/dialogs/JoinTeamDialog";
import { Mdx } from "components/MdxCompoents";
import { TransitionLink } from "components/TransitionLink";
import { Button } from "components/ui/button";
import { UserFullGameInfo } from "utils/A1API";
import { motion } from "framer-motion";
import { AlarmClock, Ban, Info, ListCheck, NotebookPen, Pickaxe, Presentation, TriangleAlert, Users } from "lucide-react";
import { MacScrollbar } from "mac-scrollbar";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { Dispatch, SetStateAction } from "react";
import TimerDisplay from "../TimerDisplay";
import dayjs from "dayjs";

export default function GameStatusMask(
    { gameStatus, gameInfo, setScoreBoardVisible, gameID, startCheckForGameStart }: {
        gameStatus: string,
        gameInfo: UserFullGameInfo | undefined,
        setScoreBoardVisible: Dispatch<SetStateAction<boolean>>,
        gameID: number,
        startCheckForGameStart: () => void
    }
) {

    const { t } = useTranslation('challenge_view');
    const { theme } = useTheme()

    return (
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
                            <TransitionLink className="transition-colors" href={`/games`}>
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
                                        {gameStatus == "pending" && (
                                            <div className="flex gap-2">
                                                <span className="text-2xl">{ t("game_start_countdown") }</span>
                                                <TimerDisplay 
                                                    className="text-2xl" 
                                                    target_time={dayjs(gameInfo?.start_time)} 
                                                    onFinishCallback={startCheckForGameStart} 
                                                />
                                            </div>
                                        )}
                                        <div className="flex mt-2 items-center gap-4 pointer-events-auto">
                                            <Button variant="outline"
                                                onClick={() => setScoreBoardVisible(true)}
                                            ><Presentation />{t("rank")}</Button>
                                            <TransitionLink className="transition-colors flex items-center" href={`/games`}>
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
                                            <TransitionLink className="transition-colors" href={`/games`}>
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
                                            <TransitionLink className="transition-colors" href={`/games`}>
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
                        <TransitionLink className="transition-colors" href={`/games`}>
                            <Button variant="outline">{t("back_to_main")}</Button>
                        </TransitionLink>
                    </div>
                </div>
            )}

        </>
    )
}