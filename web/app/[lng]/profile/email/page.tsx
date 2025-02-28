import PageHeader from "@/components/A1Headers"

import SafeComponent from "@/components/SafeComponent";
import { ChangeEmailView } from "@/components/ChangeEmailView";

export default async function ProfilePassword() {

    return (
        <div className="p-0 h-screen flex flex-col">
            <main className="flex w-full flex-1 overflow-hidden">
                <SafeComponent animation={false}>
                    <ChangeEmailView />
                </SafeComponent>
            </main>
        </div>
    );
}
