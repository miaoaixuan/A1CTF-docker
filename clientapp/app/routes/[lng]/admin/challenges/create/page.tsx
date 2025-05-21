import SafeComponent from "components/SafeComponent"
import { CreateChallengeView } from "components/admin/CreateChallengeView";
import { EditChallengePage } from "components/admin/EditChallengePage";
import { useParams } from "react-router";

export default function Home () {

    const { lng } = useParams();

    if (!lng) {
        return <div>Not found</div>;
    }

    return (
        <div className="p-0 h-screen flex flex-col">
            <SafeComponent animation={false}>
                <CreateChallengeView lng={lng} />
            </SafeComponent>
        </div>
    );
}