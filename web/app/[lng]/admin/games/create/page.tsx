import SafeComponent from "@/components/SafeComponent"
import { CreateChallengeView } from "@/components/admin/CreateChallengeView";
import { CreateGameView } from "@/components/admin/CreateGameView";
import { EditChallengePage } from "@/components/admin/EditChallengePage";

export default async function Home ({ params }: { params: Promise<{ lng: string, challenge_id: string }>}) {

    const { lng, challenge_id } = await params;

    const cid = parseInt(challenge_id);

    return (
        <div className="p-0 h-screen flex flex-col">
            <SafeComponent animation={false}>
                <CreateGameView lng={lng} />
            </SafeComponent>
        </div>
    );
}