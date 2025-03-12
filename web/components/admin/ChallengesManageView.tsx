"use client";

import { MacScrollbar } from "mac-scrollbar";
import { Button } from "../ui/button";
import { CirclePlus, Volleyball } from "lucide-react";
import { useTheme } from "next-themes";

import { BadgeCent, Binary, Bot, Bug, ChevronDown, ChevronUp, Chrome, CircleArrowLeft, Earth, FileSearch, Github, GlobeLock, HardDrive, MessageSquareLock, Radar, Smartphone, SquareCode } from "lucide-react"

export function ChallengesManageView() {

    const { theme } = useTheme()

    const colorMap : { [key: string]: string } = {
        "misc": "rgb(32, 201, 151)",
        "crypto": "rgb(132, 94, 247)",
        "pwn": "rgb(255, 107, 107)",
        "web": "rgb(51, 154, 240)",
        "reverse": "rgb(252, 196, 25)",
        "forensics": "rgb(92, 124, 250)",
        "hardware": "rgb(208, 208, 208)",
        "mobile": "rgb(240, 101, 149)",
        "ppc": "rgb(34, 184, 207)",
        "ai": "rgb(148, 216, 45)",
        "pentent": "rgb(204, 93, 232)",
        "osint": "rgb(255, 146, 43)"
    };

    const cateIcon : { [key: string]: any } = {
        "all": <Volleyball size={23} />,
        "misc": <Radar size={23} />,
        "crypto": <MessageSquareLock size={23} />,
        "pwn": <Bug size={23} />,
        "web": <GlobeLock size={23} />,
        "reverse": <Binary size={23} />,
        "forensics": <FileSearch size={23} />,
        "hardware": <HardDrive size={23} />,
        "mobile": <Smartphone size={23} />,
        "ppc": <SquareCode size={23} />,
        "ai": <Bot size={23} />,
        "pentent": <BadgeCent size={23} />,
        "osint": <Github size={23} />
    };

    return (
        <div className="w-full h-full flex flex-col p-5 lg:p-10">
            <div className="flex items-center justify-end mb-6 select-none">
                {/* <span className="font-bold text-3xl">题目列表</span> */}
                <Button>
                    <CirclePlus />
                    添加题目
                </Button>
            </div>
            <div className="w-full h-full flex">
                <div className="flex flex-col w-[150px] gap-1 select-none">
                    <span className="font-bold">Categories</span>
                    { Object.keys(cateIcon).map((cat, index) => (
                        <div key={index} className="flex items-center gap-2 px-2 pt-[6px] pb-[6px] hover:bg-foreground/10 rounded-lg transition-colors duration-300">
                            { cateIcon[cat] }
                            <span className="text-md">{ cat.substring(0, 1).toUpperCase() + cat.substring(1) }</span>
                        </div>
                    )) }
                </div>
                <div className="flex flex-col flex-1">

                </div>
            </div>
        </div>
    );
}