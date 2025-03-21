import SafeComponent from "@/components/SafeComponent"
import { EditChallengePage } from "@/components/admin/EditChallengePage";
import { EditGamePage } from "@/components/admin/EditGamePage";

export default async function Home ({ params }: { params: Promise<{ lng: string, game_id: string }>}) {

    const { lng, game_id } = await params;

    const gid = parseInt(game_id);

    return (
        <div className="p-0 h-screen flex flex-col">
            <SafeComponent animation={false}>
                <EditGamePage lng={lng} game_id={gid} />
            </SafeComponent>
        </div>
    );
}