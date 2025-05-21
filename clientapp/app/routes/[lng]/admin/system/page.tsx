import SafeComponent from "components/SafeComponent"
import { AdminHeader } from "components/admin/AdminHeader";
import { EditChallengePage } from "components/admin/EditChallengePage";
import { useParams } from "react-router";

export default function Home () {
    return (
        <div className="p-0 h-screen flex flex-col">
            <main className="flex flex-1 overflow-hidden">
                <div className="w-full">
                    <SafeComponent animation={false}>
                        <AdminHeader />
                    </SafeComponent>
                </div>
            </main>
        </div>
    );
}