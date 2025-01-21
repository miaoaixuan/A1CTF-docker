import PageHeader from "@/components/A1Headers"

import A1Footer from "@/components/A1Footer";
import A1Animation from "@/components/A1Animation";

import React from "react";

export default async function Home({ params }: { params: Promise<{ lng: string }>}) {
    
    const { lng } = await params;

    return (
        <div className="p-0 font-[family-name:var(--font-geist-sans)] h-screen flex flex-col">
            <PageHeader lng={ lng }/>
            <main className="flex flex-1 overflow-y-auto">
                {/* <div className="relative top-5 left-5 w-[300px] h-[100px] border-2 grow-0 shrink-0 rounded-xl p-3 bg-gray-100">
                    <h1>Welcome to A1CTF!</h1>
                </div> */}
                <div className="w-full h-full flex justify-center items-center">
                    <A1Animation />
                </div>
            </main>
            <A1Footer/>
        </div>
    );
}
