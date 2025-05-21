import { useEffect, useState } from "react";
import { EditChallengeView } from "./EditChallengeView";
import { AdminChallengeConfig } from "utils/A1API";
import { api } from "utils/ApiHelper";

export function EditChallengePage ({ challenge_id, lng }: { challenge_id: number, lng: string })
{
    const [ challengeInfo, setChallengeInfo ] = useState<AdminChallengeConfig>();

    useEffect(() => {
        // Fetch challenge info
        api.admin.getChallengeInfo(challenge_id).then((res) => {
            setChallengeInfo(res.data.data);
        })
    }, [challenge_id])

    return (
        <>
            { challengeInfo && <EditChallengeView challenge_info={challengeInfo} lng={lng} /> }
        </>
    );
}