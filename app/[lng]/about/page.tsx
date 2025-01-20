import A1Footer from "@/components/A1Footer";
import PageHeader from "@/components/A1Headers";
import fs from "fs";
import { Mdx } from "@/components/MdxCompoents";

export default async function Home({ params }: { params: Promise<{ lng: string }>}) {

    const { lng } = await params;
    
    const source = fs.readFileSync("app/md/about.mdx").toString("utf-8");

    return (
        <div className="p-0 font-[family-name:var(--font-geist-sans)] h-screen flex flex-col">
            <PageHeader lng={lng} />
            <main className="flex p-10 pl-20 flex-1 overflow-y-auto">
                <div className="w-full">
                    <Mdx source={source} />
                </div>
            </main>
            <A1Footer />
        </div>
    );
}