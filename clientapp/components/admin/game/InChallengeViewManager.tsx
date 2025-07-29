import { Button } from "components/ui/button";
import ChallengeManageSheet from "./ChallengeManageSheet";
import { Loader2, PanelTopClose, PanelTopOpen, Wrench } from "lucide-react";
import { api } from "utils/ApiHelper";
import { UserDetailGameChallenge, UserSimpleGameChallenge } from "utils/A1API";
import { Dispatch, SetStateAction, useState } from "react";

export default function InChallengeViewManager(
    { gameID, curChallenge, setCurChallenge, setChallenges } : {
        gameID: number,
        curChallenge: UserDetailGameChallenge | undefined,
        setCurChallenge: Dispatch<SetStateAction<UserDetailGameChallenge | undefined>>,
        setChallenges: Dispatch<SetStateAction<Record<string, UserSimpleGameChallenge[]>>>,
    }
) {

    const [switchVisibleLoading, setSwitchVisibleLoading] = useState(false)

    const switchVisible = () => {
        setSwitchVisibleLoading(true)
        api.admin.updateGameChallenge(gameID, curChallenge?.challenge_id ?? 0, {
            visible: !curChallenge?.visible
        }).then((res) => {
            if (curChallenge) {
                setSwitchVisibleLoading(false)
                setCurChallenge({
                    ...curChallenge,
                    visible: !curChallenge.visible
                });

                setChallenges((prev) => ({
                    ...prev,
                    [curChallenge.category?.toLocaleLowerCase() ?? "0"]: prev[curChallenge.category?.toLocaleLowerCase() ?? "0"].map((c) => {
                        console.log(c)
                        if (c.challenge_id == curChallenge.challenge_id) {
                            return {
                                ...c,
                                visible: !c.visible
                            }
                        }
                        return c
                    })
                }))
            }
        })
    }

    return (
        <div className="absolute bottom-0 left-0 p-5 z-10 flex flex-col gap-2">
            <Button variant="ghost" size="icon"
                className={`rounded-xl w-12 h-12 [&_svg]:size-6 bg-foreground/10 hover:hover:bg-foreground/20 cursor-pointer ${curChallenge?.visible ? "text-red-400" : "text-blue-400"}`}
                data-tooltip-id="my-tooltip"
                data-tooltip-html={curChallenge?.visible ? "下线题目" : "上线题目"}
                data-tooltip-place="right"
                disabled={switchVisibleLoading}
                onClick={switchVisible}
            >
                {switchVisibleLoading ? (
                    <Loader2 className="animate-spin" />
                ) : curChallenge?.visible ? <PanelTopOpen /> : <PanelTopClose />}
            </Button>
            <ChallengeManageSheet
                gameID={gameID}
                challengeID={curChallenge?.challenge_id ?? 0}
            >
                <Button variant="ghost" size="icon" className="rounded-xl w-12 h-12 [&_svg]:size-6 bg-foreground/10 hover:hover:bg-foreground/20 cursor-pointer"
                    data-tooltip-id="my-tooltip"
                    data-tooltip-html="妙妙小工具"
                    data-tooltip-place="right"
                >
                    <Wrench />
                </Button>
            </ChallengeManageSheet>
        </div>
    )
}