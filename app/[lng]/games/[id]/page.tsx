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

export default async function Games({ params }: { params: Promise<{ lng: string, id: string }>}) {
    
    const { lng, id } = await params;
    const { t } = await useTranslation(lng);

    const source = fs.readFileSync("app/md/about.mdx").toString("utf-8");

    return (
        <div className="p-0 font-[family-name:var(--font-geist-sans)] h-screen relative">
            <div className="absolute overflow-y-auto flex items-center pl-3 pt-3 pr-3 pb-2 w-screen z-20 pointer-events-none">
                <div className="flex items-center">
                    {/* <Label className="font-bold ml-[15px] text-lg">A1CTF 2025</Label> */}
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
            <SidebarProvider>
                <AppSidebar />
                <main className="flex flex-col top-0 left-0 h-screen w-screen overflow-hidden">
                    <div className="h-[40px] flex items-center pl-4 pt-3 pr-3">
                        <SidebarTrigger />
                        <Label className="font-bold ml-3">Game - ez_VM</Label>
                    </div>
                    <ResizablePanelGroup direction="vertical">
                        <ResizableScrollablePanel defaultSize={60} minSize={20} className="overflow-auto">
                            <div className="pl-7 pr-5 pb-5 flex-1 mt-2">
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
