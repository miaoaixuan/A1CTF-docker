
import MyTeamInfomationView from "components/MyTeamInfomationView";
import { useParams } from "react-router";

export default function GameScoreboard() {
    
    const { id } = useParams();

    if (!id) {
        return <div>404</div>
    }

    return (
        <div className="p-0 h-screen relative">
            <MyTeamInfomationView gameid={parseInt(id)} />
        </div>
    );
}
