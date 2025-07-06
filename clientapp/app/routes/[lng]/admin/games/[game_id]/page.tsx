import SafeComponent from "components/SafeComponent"
import { EditChallengePage } from "components/admin/EditChallengePage";
import { EditGamePage } from "components/admin/EditGamePage";
import { EditGameView } from "components/admin/EditGameView";
import { MacScrollbar } from "mac-scrollbar";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { AdminFullGameInfo } from "utils/A1API";
import { api } from "utils/ApiHelper";


export default function Home ({ params }: { params: Promise<{ lng: string, game_id: string }>}) {

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
        <MacScrollbar className="fixed inset-0">
            <EditGameView game_info={gameInfo} />
        </MacScrollbar>
    );
}