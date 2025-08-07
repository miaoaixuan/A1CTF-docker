import SafeComponent from "components/SafeComponent"
import { AdminHeader } from "components/admin/AdminHeader";

export default function AdminPageMain () {

    return (
        <div className="p-0 h-screen flex flex-col">
            <main className="flex flex-1 overflow-hidden">
                <div className="w-full">
                    <SafeComponent animation={false}>
                        <AdminHeader />
                        <div className="w-full h-full p-8 flex flex-col items-center justify-center gap-2">
                            <span className="text-5xl font-bold">Welcome admin!</span>
                        </div>
                    </SafeComponent>
                </div>
            </main>
        </div>
    );
}