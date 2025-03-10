import PageHeader from "@/components/A1Headers";
import SafeComponent from "@/components/SafeComponent"
import { AdminPage } from "@/components/admin/AdminPage";

export default async function Home({ params }: { params: Promise<{ lng: string }>}) {

    const { lng } = await params;

    return (
        <div className="p-0 h-screen flex flex-col">
            <main className="flex flex-1 overflow-hidden">
                <div className="w-full">
                    <SafeComponent animation={false}>
                        <AdminPage />
                    </SafeComponent>
                </div>
            </main>
        </div>
    );
}