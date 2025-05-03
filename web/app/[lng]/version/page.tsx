import A1Footer from "@/components/A1Footer";
import PageHeader from "@/components/A1Headers";
import fs from "fs";
import { Mdx } from "@/components/MdxCompoents";
import SafeComponent from "@/components/SafeComponent"
import { MacScrollbar } from "mac-scrollbar";
import { AboutPage } from "@/components/AboutPage";
import { VersionView } from "@/components/VersionView";
import FancyBackground from "@/components/modules/FancyBackground";

export default async function Home({ params }: { params: Promise<{ lng: string }>}) {

    const { lng } = await params;

    return (
        <div className="p-0 h-screen flex flex-col">
            <PageHeader lng={lng} />
            <main className="flex flex-1 overflow-hidden">
                <div className="w-full">
                    <SafeComponent animation={false}>
                        <>
                            <FancyBackground />
                            <VersionView />
                        </>
                    </SafeComponent>
                </div>
            </main>
        </div>
    );
}