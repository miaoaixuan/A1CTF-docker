import A1Footer from "components/A1Footer";
import PageHeader from "components/A1Headers";
import fs from "fs";
import { Mdx } from "components/MdxCompoents";
import SafeComponent from "components/SafeComponent"
import { MacScrollbar } from "mac-scrollbar";
import { AboutPage } from "components/AboutPage";
import { VersionView } from "components/VersionView";
import { useParams } from "react-router";

export default function Home() {

    const { lng } = useParams();

    if (!lng) {
        return <div>Not found</div>;
    }

    return (
        <div className="p-0 h-screen flex flex-col">
            <PageHeader lng={lng} />
            <main className="flex flex-1 overflow-hidden">
                <div className="w-full">
                    <SafeComponent animation={false}>
                        <VersionView />
                    </SafeComponent>
                </div>
            </main>
        </div>
    );
}