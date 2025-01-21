"use client";

import { Calendar, CircleArrowLeft, Home, Inbox, Search, Settings } from "lucide-react"

import Image from "next/image";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "./ui/button"
import { Label } from "@radix-ui/react-label"

import { ChallengeItem } from "./ChallengeItem";
import { Cache, SWRConfiguration } from 'swr'
import api, { ChallengeInfo, ChallengeDetailModel, GameDetailModel } from '@/utils/GZApi'

const OnceSWRConfig: SWRConfiguration = {
    refreshInterval: 0,
    revalidateOnFocus: false,
}

import { AxiosError } from 'axios';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { TransitionLink } from "./TransitionLink";

export function CategorySidebar({ gameid, setChallenge, setGameDetail, lng } : { 
    gameid: string, 
    setChallenge: Dispatch<SetStateAction<ChallengeDetailModel>>,
    setGameDetail: Dispatch<SetStateAction<GameDetailModel>>,
    lng: string
}) {

    const gmid = parseInt(gameid, 10)
    const [ challenges, setChallenges ] = useState<Record<string, ChallengeInfo[]>> ()
    const [ CurChallenge, setCurChallenge ] = useState<ChallengeDetailModel>({})

    const prevChallenges = useRef<Record<string, ChallengeInfo[]>> ()
    const prevGameDetail = useRef<GameDetailModel> ()

    const observerRef = useRef<IntersectionObserver | null>(null);
    const [visibleItems, setVisibleItems] = useState<Record<string, Record<string, boolean>>>({});

    const updateChalenges = () => {
        api.game.gameChallengesWithTeamInfo(gmid).then((response) => {

            if (JSON.stringify(prevChallenges.current) == JSON.stringify(response.data.challenges)) return
            prevChallenges.current = response.data.challenges
            setChallenges(response.data.challenges)

            if (JSON.stringify(prevGameDetail.current) == JSON.stringify(response.data)) return
            prevGameDetail.current = response.data
            setGameDetail(response.data)

            let stillExists = false

            for (const key in challenges) {
                if (challenges.hasOwnProperty(key)) {
                    challenges[key].forEach(challenge => {
                        if (challenge.title == CurChallenge.title) {
                            stillExists = true
                        }
                    });
                }
            }

            if (!stillExists) {
                setCurChallenge({})
                setChallenge({})
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
    }, [gmid])

    const handleChangeChallenge = (id: number) => {
        return (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {

            if (id == CurChallenge.id) return

            api.game.gameGetChallenge(gmid, id).then((response) => {
                // console.log(response)
                setChallenge(response.data || {})
                setCurChallenge(response.data || {})
            }).catch((error: AxiosError) => {})
        };
    };

    const observeItem = (el: HTMLElement, category: string, id: string) => {
        if (el && observerRef.current) {
            el.dataset.id = id;
            el.dataset.category = category;
            observerRef.current.observe(el);
        }
    };
    
    return (
        <Sidebar className="backdrop-blur-sm hide-scrollbar select-none transition-all duration-200">
            <SidebarContent>
                <SidebarGroup>
                    <div className="flex justify-center w-full items-center pl-2 pr-2 pt-2">
                        <div className="justify-start flex gap-2 items-center mt-[-6px]">
                            <Image
                                className="dark:invert"
                                src="/images/A1natas.svg"
                                alt="A1natas"
                                width={40}
                                height={40}
                                priority
                            />
                            <Label className="font-bold text-xl">A1CTF</Label>
                        </div>
                        <div className="flex-1" />
                        <div className="justify-end">
                            <Button className="rounded-3xl p-4 pointer-events-auto w-[100px] mt-[5px] ml-[5px] mb-[10px]" asChild>
                                <TransitionLink className="transition-colors" href={`/${lng}/games`}>
                                    <CircleArrowLeft/>
                                    <Label>Back</Label>
                                </TransitionLink>
                            </Button>
                        </div>
                    </div>
                    <div className="pl-[7px] pr-[7px]">
                        {Object.entries(challenges ?? {}).map(([category, challengeList]) => (
                            <div key={category}>
                                {/* Sidebar Group Label */}
                                <SidebarGroupLabel className="text-[0.9em]">{category}</SidebarGroupLabel>
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
                                                    <ChallengeItem
                                                        type={challenge.category?.toLocaleLowerCase() || "None"}
                                                        name={challenge.title || "None"}
                                                        solved={challenge.solved || 0}
                                                        score={challenge.score || 0}
                                                        rank={3}
                                                        choiced={CurChallenge.id == challenge.id}
                                                        onClick={handleChangeChallenge(challenge.id || 0)}
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
            </SidebarContent>
        </Sidebar>
    )
}
