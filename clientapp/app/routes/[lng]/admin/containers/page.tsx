import SafeComponent from "components/SafeComponent"
import { AdminHeader } from "components/admin/AdminHeader";
import { EditChallengePage } from "components/admin/EditChallengePage";
import { ContainerManageView } from "components/admin/ContainerManageView";
import { useParams } from "react-router";

export default function Home () {

    return (
        <div className="p-0 h-screen flex flex-col">
            <SafeComponent animation={false}>
                <AdminHeader />
                <main className="flex flex-1 overflow-hidden">
                    <div className="w-full flex justify-center">
                        <ContainerManageView />
                    </div>
                </main>
            </SafeComponent>
        </div>
    );
}