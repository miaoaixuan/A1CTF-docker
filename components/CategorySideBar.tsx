"use client";

import { CircleArrowLeft } from "lucide-react"

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

import { ChallengeCard } from "./ChallengeCard";
import { SWRConfiguration } from 'swr'
import api, { ChallengeInfo, ChallengeDetailModel, GameDetailModel } from '@/utils/GZApi'

import { AxiosError } from 'axios';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { TransitionLink } from "./TransitionLink";

import { MacScrollbar } from 'mac-scrollbar';
import { useTheme } from "next-themes";
import SafeComponent from "./SafeComponent";

export function CategorySidebar({ gameid, curChallenge, setCurChallenge, setGameDetail, lng, resizeTrigger, setPageSwitching, challenges, setChallenges, challengeSolvedList, setChallengeSolvedList } : { 
    gameid: string,
    curChallenge: ChallengeDetailModel,
    setCurChallenge: Dispatch<SetStateAction<ChallengeDetailModel>>,
    setGameDetail: Dispatch<SetStateAction<GameDetailModel>>,
    lng: string,
    resizeTrigger: Dispatch<SetStateAction<number>>,
    setPageSwitching: Dispatch<SetStateAction<boolean>>,
    challenges: Record<string, ChallengeInfo[]>,
    setChallenges: Dispatch<SetStateAction<Record<string, ChallengeInfo[]>>>,
    challengeSolvedList: Record<string, boolean>,
    setChallengeSolvedList: Dispatch<SetStateAction<Record<string, boolean>>>
}) {

    const { theme } = useTheme()

    // 比赛 ID
    const gameID = parseInt(gameid, 10)

    // 为了实时更新
    const curChallengeRef = useRef<ChallengeDetailModel>({})

    // 之前的题目列表
    const prevChallenges = useRef<Record<string, ChallengeInfo[]>> ()
    const prevGameDetail = useRef<GameDetailModel> ()

    // 懒加载, 当前题目卡片是否在视窗内
    const observerRef = useRef<IntersectionObserver | null>(null);
    const [visibleItems, setVisibleItems] = useState<Record<string, Record<string, boolean>>>({});
    
    // 更新题目列表
    const updateChalenges = () => {

        api.game.gameChallengesWithTeamInfo(gameID).then((response) => {

            if (JSON.stringify(prevChallenges.current) == JSON.stringify(response.data.challenges)) return
            prevChallenges.current = response.data.challenges
            setChallenges(response.data.challenges || {})

            if (JSON.stringify(prevGameDetail.current) == JSON.stringify(response.data)) return
            prevGameDetail.current = response.data
            setGameDetail(response.data)

            let stillExists = false

            for (const key in response.data.challenges) {
                if (response.data.challenges.hasOwnProperty(key)) {
                    response.data.challenges[key].forEach(challenge => {
                        // console.log(challenge.title, curChallengeRef.current.title)
                        if (challenge.title == curChallengeRef.current.title) {
                            stillExists = true
                        }
                    });

                    // 初始化一次先
                    response.data.challenges[key].forEach(challenge => {
                        setChallengeSolvedList((prev) => ({
                            ...prev,
                            [challenge.id || 0]: prevGameDetail.current?.rank?.solvedChallenges?.some(obj => obj.id == challenge.id) || false
                        }))
                    });
                }
            }

            if (!stillExists) {
                setCurChallenge({})
                curChallengeRef.current = {}
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
        })
    }

    useEffect(() => {
        updateChalenges()

        const iter = setInterval(() => {
            updateChalenges()
        }, 5000)
        // eslint-disable-next-line react-hooks/exhaustive-deps
        return () => { clearInterval(iter) }
    }, [gameID])


    useEffect(() => {
        // 更新题目的解决状态
        for (const key in Object.keys(challenges)) {
            if (challenges.hasOwnProperty(key)) {
                challenges[key].forEach(challenge => {
                    setChallengeSolvedList((prev) => ({
                        ...prev,
                        [challenge.id || 0]: prevGameDetail.current?.rank?.solvedChallenges?.some(obj => obj.id == challenge.id) || false
                    }))
                });
            }
        }
    }, [challenges])

    // 处理切换题目
    const handleChangeChallenge = (id: number) => {
        return (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {

            if (id == curChallenge.id) return

            api.game.gameGetChallenge(gameID, id).then((response) => {
                // console.log(response)
                curChallengeRef.current = response.data
                setCurChallenge(response.data || {})
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
                    >
                        <SidebarGroup>
                            <div className="flex justify-center w-full items-center pl-2 pr-2 pt-2">
                                <div className="justify-start flex gap-2 items-center mt-[-6px]">
                                    <Image
                                        className="dark:invert transition-all duration-300"
                                        src="/images/A1natas.svg"
                                        alt="A1natas"
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
                            <div className="pl-[7px] pr-[7px]">
                                {Object.entries(challenges ?? {}).map(([category, challengeList]) => (
                                    <div key={category}>
                                        {/* Sidebar Group Label */}
                                        <SidebarGroupLabel className="text-[0.9em] transition-colors duration-300">{category}</SidebarGroupLabel>
                                        <SidebarGroupContent>
                                            <SidebarMenu>
                                            <div className="flex flex-col pl-2 pr-2 pb-2 gap-3">
                                                {/* Render all ChallengeItems for this category */}
                                                {challengeList.map((challenge, index) => (
                                                    <div
                                                        key={index}
                                                        ref={(el) => observeItem(el!, category, challenge.id?.toString() || "")}
                                                    >
                                                        {visibleItems[category]?.[challenge.id || 0] ? (
                                                            <ChallengeCard
                                                                type={challenge.category?.toLocaleLowerCase() || "None"}
                                                                name={challenge.title || "None"}
                                                                solved={challenge.solved || 0}
                                                                score={challenge.score || 0}
                                                                rank={3}
                                                                choiced={curChallenge.id == challenge.id}
                                                                onClick={handleChangeChallenge(challenge.id || 0)}
                                                                status={challengeSolvedList[challenge.id || 0]}
                                                            />
                                                        ) : (
                                                            <div className="h-[100px]"></div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
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
