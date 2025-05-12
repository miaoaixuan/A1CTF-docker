"use client";

import { Coins, KeyRound, LockKeyholeOpen } from "lucide-react";
import { useState } from "react";

export default function ChallengeHintCard() {

    const [ unlocked, setUnlocked ] = useState(false);

    return (
        <div className="border-2 border-foreground/20 rounded-xl w-full max-h-[350px] backdrop-blur-xl p-5"
            onClick={() => {
                setUnlocked(!unlocked);
            }}
        >
            { unlocked ? (
                <></>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                    <KeyRound size={60} />
                    <span className="text-3xl font-bold">Unlock</span>
                    <div className="flex gap-2 text-red-500 items-center">
                        <Coins size={30} />
                        <span className="font-bold text-xl">-50pts</span>
                    </div>
                </div>
            ) }
        </div>
    )
}