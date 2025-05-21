import SafeComponent from "components/SafeComponent"
import { EditChallengePage } from "components/admin/EditChallengePage";
import { EditGamePage } from "components/admin/EditGamePage";
import { useParams } from "react-router";

export default function Home ({ params }: { params: Promise<{ lng: string, game_id: string }>}) {

    const { game_id } = useParams();

    if (!game_id) {
        return <div>Not found</div>;
    }

    const gid = parseInt(game_id);

    return (
        <div className="p-0 h-screen flex flex-col">
            <SafeComponent animation={false}>
                <EditGamePage game_id={gid} />
            </SafeComponent>
        </div>
    );
}