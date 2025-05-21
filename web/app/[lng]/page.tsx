"use client";

import PageHeader from "@/components/A1Headers"

import A1Footer from "@/components/A1Footer";

import React from "react";
import { MainPageAnimation } from "@/components/MainPageAnimation";
import SafeComponent from "@/components/SafeComponent";
import { ActivityPage } from "@/components/ActivityPage";
import { sAPI } from "@/utils/GZApi";
import { config } from "dotenv";
import FancyBackground from "@/components/modules/FancyBackground";

export default function Home() {

    // const { lng } = await params;
    const lng = "zh";

    return (
        <>
            <div className="p-0 h-screen flex flex-col">
                <PageHeader lng={lng} />
                <main className="flex flex-1 overflow-hidden">
                    <SafeComponent animation={false}>
                        <>
                            <FancyBackground />
                            <MainPageAnimation />
                        </>
                    </SafeComponent>
                </main>
                <A1Footer lng={lng} />
            </div>
        </>
    );
}
