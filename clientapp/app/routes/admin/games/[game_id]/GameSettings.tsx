import { EditGameView } from "components/admin/EditGameView";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { AdminFullGameInfo } from "utils/A1API";
import { api } from "utils/ApiHelper";


export default function GameSettings () {

    const { game_id } = useParams();

    if (!game_id) {
        return <div>Not found</div>;
    }

    const [ gameInfo, setGameInfo ] = useState<AdminFullGameInfo>();
    const gid = parseInt(game_id);

    useEffect(() => {
        // Fetch challenge info
        api.admin.getGameInfo(gid).then((res) => {
            setGameInfo(res.data.data);
        })
    }, [game_id])

    if (!gameInfo) {
        return <div>Loading...</div>;
    }

    return (
        <div className="w-screen h-screen">
            <EditGameView game_info={gameInfo} />
        </div>
    );
}