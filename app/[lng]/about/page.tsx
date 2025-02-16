import A1Footer from "@/components/A1Footer";
import PageHeader from "@/components/A1Headers";
import fs from "fs";
import { Mdx } from "@/components/MdxCompoents";
import SafeComponent from "@/components/SafeComponent"
import { MacScrollbar } from "mac-scrollbar";
import { AboutPage } from "@/components/AboutPage";

export default async function Home() {
    
    const source = fs.readFileSync("public/md/about.mdx").toString("utf-8");

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