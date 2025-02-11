import PageHeader from "@/components/A1Headers"

import A1Footer from "@/components/A1Footer";
import SafeComponent from "@/components/SafeComponent";
import { TeamsView } from "@/components/TeamsView";

export default async function Teams({ params }: { params: Promise<{ lng: string }>}) {
    const { lng } = await params;

    return (
        <div className="p-0 h-screen flex flex-col">
            <PageHeader lng={ lng }/>
            <main className="flex w-full flex-1 overflow-hidden">
                <SafeComponent>
                    <TeamsView />
                </SafeComponent>
            </main>
        </div>
    );
}
