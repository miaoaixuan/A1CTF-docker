import { BadgeCent, Binary, Bot, Bug, ChevronDown, ChevronUp, Chrome, CircleArrowLeft, Earth, FileSearch, Github, GlobeLock, HardDrive, Loader2, MessageSquareLock, Radar, Smartphone, SquareCode, Underline } from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
} from "components/ui/sidebar"

import { Button } from "components/ui/button"

import { AxiosError } from 'axios';
import { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef, useState } from "react";

import { MacScrollbar } from 'mac-scrollbar';
import { useTheme } from "next-themes";
import SafeComponent from "components/SafeComponent";

import { randomInt } from "mathjs";
import { toast } from "sonner";
import { ErrorMessage, ParticipationStatus, UserDetailGameChallenge, UserFullGameInfo, UserSimpleGameChallenge } from "utils/A1API";
import { api } from "utils/ApiHelper";
import { ChallengeSolveStatus } from "components/user/game/ChallengesView";
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";
import CategoryChallenges from "components/modules/game/CategoryChallenges";
import { challengeCategoryColorMap, challengeCategoryIcons } from "utils/ClientAssets";
import LoadingModule from "components/modules/LoadingModule";
import { useNavigate } from "react-router";

export function CategorySidebar({
    gameid,
    curChallenge,
    setCurChallenge,
    curChallengeRef,
    gameStatus,
    setGameStatus,
    resizeTrigger,
    setPageSwitching,
    challenges,
    setChallenges,
    challengeSolveStatusList,
    setChallengeSolveStatusList,
    loadingVisible,
    gameInfo
}: {
    gameid: string,
    curChallenge: UserDetailGameChallenge | undefined,
    setCurChallenge: Dispatch<SetStateAction<UserDetailGameChallenge | undefined>>,
    gameStatus: string,
    curChallengeRef: MutableRefObject<UserDetailGameChallenge | undefined>,
    setGameStatus: Dispatch<SetStateAction<string>>,
    resizeTrigger: Dispatch<SetStateAction<number>>,
    setPageSwitching: Dispatch<SetStateAction<boolean>>,
    challenges: Record<string, UserSimpleGameChallenge[]>,
    setChallenges: Dispatch<SetStateAction<Record<string, UserSimpleGameChallenge[]>>>,
    challengeSolveStatusList: Record<string, ChallengeSolveStatus>,
    setChallengeSolveStatusList: Dispatch<SetStateAction<Record<string, ChallengeSolveStatus>>>,
    loadingVisible: boolean,
    gameInfo: UserFullGameInfo | undefined
}) {

    const { theme } = useTheme()

    // 比赛 ID
    const gameID = parseInt(gameid, 10)

    // 为了实时更新


    // 之前的题目列表
    const prevChallenges = useRef<Record<string, UserSimpleGameChallenge[]>>()
    const prevGameDetail = useRef<UserFullGameInfo>()

    // 懒加载, 当前题目卡片是否在视窗内
    const observerRef = useRef<IntersectionObserver | null>(null);
    const [visibleItems, setVisibleItems] = useState<Record<string, Record<string, boolean>>>({});

    const [categoryFolded, setCategoryFolded] = useState<Record<string, boolean>>({});
    const [categoryPadding, setCategoryPadding] = useState<Record<string, boolean>>({});

    let updateChallengeInter: NodeJS.Timeout;

    const colorMap: { [key: string]: string } = challengeCategoryColorMap

    const cateIcon: { [key: string]: any } = challengeCategoryIcons

    useEffect(() => {
        const foldMap: Record<string, boolean> = {};
        Object.keys(colorMap).forEach((key) => foldMap[key] = true);

        setCategoryFolded(foldMap)
    }, [])

    // 更新题目列表
    const updateChalenges = (first?: boolean) => {

        api.user.userGetGameChallenges(gameID).then((res) => {

            const response = res.data

            // 根据 Category 分组

            const groupedChallenges: Record<string, UserSimpleGameChallenge[]> = {};
            response.data.challenges.forEach((challenge: UserSimpleGameChallenge) => {
                const category = challenge.category?.toLowerCase() || "misc";
                if (!groupedChallenges[category]) {
                    groupedChallenges[category] = [];
                }
                groupedChallenges[category].push(challenge);
            });

            if (JSON.stringify(prevChallenges.current) == JSON.stringify(groupedChallenges)) return
            prevChallenges.current = groupedChallenges
            setChallenges(groupedChallenges || {})

            // if (JSON.stringify(prevGameDetail.current) == JSON.stringify(response.data)) return
            // prevGameDetail.current = groupedChallenges
            // setGameDetail(response.data)

            let stillExists = false

            for (const key in groupedChallenges) {
                if (groupedChallenges.hasOwnProperty(key)) {
                    groupedChallenges[key].forEach(challenge => {
                        // console.log(challenge.title, curChallengeRef.current.title)
                        if (challenge.challenge_name == curChallengeRef.current?.challenge_name) {
                            stillExists = true
                        }
                    });

                    // 初始化一次先
                    groupedChallenges[key].forEach(challenge => {
                        setChallengeSolveStatusList((prev) => ({
                            ...prev,
                            [challenge.challenge_id || 0]: {
                                solved: response.data.solved_challenges?.some(obj => obj.challenge_id == challenge.challenge_id) ?? false,
                                solve_count: challenge.solve_count ?? 0,
                                cur_score: challenge.cur_score ?? 0,
                            }
                        }))
                    });
                }
            }

            if (!stillExists) {
                setCurChallenge(undefined)
                curChallengeRef.current = undefined
            }

            observerRef.current = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const target = entry.target as HTMLElement;

                    const id = target.dataset.id as string;
                    const category = target.dataset.category as string;


                    if (entry.isIntersecting) {
                        setVisibleItems((prev) => ({
                            ...prev,
                            [category]: {
                                ...(prev[category] || {}),
                                [id]: true, // 标记为可见
                            },
                        }));
                    } else {
                        setVisibleItems((prev) => ({
                            ...prev,
                            [category]: {
                                ...(prev[category] || {}),
                                [id]: false, // 标记为不可见
                            },
                        }));
                    }
                }
                );
            },
                {
                    rootMargin: "200px 0px",
                });

        }).catch((error: AxiosError) => {
            if (error.response?.status == 400) {
                clearInterval(updateChallengeInter)

                api.user.userGetGameInfoWithTeamInfo(gameID).then((res) => {
                    if (res.data.data.team_status == ParticipationStatus.Banned) {
                        setGameStatus("banned")
                    } else {
                        toast.error("Unknow error!")
                    }
                })
            }
        })
    }

    useEffect(() => {

        if (gameStatus == "running" || gameStatus == "practiceMode") {
            updateChalenges(true)

            updateChallengeInter = setInterval(() => {
                updateChalenges()
            }, randomInt(4000, 5000))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        return () => { if (updateChallengeInter) clearInterval(updateChallengeInter) }
    }, [gameStatus])


    useEffect(() => {
        // 更新题目的解决状态
        // FIXME 更新题目解决状态需要修复
        // for (const key in Object.keys(challenges)) {
        //     if (challenges.hasOwnProperty(key)) {
        //         challenges[key].forEach(challenge => {
        //             setChallengeSolvedList((prev) => ({
        //                 ...prev,
        //                 [challenge.id || 0]: prevGameDetail.current?.rank?.solvedChallenges?.some(obj => obj.id == challenge.id) || false
        //             }))
        //         });
        //     }
        // }
    }, [challenges])

    // 处理切换题目
    const handleChangeChallenge: (id: number) => React.MouseEventHandler<HTMLDivElement> = (id: number) => {
        return (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {

            if (id == curChallenge?.challenge_id) return

            api.user.userGetGameChallenge(gameID, id).then((response) => {
                // console.log(response)
                curChallengeRef.current = response.data.data
                setCurChallenge(response.data.data)
                setPageSwitching(true)
            }).catch((error: AxiosError) => { })
        };
    };

    // 懒加载
    const observeItem = (el: HTMLElement, category: string, id: string) => {
        if (el && observerRef.current) {
            el.dataset.id = id;
            el.dataset.category = category;
            observerRef.current.observe(el);
        }
    };

    const { clientConfig } = useGlobalVariableContext()

    const navigate = useNavigate()

    const getGameIcon = () => {
        if (theme === "dark") {
            return gameInfo?.game_icon_dark ?? clientConfig.SVGIcon
        } else {
            return gameInfo?.game_icon_light ?? clientConfig.SVGIcon
        }
    }

    return (
        <Sidebar className="hide-scrollbar select-none transition-all duration-200 ml-16" onTransitionEnd={() => {
            resizeTrigger(Math.floor(Math.random() * 1000000))
        }} >
            <SidebarContent>
                <MacScrollbar
                    skin={theme == "light" ? "light" : "dark"}
                    trackStyle={(horizontal) => ({ [horizontal ? "height" : "width"]: 0, borderWidth: 0 })}
                    thumbStyle={(horizontal) => ({ [horizontal ? "height" : "width"]: 6 })}
                    className="pr-1 pl-1 h-full"
                >
                    <SidebarGroup className="h-full">
                        <div className="flex justify-center w-full items-center pl-2 pr-2 pt-6 mb-2">
                            <div className="justify-start flex gap-4 items-center">
                                <img
                                    className="transition-all duration-300"
                                    src={clientConfig.SVGIcon}
                                    alt={clientConfig.SVGAltData}
                                    width={40}
                                    height={40}
                                />
                                <span className="font-bold text-xl transition-colors duration-300">A1CTF Platform</span>
                            </div>
                            <div className="flex-1" />
                        </div>

                        {!loadingVisible ? (
                            <div className="pl-[7px] pr-[7px] mt-2">
                                {
                                    Object.entries(challenges ?? {}).map(([category, challengeList]) => (
                                        <CategoryChallenges
                                            key={category}
                                            category={category}
                                            challengeList={challengeList}
                                            curChallenge={curChallenge}
                                            observeItem={observeItem}
                                            visibleItems={visibleItems}
                                            handleChangeChallenge={handleChangeChallenge}
                                            challengeSolveStatusList={challengeSolveStatusList}
                                        />
                                    ))
                                }
                            </div>
                        ) : (
                            <LoadingModule />
                        )}
                    </SidebarGroup>
                </MacScrollbar>
            </SidebarContent>
        </Sidebar>
    )
}
