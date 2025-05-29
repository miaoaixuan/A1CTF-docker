import A1Footer from "components/A1Footer";
import PageHeader from "components/A1Headers";
import fs from "fs";
import { Mdx } from "components/MdxCompoents";
import SafeComponent from "components/SafeComponent"
import { MacScrollbar } from "mac-scrollbar";
import { AboutPage } from "components/AboutPage";
import { useParams } from "react-router";

export default function Home() {

    return (
        <div className="p-0 h-screen flex flex-col">
            <PageHeader />
            <main className="flex flex-1 overflow-hidden">
                <div className="w-full">
                    <SafeComponent animation={false}>
                        <AboutPage />
                    </SafeComponent>
                </div>
            </main>
            {/* <A1Footer /> */}
        </div>
    );
}