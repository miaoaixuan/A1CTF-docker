"use client";

import { useEffect, useState } from "react";
import { EditChallengeView } from "./EditChallengeView";
import { ChallengeConfig, GameInfo } from "@/utils/A1API";
import { api } from "@/utils/ApiHelper";
import { EditGameView } from "./EditGameView";

export function EditGamePage ({ challenge_id, lng }: { challenge_id: number, lng: string })
{
    const [ challengeInfo, setChallengeInfo ] = useState<ChallengeConfig>();

    useEffect(() => {
        // Fetch challenge info
        // api.admin.getChallengeInfo({ challenge_id: challenge_id }).then((res) => {
        //     setChallengeInfo(res.data.data);
        // })
    }, [challenge_id])

    return (
        <>
            {/* { challengeInfo && <EditChallengeView challenge_info={challengeInfo} lng={lng} /> } */}
            <EditGameView lng={lng} game_info={{ name: "114514", stages: [] } as GameInfo} />
        </>
    );
}