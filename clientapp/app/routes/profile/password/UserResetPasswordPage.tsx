import PageHeader from "components/A1Headers"

import A1Footer from "components/A1Footer";
import SafeComponent from "components/SafeComponent";
import { PasswordView } from "components/user/profile/PasswordView";
import { useParams } from "react-router";

export default function UserResetPasswordPage() {

    return (
        <div className="p-0 h-screen flex flex-col">
            <PageHeader />
            <main className="flex w-full flex-1 overflow-hidden">
                <SafeComponent animation={false}>
                    <PasswordView />
                </SafeComponent>
            </main>
        </div>
    );
}
