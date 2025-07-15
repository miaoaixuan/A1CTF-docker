import { AudioWaveform, ChartNoAxesCombined, Flag } from "lucide-react";
import { GameScoreboardData, UserFullGameInfo } from "utils/A1API";

export default function GameTeamStatusCard(
    { 
        gameInfo,
        scoreBoardModel
    } : {
        gameInfo: UserFullGameInfo | undefined,
        scoreBoardModel: GameScoreboardData | undefined
    }
) {

    const rankColor = (rank: number) => {
        if (rank == 1) return "text-red-400 font-bold"
        else if (rank == 2) return "text-green-400 font-bold"
        else if (rank == 3) return "text-blue-400 font-bold"
        else return ""
    }

    return (
        <div className="flex px-5 py-2 flex-col gap-2 backdrop-blur-sm rounded-2xl select-none border-2 shadow-xl shadow-foreground/5">
            <div className="flex gap-2 items-center">
                <AudioWaveform className="size-5" />
                <span>{gameInfo?.team_info?.team_name}</span>
            </div>
            <div className="flex gap-4">
                <div className="flex gap-2 items-center">
                    <Flag className="size-5" />
                    <span>{scoreBoardModel != undefined ? (scoreBoardModel?.your_team?.score) : (gameInfo?.team_info?.team_score ?? 0)} pts</span>
                </div>
                <div className={`flex gap-2 items-center transition-colors duration-300 ${rankColor(scoreBoardModel != undefined ? (scoreBoardModel?.your_team?.rank ?? 0) : (gameInfo?.team_info?.rank ?? 0))}`}>
                    <ChartNoAxesCombined className="size-5" />
                    <span>Rank {scoreBoardModel != undefined ? (scoreBoardModel?.your_team?.rank ?? 0) : (gameInfo?.team_info?.rank ?? 0)}</span>
                </div>
            </div>
        </div>
    )
}