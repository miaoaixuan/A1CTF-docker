import {  Sparkle, Gamepad2, ChevronsRight } from "lucide-react"

import { Label } from "@radix-ui/react-label"
import { FC } from "react"

interface ChallengeInfo {
    type: string,
    name: string,
    solved: number,
    score: number,
    rank: number
}

export const ChallengeItem: FC<ChallengeInfo> = ({ type, name, solved, score, rank }) => {

    var colorClass = "bg-amber-600";

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
        <div className="w-full h-[100px] rounded-xl shadow-xl dark:shadow-white/15 dark:shadow-xl hover:scale-[1.02] duration-300 transition-all text-stone-800 pl-4 pt-4 pr-4 pb-4 select-none"
            style={{
                backgroundColor: colorClass
            }}
        >
            <div className="flex flex-col h-full w-full">
                <div className="flex items-center">
                    <div id="card-title" className="flex justify-start items-center gap-2">
                        <Gamepad2 />
                        <Label className="font-bold">{ name }</Label>
                    </div>
                    <div className="flex-1" />
                    <div className="flex justify-end gap-[2px]">
                        { Array(rank).fill(null).map((_) => (
                            <Sparkle size={20} />
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
                        <ChevronsRight />
                    </div>
                </div>
            </div>
        </div>
    )
}