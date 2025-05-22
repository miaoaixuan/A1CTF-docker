import SafeComponent from "components/SafeComponent"
import { AdminHeader } from "components/admin/AdminHeader";
import { AdminSystemSettingsView } from "components/admin/AdminSystemSettingsView";

export default function SystemSettings() {
    return (
        <div className="w-screen h-screen flex flex-col">
            <AdminHeader />
            <AdminSystemSettingsView />
        </div>
    );
}