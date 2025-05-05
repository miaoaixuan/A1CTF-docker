"use client";

import { BadgeCent, Binary, Bot, Bug, ChevronDown, ChevronUp, Chrome, CircleArrowLeft, Earth, FileSearch, Github, GlobeLock, HardDrive, MessageSquareLock, Radar, Smartphone, SquareCode, Underline } from "lucide-react"

import Image from "next/image";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
} from "@/components/ui/sidebar"

import { Button } from "./ui/button"

import { motion } from "framer-motion";

import { ChallengeCard } from "./ChallengeCard";
// import { api, ChallengeInfo, ChallengeDetailModel, GameDetailModel, ErrorMessage, ParticipationStatus } from '@/utils/GZApi'

import { AxiosError } from 'axios';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { TransitionLink } from "./TransitionLink";

import { MacScrollbar } from 'mac-scrollbar';
import { useTheme } from "next-themes";
import SafeComponent from "./SafeComponent";

import { randomInt } from "mathjs";
import { toast } from "sonner";
import { ErrorMessage, ParticipationStatus, UserDetailGameChallenge, UserFullGameInfo, UserSimpleGameChallenge } from "@/utils/A1API";
import { api } from "@/utils/ApiHelper";
import { ChallengeSolveStatus } from "./ChallengesView";
import { useGlobalVariableContext } from "@/contexts/GlobalVariableContext";

export function CategorySidebar({ gameid, curChallenge, setCurChallenge, lng, gameStatus, setGameStatus, resizeTrigger, setPageSwitching, challenges, setChallenges, challengeSolveStatusList, setChallengeSolveStatusList } : { 
    gameid: string,
    curChallenge: UserDetailGameChallenge | undefined,
    setCurChallenge: Dispatch<SetStateAction<UserDetailGameChallenge | undefined>>,
    // setGameDetail: Dispatch<SetStateAction<UserFullGameInfo>>,
    lng: string,
    gameStatus: string,
    setGameStatus: Dispatch<SetStateAction<string>>,
    resizeTrigger: Dispatch<SetStateAction<number>>,
    setPageSwitching: Dispatch<SetStateAction<boolean>>,
    challenges: Record<string, UserSimpleGameChallenge[]>,
    setChallenges: Dispatch<SetStateAction<Record<string, UserSimpleGameChallenge[]>>>,
    challengeSolveStatusList: Record<string, ChallengeSolveStatus>,
    setChallengeSolveStatusList: Dispatch<SetStateAction<Record<string, ChallengeSolveStatus>>>,
}) {

    const { theme } = useTheme()

    // 比赛 ID
    const gameID = parseInt(gameid, 10)

    // 为了实时更新
    const curChallengeRef = useRef<UserDetailGameChallenge>()

    // 之前的题目列表
    const prevChallenges = useRef<Record<string, UserSimpleGameChallenge[]>> ()
    const prevGameDetail = useRef<UserFullGameInfo> ()

    // 懒加载, 当前题目卡片是否在视窗内
    const observerRef = useRef<IntersectionObserver | null>(null);
    const [visibleItems, setVisibleItems] = useState<Record<string, Record<string, boolean>>>({});

    const [categoryFolded, setCategoryFolded] = useState<Record<string, boolean>>({});
    const [categoryPadding, setCategoryPadding] = useState<Record<string, boolean>>({});

    let updateChallengeInter: NodeJS.Timeout;

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

    const cateIcon : { [key: string]: any } = {
        "misc": <Radar size={23} />,
        "crypto": <MessageSquareLock size={23} />,
        "pwn": <Bug size={23} />,
        "web": <GlobeLock size={23} />,
        "reverse": <Binary size={23} />,
        "forensics": <FileSearch size={23} />,
        "hardware": <HardDrive size={23} />,
        "mobile": <Smartphone size={23} />,
        "ppc": <SquareCode size={23} />,
        "ai": <Bot size={23} />,
        "pentent": <BadgeCent size={23} />,
        "osint": <Github size={23} />
    };

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
                const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                if (errorMessage.message == "您的参赛申请尚未通过或被禁赛") {
                    // 停止更新
                    clearInterval(updateChallengeInter)

                    // FIXME 作弊判断需要修复
                    // api.game.gameGame(gameID).then((res) => {
                    //     if (res.data.status == ParticipationStatus.Banned) {
                    //         setGameStatus("banned")
                    //     } else {
                    //         toast.error("Unknow error!", { position: "top-center" })
                    //     }
                    // })
                }
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
            }).catch((error: AxiosError) => {})
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

    return (
        <Sidebar className="backdrop-blur-sm hide-scrollbar select-none transition-all duration-200" onTransitionEnd={() => {
            resizeTrigger(Math.floor(Math.random() * 1000000))
        }} >
            <SidebarContent>
                <SafeComponent>
                    <MacScrollbar 
                        skin={theme ==  "light" ? "light" : "dark"}
                        trackStyle={(horizontal) => ({ [horizontal ? "height" : "width"]: 0, borderWidth: 0})}
                        thumbStyle={(horizontal) => ({ [horizontal ? "height" : "width"]: 6})}
                        className="pr-1 pl-1"
                    >
                        <SidebarGroup>
                            <div className="flex justify-center w-full items-center pl-2 pr-2 pt-2">
                                <div className="justify-start flex gap-2 items-center mt-[-6px]">
                                    <Image
                                        className="dark:invert transition-all duration-300"
                                        src={clientConfig.SVGIcon}
                                        alt={clientConfig.SVGAltData}
                                        width={40}
                                        height={40}
                                        priority
                                    />
                                    <span className="font-bold text-xl transition-colors duration-300">A1CTF</span>
                                </div>
                                <div className="flex-1" />
                                <div className="justify-end">
                                    <Button className="rounded-3xl p-4 pointer-events-auto w-[100px] mt-[5px] ml-[5px] mb-[10px]" asChild>
                                        <TransitionLink className="transition-colors" href={`/${lng}/games`}>
                                            <CircleArrowLeft/>
                                            <span>Back</span>
                                        </TransitionLink>
                                    </Button>
                                </div>
                            </div>
                            <div className="pl-[7px] pr-[7px] mt-2">
                                {Object.entries(challenges ?? {}).map(([category, challengeList]) => (
                                    <div key={category} className="mb-2">
                                        {/* Sidebar Group Label */}
                                        <SidebarGroupLabel className="text-[0.9em] transition-colors duration-300 h-10">
                                            <div className="flex items-center w-full" onClick={() => {
                                                setCategoryFolded((prev) => ({
                                                    ...prev,
                                                    [category.toLowerCase()]: !prev[category.toLowerCase()]
                                                }))
                                            }}>
                                                <div className="flex items-center justify-center gap-2 transition-colors duration-300"
                                                    style={{
                                                        color: (!categoryFolded[category.toLowerCase()] || curChallenge?.category?.toString() === category) ? colorMap[category.toLowerCase()] : ""
                                                    }}
                                                >
                                                    { cateIcon[category.toLowerCase()] }
                                                    <span className="font-bold text-[1.1em]" style={{
                                                        // color: colorMap[category.toLowerCase()]
                                                    }}>{category}</span>
                                                </div>
                                                <div className="flex-1" />
                                                <div className="justify-end">
                                                    <Button variant={"ghost"} size={"icon"}>
                                                        <ChevronDown className={`transition-transform duration-300 ${ categoryFolded[category.toLowerCase()] ? "" : "rotate-180" }`} />
                                                    </Button>
                                                </div>
                                            </div>
                                        </SidebarGroupLabel>
                                        <SidebarGroupContent>
                                            <SidebarMenu className="">
                                                <motion.div className={`flex flex-col gap-3 overflow-hidden ${ categoryPadding[category.toLowerCase()] ? "p-2" : "" } ${categoryFolded[category.toLowerCase()] ? "pointer-events-none" : ""}`}
                                                    initial={{
                                                        height: categoryFolded[category.toLowerCase()] ? 0 : "auto",
                                                        // padding: categoryFolded[category.toLowerCase()] ? 0 : "8px"
                                                    }}
                                                    animate={{
                                                        height: categoryFolded[category.toLowerCase()] ? 0 : "auto",
                                                        // padding: categoryFolded[category.toLowerCase()] ? 0 : "8px"
                                                    }}
                                                    onAnimationComplete={(e: { height: number | string, padding: number }) => {
                                                        if (e.height === 0) {
                                                            setCategoryPadding((prev) => ({
                                                                ...prev,
                                                                [category.toLowerCase()]: false
                                                            }))
                                                        }
                                                    }}
                                                    onAnimationStart={(e: { height: number | string, padding: number }) => {
                                                        if (e.height === "auto") {
                                                            setCategoryPadding((prev) => ({
                                                                ...prev,
                                                                [category.toLowerCase()]: true
                                                            }))
                                                        }
                                                    }}
                                                    transition={{
                                                        ease: "linear",
                                                        duration: challengeList.length > 3 ? 0.3 : 0.2
                                                    }}
                                                >
                                                    {/* Render all ChallengeItems for this category */}
                                                    {challengeList.map((challenge, index) => (
                                                        <div
                                                            key={index}
                                                            ref={(el) => observeItem(el!, category, challenge.challenge_id?.toString() || "")}
                                                        >
                                                            { (visibleItems[category]?.[challenge?.challenge_id ?? 0] && categoryPadding[category.toLowerCase()]) ? (
                                                                <ChallengeCard
                                                                    type={challenge.category?.toLocaleLowerCase() || "None"}
                                                                    name={challenge?.challenge_name ?? "None"}
                                                                    solved={challenge?.solve_count ?? 0}
                                                                    score={challenge?.cur_score ?? 0}
                                                                    rank={3}
                                                                    choiced={curChallenge?.challenge_id == challenge.challenge_id}
                                                                    onClick={handleChangeChallenge(challenge?.challenge_id ?? 0)}
                                                                    status={challengeSolveStatusList[challenge?.challenge_id ?? 0].solved}
                                                                />
                                                            ) : (
                                                                <div className="h-[100px]"></div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            </SidebarMenu>
                                        </SidebarGroupContent>
                                    </div>
                                ))}

                            </div>
                        </SidebarGroup>
                    </MacScrollbar>
                </SafeComponent>
            </SidebarContent>
        </Sidebar>
    )
}
