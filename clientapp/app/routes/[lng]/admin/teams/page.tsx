import SafeComponent from "components/SafeComponent"
import { AdminHeader } from "components/admin/AdminHeader";
import { EditChallengePage } from "components/admin/EditChallengePage";
import { TeamManageView } from "components/admin/TeamManageView";
import { useParams } from "react-router";

export default function Home () {

    const { lng } = useParams();

    if (!lng) {
        return <div>Not found</div>;
    }

    return (
        <div className="p-0 h-screen flex flex-col">
            <SafeComponent animation={false}>
                <AdminHeader lng={lng} />
                <main className="flex flex-1 overflow-hidden">
                    <div className="w-full flex justify-center">
                        <TeamManageView />
                    </div>
                </main>
            </SafeComponent>
        </div>
    );
}