import { AdminHeader } from "components/admin/AdminHeader";
import { AdminSystemLogs } from "components/admin/AdminSystemLogs";

export default function Home () {

    return (
        <div className="w-screen h-screen flex flex-col">
            <AdminHeader />
            <div className="p-10">
                <AdminSystemLogs />
            </div>
        </div>
    );
}