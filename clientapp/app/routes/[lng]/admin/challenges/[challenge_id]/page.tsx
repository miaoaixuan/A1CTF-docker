import SafeComponent from "components/SafeComponent"
import { EditChallengePage } from "components/admin/EditChallengePage";
import { useParams } from "react-router";

export default function Home () {

    const { challenge_id } = useParams();
    if (!challenge_id) {
        return <div>Not found</div>;
    }

    const cid = parseInt(challenge_id);

    return (
        <div className="p-0 h-screen flex flex-col">
            <SafeComponent animation={false}>
                <EditChallengePage challenge_id={cid} />
            </SafeComponent>
        </div>
    );
}