import { CreateTeamDialog } from "components/dialogs/CreateTeamDialog";
import { JoinTeamDialog } from "components/dialogs/JoinTeamDialog";
import { Mdx } from "components/MdxCompoents";
import { Button } from "components/ui/button";
import { ParticipationStatus, UserFullGameInfo } from "utils/A1API";
import { motion } from "framer-motion";
import { AlarmClock, Ban, Info, ListCheck, NotebookPen, Pickaxe, Presentation, TriangleAlert, Undo2, Users } from "lucide-react";
import { MacScrollbar } from "mac-scrollbar";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { Dispatch, SetStateAction, useEffect } from "react";
import TimerDisplay from "../TimerDisplay";
import dayjs from "dayjs";
import { useNavigate } from "react-router";
import { A1GameStatus } from "./GameStatusEnum";

export default function GameStatusMask(
    { gameStatus, teamStatus }: {
        gameStatus: A1GameStatus,
        teamStatus: ParticipationStatus
    }
) {

    const { t } = useTranslation('challenge_view');
    const { theme } = useTheme()

    const navigate = useNavigate()

    useEffect(() => {
        console.log(gameStatus)
    }, [gameStatus])

    return (
        <>
            {teamStatus == ParticipationStatus.Banned && (
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
                    <div className="flex flex-col items-center gap-6 select-none">
                        <div className="flex flex-col items-center gap-6 text-white">
                            <TriangleAlert size={120} />
                            <span className="text-3xl">{t("you_have_be_banned")}</span>
                        </div>
                        <Button variant="secondary" onClick={() => {
                                navigate(`/games`)
                        }}><Undo2 />{t("back_to_main")}</Button>
                    </div>
                </motion.div>
            )}
        </>
    )
}