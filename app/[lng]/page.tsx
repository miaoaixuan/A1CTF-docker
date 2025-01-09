import PageHeader from "@/components/A1Headers"

import A1Footer from "@/components/A1Footer";
import A1Anime from "@/components/A1Anime";

// i18n 多语言
import { useTranslation } from '../i18n'
import React from "react";

export default async function Home({ params }: { params: Promise<{ lng: string }>}) {
    
    const { lng } = await params;
    const { t } = await useTranslation(lng);

    return (
        <div className="p-0 font-[family-name:var(--font-geist-sans)] h-screen flex flex-col">
            <PageHeader lng={ lng }/>
            <main className="flex items-center justify-center p-10 flex-1 overflow-y-auto">
                <A1Anime />
            </main>
            <A1Footer/>
        </div>
    );
}
