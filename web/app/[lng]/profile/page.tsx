import PageHeader from "@/components/A1Headers"

import A1Footer from "@/components/A1Footer";
import SafeComponent from "@/components/SafeComponent";
import { TeamsView } from "@/components/TeamsView";
import { ProfileView } from "@/components/ProfileView";

export default async function Profile({ params }: { params: Promise<{ lng: string }>}) {

    const { lng } = await params;

    return (
        <div className="p-0 h-screen flex flex-col">
            <PageHeader lng={lng} />
            <main className="flex w-full flex-1 overflow-hidden">
                <SafeComponent animation={false}>
                    <ProfileView lng={lng} />
                </SafeComponent>
            </main>
        </div>
    );
}
