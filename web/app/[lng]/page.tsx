import PageHeader from "@/components/A1Headers"

import A1Footer from "@/components/A1Footer";

import React from "react";
import { MainPageAnimation } from "@/components/MainPageAnimation";
import SafeComponent from "@/components/SafeComponent";
import { ActivityPage } from "@/components/ActivityPage";
import { sAPI } from "@/utils/GZApi";
import { config } from "dotenv";
import FancyBackground from "@/components/modules/FancyBackground";

export default async function Home({ params }: { params: Promise<{ lng: string }>}) {

    const { lng } = await params;
    config();

    const inActivity = process.env.ACTIVITY_OPENED === "true";
    const targetGameID = parseInt(process.env.ACTIVITY_GAME_ID || "", 10);

    const { data } = await sAPI.game.gameGame(targetGameID);

    return (
        <>
            {inActivity ? (
                <div className="relative top-0 left-0 w-screen h-screen bg-black">
                    <SafeComponent animation={false}>
                        <ActivityPage lng={lng} gameDetailModel={data} />
                    </SafeComponent>
                </div>
            ) : (
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
            )}
        </>
    );
}
