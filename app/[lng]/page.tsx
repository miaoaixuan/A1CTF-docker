import PageHeader from "@/components/A1Headers"

import A1Footer from "@/components/A1Footer";
import A1Animation from "@/components/A1Animation";

import React from "react";
import { MainPageAnimation } from "@/components/MainPageAnimation";
import SafeComponent from "@/components/SafeComponent";

export default async function Home({ params }: { params: Promise<{ lng: string }>}) {

    return (
        <div className="p-0 h-screen flex flex-col">
            <PageHeader />
            <main className="flex flex-1 overflow-hidden">
                <SafeComponent animation={false}>
                    <MainPageAnimation />
                </SafeComponent>
            </main>
            <A1Footer/>
        </div>
    );
}
