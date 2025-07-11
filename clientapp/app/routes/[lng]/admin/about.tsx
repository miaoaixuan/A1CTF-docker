import AboutPage from "components/admin/AboutPage"
import { AdminHeader } from "components/admin/AdminHeader"

export default function About() {
    return (
        <div className="w-screen h-screen flex flex-col overflow-hidden">
            <AdminHeader />
            <AboutPage />
        </div>
    )
}