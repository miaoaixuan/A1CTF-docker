import SafeComponent from "@/components/SafeComponent"
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ChallengePage } from "@/components/admin/ChallengePage";
import { UserManageView } from "@/components/admin/UserManageView";

export default async function Home ({ params }: { params: Promise<{ lng: string }>}) {

    const { lng } = await params;

    return (
        <div className="p-0 h-screen flex flex-col">
            <SafeComponent animation={false}>
                <AdminHeader lng={lng} />
                <main className="flex flex-1 overflow-hidden">
                    <div className="w-full flex justify-center">
                        <UserManageView />
                    </div>
                </main>
            </SafeComponent>
        </div>
    );
}