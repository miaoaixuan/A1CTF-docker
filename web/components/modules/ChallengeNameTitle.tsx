"use client";

import { CircleCheckBig, Flag, Info, ScanHeart } from "lucide-react";
import { ChallengeSolveStatus } from "../ChallengesView";
import { UserDetailGameChallenge } from "@/utils/A1API";

export default function ChallengeNameTitle({ challengeSolveStatusList, curChallenge }: { challengeSolveStatusList: Record<number, ChallengeSolveStatus>, curChallenge: UserDetailGameChallenge }) {
    return (
        <div className={`flex items-center gap-2 px-5 py-3 border-2 rounded-xl bg-foreground/[0.04] backdrop-blur-md`}>
            <Info />
            <span className="font-bold text-lg">题目信息 - {curChallenge.challenge_name}</span>
            <div className="flex-1" />
            <div className="items-center gap-4 hidden lg:flex">
                {challengeSolveStatusList[curChallenge.challenge_id || 0].solved ? (
                    <div className="flex items-center gap-2 text-purple-600">
                        <ScanHeart className="flex-none " />
                        <span className="text-sm lg:text-md font-bold">{challengeSolveStatusList[curChallenge.challenge_id || 0].cur_score ?? "?"} pts</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-amber-600">
                        <Flag className="flex-none" />
                        <span className="text-sm lg:text-md font-bold">{challengeSolveStatusList[curChallenge.challenge_id || 0].cur_score ?? "?"} pts</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-green-600">
                    <CircleCheckBig />
                    <span className="text-sm lg:text-md font-bold">{challengeSolveStatusList[curChallenge.challenge_id || 0].solve_count ?? "?"} solves</span>
                </div>
            </div>
        </div>
    )
}