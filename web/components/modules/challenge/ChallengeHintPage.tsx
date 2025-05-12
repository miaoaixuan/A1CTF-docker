"use client";

import ChallengeHintCard from "./ChallengeHintCard";

export default function ChallengeHintPage() {
    return (
        <>
            <div className="absolute top-0 left-0 w-screen h-screen backdrop-blur-md z-30" />
            <div className="absolute top-0 left-0 w-screen h-screen flex flex-col justify-center items-center z-30 overflow-hidden select-none p-10">
                <div className="w-full">
                    <span className="font-bold text-3xl">Hint store</span>
                </div>
                <div className="w-full p-10 h-full flex flex-col items-center gap-4">
                    { new Array(3).fill(0).map((_, index) => (
                        <ChallengeHintCard key={index} />
                    ))}
                </div>
            </div>
        </>
    )
}