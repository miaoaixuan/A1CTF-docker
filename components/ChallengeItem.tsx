"use client";

import {  Sparkle, Gamepad2, ChevronsRight, Target, Crosshair, CheckCheck, Zap } from "lucide-react"

import { Label } from "@radix-ui/react-label"
import { FC } from "react"

interface ChallengeInfo {
    type: string,
    name: string,
    solved: number,
    score: number,
    rank: number,
    choiced: boolean
}

export const ChallengeItem: FC<ChallengeInfo & React.HTMLAttributes<HTMLDivElement>> = ({ type, name, solved, score, rank, choiced, ...props }) => {

    let colorClass = "bg-amber-600";

    /* 
        copied from gzctf (
        
        misc: rgb(32, 201, 151)
        crypto: rgb(132, 94, 247)
        pwn: rgb(255, 107, 107)
        web: fill: rgb(51, 154, 240)
        reverse: rgb(252, 196, 25)
        forensics: rgb(92, 124, 250)
        hardware: rgb(208, 208, 208)
        mobile: rgb(240, 101, 149)
        ppc: rgb(34, 184, 207)
        ai: rgb(148, 216, 45)
        pentent: rgb(204, 93, 232)
        osint: rgb(255, 146, 43)
    */

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

    if (type in colorMap) colorClass = colorMap[type]
    else colorClass = colorMap["misc"]

    return (
        <div className="w-full h-[100px] rounded-xl shadow-xl relative dark:shadow-white/15 dark:shadow-xl hover:scale-[1.02] duration-300 transition-all text-stone-800 pl-4 pt-4 pr-4 pb-3 select-none overflow-hidden will-change-transform"
            style={{
                backgroundColor: colorClass
            }}
            {...props} 
        >
            <div className="absolute w-[120px] h-[120px] right-[-40px] top-[-50px] rotate-[-20deg]">
                {
                    choiced && (
                        <div className="flex items-center justify-center h-full text-black">
                            <Zap fill="true" size={120} className="fill-yellow-300 text-yellow-600" />
                        </div>
                    )
                }
                
            </div>
            <div className={`flex flex-col h-full w-full`}>
                <div className="flex items-center gap-1">
                    <div id="card-title" className="flex justify-start items-center gap-2 min-w-0">
                        <Gamepad2 />
                        <Label className={`font-bold text-ellipsis whitespace-nowrap overflow-hidden`}>{ name }</Label>
                    </div>
                    <div className="flex-1" />
                    <div className="flex justify-end gap-[2px] z-20">
                        { Array(rank).fill(null).map((_, index) => (
                            <Sparkle key={index} fill="true" className="fill-yellow-500 text-yellow-500" size={20} />
                        )) }
                    </div>
                </div>
                <div className="flex-1"/>
                <div className="flex items-center">
                    <div className="flex justify-start">
                        <Label className="font-bold">{ solved } solves & { score } pts</Label>
                    </div>
                    <div className="flex-1"/>
                    <div className="flex justify-end items-center">
                        <Label className="font-bold">Try it</Label>
                        <ChevronsRight size={32}/>
                    </div>
                </div>
            </div>
        </div>
    )
}