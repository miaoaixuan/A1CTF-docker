import { useEffect, useState } from "react";
import { AdminFullGameInfo } from "utils/A1API";
import { api } from "utils/ApiHelper";
import { EditGameView } from "./EditGameView";

export function EditGamePage ({ game_id }: { game_id: number })
{
    const [ gameInfo, setGameInfo ] = useState<AdminFullGameInfo>();

    useEffect(() => {
        // Fetch challenge info
        api.admin.getGameInfo(game_id).then((res) => {
            setGameInfo(res.data.data);
        })
    }, [game_id])

    return (
        <>
            { gameInfo && <EditGameView game_info={gameInfo} /> }
            
        </>
    );
}