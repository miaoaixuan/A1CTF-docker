import SafeComponent from "@/components/SafeComponent"
import { AdminHeader } from "@/components/admin/AdminHeader";
import { EditChallengePage } from "@/components/admin/EditChallengePage";

export default async function Home ({ params }: { params: Promise<{ lng: string }>}) {

    const { lng } = await params;

    return (
        <div className="p-0 h-screen flex flex-col">
            <main className="flex flex-1 overflow-hidden">
                <div className="w-full">
                    <SafeComponent animation={false}>
                        <AdminHeader lng={lng} />
                    </SafeComponent>
                </div>
            </main>
        </div>
    );
}