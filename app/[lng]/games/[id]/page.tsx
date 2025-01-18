import PageHeader from "@/components/A1Headers"
import A1Footer from "@/components/A1Footer";
import AnimatedButton from "@/components/AnimatedButton"
import GameSwitchHover from "@/components/GameSwitchHover"

// i18n 多语言
import { useTranslation } from '@/app/i18n'
import { Button } from "@/components/ui/button";
import { Label } from "@radix-ui/react-label";
import { CircleArrowLeft, CodeXml, FileTerminal, Globe } from "lucide-react";

import ToggleTheme from "@/components/ToggleTheme"

import Mdx from "@/components/MdxCompoents";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import fs from "fs";

import { AppSidebar } from "@/components/CategorySideBar";

import { GameTerminal } from "@/components/GameTerminal"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"

import {
    ResizableHandle,
    ResizablePanelGroup,
} from "@/components/ui/resizable"

import { ResizableScrollablePanel } from "@/components/ResizableScrollablePanel"
import { A1LogoWithOutAnime } from "@/components/A1LogoWithoutAnime";

export default async function Games({ params }: { params: Promise<{ lng: string, id: string }>}) {
    
    const { lng, id } = await params;
    const { t } = await useTranslation(lng);

    const source = fs.readFileSync("app/md/about.mdx").toString("utf-8");

    return (
        <div className="p-0 font-[family-name:var(--font-geist-sans)] h-screen relative">
            <div className="absolute top-0 left-0 w-screen h-screen z-[-19] overflow-hidden">
                <div className="w-[400px] h-[400px] absolute bottom-[-120px] right-[-120px] rotate-[-20deg]">
                    <A1LogoWithOutAnime />
                </div>
                {/* <div className="absolute w-[calc(100vw-2px)] h-[calc(100vh-2px)] top-[0px] left-[0px] border-2 z-[-20] dark:border-white">
                </div> */}
            </div>
            <SidebarProvider>
                <div className="z-20">
                <AppSidebar />
                </div>
                <main className="flex flex-col top-0 left-0 h-screen w-screen overflow-hidden backdrop-blur-sm">
                    <div className="h-[60px] flex items-center pl-4 pr-3 z-20 w-full">
                        <div className="h-[32px] flex items-center mt-[8px]">
                            <SidebarTrigger />
                            <Label className="font-bold ml-3">Game - ez_VM</Label>
                        </div>
                        <div className="flex-1" />
                        <div id="rightArea" className="justify-end flex h-ful gap-[10px] items-center pointer-events-auto">
                            <div className="bg-black bg-opacity-10 pl-4 pr-4 pt-1 pb-1 rounded-2xl relative overflow-hidden select-none dark:invert">
                                <div
                                    className="absolute top-0 left-0 bg-black mix-blend-difference"
                                    style={{ width: '50%', height: '100%' }}
                                />
                                <Label className="text-white mix-blend-difference z-20">Left time: 245:11:33</Label>
                            </div>

                            <ToggleTheme lng={lng} />
                            <Avatar>
                                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                    <ResizablePanelGroup direction="vertical">
                        <ResizableScrollablePanel defaultSize={60} minSize={20} className="overflow-auto">
                            <div className="pl-7 pr-5 pb-5 flex-1">
                                <Mdx source={source} />
                            </div>
                        </ResizableScrollablePanel>
                        <ResizableHandle withHandle={true} />
                        <ResizableScrollablePanel defaultSize={40} minSize={10}>
                            <div className="flex flex-col p-0 h-full resize-y">
                                <GameTerminal />
                            </div>
                        </ResizableScrollablePanel>
                    </ResizablePanelGroup>
                </main>
            </SidebarProvider>
        </div>
    );
}
