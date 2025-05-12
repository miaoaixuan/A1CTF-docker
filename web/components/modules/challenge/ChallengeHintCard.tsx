"use client";

import { Mdx } from "@/components/MdxCompoents";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";
import { BringToFront, CalendarClock, Coins, KeyRound, LockKeyholeOpen } from "lucide-react";
import { MacScrollbar } from "mac-scrollbar";
import { useTheme } from "next-themes";
import { useState } from "react";

export default function ChallengeHintCard(
    { hint, index, publish_time } : { hint: string, index: number, publish_time: dayjs.Dayjs }
) {

    const { theme } = useTheme()
    const [ unlocked, setUnlocked ] = useState(false);

    return (
        <div className="border-2 border-foreground/20 rounded-xl w-full relative overflow-hidden flex-none pt-5">
            {/* { !unlocked ? (
                <div className="absolute w-full h-full flex flex-col items-center justify-center gap-4 backdrop-blur-sm bg-background/40 z-40 select-none mt-[-20px]">
                    <KeyRound size={60} />
                    <Button className="font-bold text-md mt-4" variant={"default"}
                        onClick={() => {
                            setUnlocked(!unlocked);
                        }}
                    >Unlock</Button>
                    <div className="flex gap-2 text-red-500 items-center">
                        <Coins size={30} />
                        <span className="font-bold text-xl">-50pts</span>
                    </div>
                </div>
            ) : (<></>) } */}

            <div 
                className={`w-full h-full flex flex-col text-wrap break-words px-6`}
            >
                <div className="flex gap-6 select-none mb-4">
                    <div className="flex gap-2 items-center">
                        <BringToFront />
                        <span className="font-bold text-lg">Hint {index}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                        <CalendarClock />
                        <span className="font-bold text-lg">Up at { publish_time.format("YYYY-MM-DD HH:mm:ss") }</span>
                    </div>
                </div>
                <Mdx source={hint} />
            </div>
        </div>
    )
}