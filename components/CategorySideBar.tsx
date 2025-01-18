import { Calendar, CircleArrowLeft, Home, Inbox, Search, Settings } from "lucide-react"

import Image from "next/image";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "./ui/button"
import { Label } from "@radix-ui/react-label"

import { ChallengeItem } from "./ChallengeItem";

// Menu items.
const items = [
    {
        title: "Home",
        url: "#",
        icon: Home,
    },
    {
        title: "Inbox",
        url: "#",
        icon: Inbox,
    },
    {
        title: "Calendar",
        url: "#",
        icon: Calendar,
    },
    {
        title: "Search",
        url: "#",
        icon: Search,
    },
    {
        title: "Settings",
        url: "#",
        icon: Settings,
    },
]

export function AppSidebar() {
    return (
        <Sidebar className="backdrop-blur-sm hide-scrollbar select-none">
            <SidebarContent>
                <SidebarGroup>
                    <div className="flex justify-center w-full items-center pl-2 pr-2 pt-2">
                        <div className="justify-start flex gap-2 items-center mt-[-6px]">
                            <Image
                                className="dark:invert"
                                src="/images/A1natas.svg"
                                alt="A1natas"
                                width={40}
                                height={30}
                                priority
                            />
                            <Label className="font-bold text-xl">A1CTF</Label>
                        </div>
                        <div className="flex-1" />
                        <div className="justify-end">
                            <Button className="rounded-3xl p-4 pointer-events-auto w-[100px] mt-[5px] ml-[5px] mb-[10px]">
                                <CircleArrowLeft/>
                                <Label>Back</Label>
                            </Button>
                        </div>
                    </div>
                    <div className="pl-[7px] pr-[7px]">
                        <SidebarGroupLabel className="text-[0.9em]">Reverse</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <div className="flex flex-col pl-2 pr-2 pb-2 gap-3">
                                    <ChallengeItem 
                                        type="reverse"
                                        name="ez_vm"
                                        solved={14}
                                        score={100}
                                        rank={5}
                                    />
                                </div>
                            </SidebarMenu>
                        </SidebarGroupContent>

                        <SidebarGroupLabel className="text-[0.9em]">Web</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <div className="flex flex-col pl-2 pr-2 pb-2 gap-3">
                                    <ChallengeItem 
                                        type="web"
                                        name="flask"
                                        solved={14}
                                        score={100}
                                        rank={3}
                                    />
                                </div>
                            </SidebarMenu>
                        </SidebarGroupContent>

                        <SidebarGroupLabel className="text-[0.9em]">Mobile</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <div className="flex flex-col pl-2 pr-2 pb-2 gap-3">
                                    <ChallengeItem 
                                        type="mobile"
                                        name="ezAPP"
                                        solved={14}
                                        score={100}
                                        rank={3}
                                    />
                                </div>
                            </SidebarMenu>
                        </SidebarGroupContent>

                        <SidebarGroupLabel className="text-[0.9em]">Crypto</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <div className="flex flex-col pl-2 pr-2 pb-2 gap-3">
                                    <ChallengeItem 
                                        type="crypto"
                                        name="rsa"
                                        solved={14}
                                        score={100}
                                        rank={3}
                                    />
                                </div>
                            </SidebarMenu>
                        </SidebarGroupContent>

                        <SidebarGroupLabel className="text-[0.9em]">AI</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <div className="flex flex-col pl-2 pr-2 pb-2 gap-3">
                                    <ChallengeItem 
                                        type="ai"
                                        name="丰川祥子机器人"
                                        solved={14}
                                        score={100}
                                        rank={3}
                                    />
                                </div>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </div>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
