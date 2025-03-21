"use client";

import { useEffect, useState } from "react";
import { EditChallengeView } from "./EditChallengeView";
import { ChallengeConfig, GameInfo } from "@/utils/A1API";
import { api } from "@/utils/ApiHelper";
import { EditGameView } from "./EditGameView";

export function EditGamePage ({ game_id, lng }: { game_id: number, lng: string })
{
    const [ gameInfo, setGameInfo ] = useState<GameInfo>();

    useEffect(() => {
        // Fetch challenge info
        api.admin.geteGameInfo(game_id).then((res) => {
            setGameInfo(res.data.data);
        })
    }, [game_id])

    return (
        <>
            { gameInfo && <EditGameView lng={lng} game_info={gameInfo} /> }
            
        </>
    );
}