"use client";

import { MacScrollbar } from "mac-scrollbar";
import { Button } from "../ui/button";
import { CirclePlus, Copy, GalleryVerticalEnd, Pencil, Search, Squirrel, Trash2, Volleyball } from "lucide-react";
import { useTheme } from "next-themes";

import { BadgeCent, Binary, Bot, Bug, ChevronDown, ChevronUp, Chrome, CircleArrowLeft, Earth, FileSearch, Github, GlobeLock, HardDrive, MessageSquareLock, Radar, Smartphone, SquareCode } from "lucide-react"
import { useEffect, useState } from "react";
import { api, ChallengeInfoModel } from "@/utils/GZApi";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";

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
        "all": <Squirrel size={23} />,
        "misc": <Radar size={23} />,
        "crypto": <MessageSquareLock size={23} />,
        "pwn": <Bug size={23} />,
        "web": <GlobeLock size={23} />,
        "reverse": <Binary size={23} />,
        "forensics": <FileSearch size={23} />,
        "hardware": <HardDrive size={23} />,
        "mobile": <Smartphone size={23} />,
        "PPC": <SquareCode size={23} />,
        "ai": <Bot size={23} />,
        "pentent": <BadgeCent size={23} />,
        "osint": <Github size={23} />
    };

    const [ curChoicedCategory, setCurChoicedCategory ] = useState("all")
    const [ challenges, setChallenges ] = useState<ChallengeInfoModel[]>([])

    useEffect(() => {
        api.edit.editGetGameChallenges(37).then((res) => {
            setChallenges(res.data)
        })
    }, [])

    const [ searchContent, setSearchContent ] = useState("")

    const filtedData = challenges.filter((chl) => {
        if (searchContent == "") return curChoicedCategory == "all" || chl.category?.toLowerCase() == curChoicedCategory;
        else return chl.title.toLowerCase().includes(searchContent.toLowerCase()) && (curChoicedCategory == "all" || chl.category?.toLowerCase() == curChoicedCategory)
    })

    return (
        <div className="w-full h-full flex flex-col p-5 lg:p-10">
            <div className="flex items-center justify-between mb-6 select-none">
                <div className="flex gap-4 items-center w-[50%]">
                    {/* <div className="h-[36px] border-[1px] flex items-center justify-center rounded-lg gap-2 px-3">
                        <span className="font-bold text-nowrap">{ challenges.length } challenges</span>
                    </div> */}
                    <div className="h-[36px] border-[1px] flex items-center justify-center rounded-lg gap-2 px-3">
                        <Search />
                        <span className="font-bold text-nowrap">Search in { challenges.length } challengs</span>
                    </div>
                    <Input value={searchContent} onChange={(e) => setSearchContent(e.target.value)} placeholder="在这里输入就可以搜索题目标题了"></Input>
                </div>
                <Button>
                    <CirclePlus />
                    添加题目
                </Button>
            </div>
            <div className="w-full h-full flex overflow-hidden gap-2">
                <div className="flex flex-col w-[150px] gap-1 select-none flex-none">
                    <span className="font-bold mb-2">Categories</span>
                    { Object.keys(cateIcon).map((cat, index) => (
                        <Button key={index} className={`flex items-center justify-start gap-2 px-2 pt-[6px] pb-[6px] rounded-lg transition-colors duration-300`}
                            variant={curChoicedCategory === cat ? "default" : "ghost"}
                            onClick={() => setCurChoicedCategory(cat)}
                        >
                            { cateIcon[cat] }
                            <span className="text-md">{ cat.substring(0, 1).toUpperCase() + cat.substring(1) }</span>
                            <div className="flex-1"/>
                            <Badge className={`p-1 h-[20px] ${curChoicedCategory === cat ? "invert" : ""}`}>{ challenges.filter((res) => ( cat == "all" || res.category?.toLowerCase() == cat )).length }</Badge>
                        </Button>
                    )) }
                </div>
                {/* <div className="flex-1 overflow-hidden"> */}
                { filtedData.length ? (
                    <MacScrollbar className="overflow-y-auto w-full">
                        <div className="flex flex-col gap-4 w-full p-6 pt-2">
                        {
                            filtedData.map((chal, index) => (
                                <div className="w-full flex border-2 shadow-lg rounded-lg p-4 flex-none justify-between items-center" key={index}>
                                    <div className="flex gap-3">
                                        { cateIcon[chal.category?.toLowerCase() || "misc"] }
                                        <span>{ chal.title }</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant={"ghost"} size={"icon"}>
                                            <Copy />
                                        </Button>
                                        <Button variant={"ghost"} size={"icon"}>
                                            <Pencil />
                                        </Button>
                                        <Button variant={"ghost"} size={"icon"} className="hover:text-red-500">
                                            <Trash2 />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        }
                        </div>
                    </MacScrollbar>
                ) : (
                    <div className="flex w-full h-full items-center justify-center">
                        <span className="font-bold text-xl">No challenges found</span>
                    </div>
                ) }
                {/* </div> */}
            </div>
        </div>
    );
}