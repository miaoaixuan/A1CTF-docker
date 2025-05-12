"use client";

import { CircleCheckBig, Citrus, Flag, Info, ScanHeart } from "lucide-react";
import { ChallengeSolveStatus } from "../ChallengesView";
import { UserDetailGameChallenge } from "@/utils/A1API";
import { Badge } from "../ui/badge";

export default function ChallengeNameTitle({ challengeSolveStatusList, curChallenge }: { challengeSolveStatusList: Record<number, ChallengeSolveStatus>, curChallenge: UserDetailGameChallenge }) {
    return (
        <div className={`flex items-center gap-2 px-5 h-[56px] border-2 rounded-xl bg-foreground/[0.04] backdrop-blur-md`}>
            <Info />
            <span className="font-bold text-lg">题目信息 - {curChallenge.challenge_name}</span>
            { curChallenge.hints?.length ? (
                <Badge className="select-none p-0 ml-2 rounded-[20px_20px_20px_20px] pr-[5px] pl-[4px] bg-yellow-500 hover:bg-yellow-600">
                    <div className="flex items-center gap-[6px] p-[4px]">
                        <Citrus size={20} />
                        <span className="font-bold text-[14px]">{ curChallenge.hints?.length } hints</span>
                    </div>
                </Badge>
            ) : (<></>) }
            <div className="flex-1" />
            <div className="items-center gap-4 hidden lg:flex select-none">
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