import PageHeader from "components/A1Headers"

import A1Footer from "components/A1Footer";

import React from "react";
import { MainPageAnimation } from "components/MainPageAnimation";
import SafeComponent from "components/SafeComponent";
import { ActivityPage } from "components/ActivityPage";
import { sAPI } from "utils/GZApi";
import { config } from "dotenv";
import FancyBackground from "components/modules/FancyBackground";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";

// import type { Route } from "./+types/home";

// export function meta({}: Route.MetaArgs) {
//     return [
//       { title: "New React Router App" },
//       { name: "description", content: "Welcome to React Router!" },
//     ];
//   }


export default function A1CTFMainPage() {
    const { t } = useTranslation();

    return (
        <>
            <div className="p-0 h-screen flex flex-col">
                <PageHeader />
                <main className="flex flex-1 overflow-hidden">
                    <SafeComponent animation={false}>
                        <>
                            <MainPageAnimation />
                        </>
                    </SafeComponent>
                </main>
                <A1Footer />
            </div>
        </>
    );
}
