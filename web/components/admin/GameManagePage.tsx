"use client";

import dayjs from "dayjs";
import { CirclePlus, Eye, EyeClosed, EyeOff, FilePenLine, Trash2 } from "lucide-react";
import { MacScrollbar } from "mac-scrollbar";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { GameSimpleInfo } from "@/utils/A1API";
import { api } from "@/utils/ApiHelper";
import { useRouter } from "next/navigation";
import { FastAverageColor } from "fast-average-color"
import { useGlobalVariableContext } from "@/contexts/GlobalVariableContext";

export function GameManagePage({ lng } : { lng: string }) { 

    const { theme } = useTheme()
    const [ games, setGames ] = useState<GameSimpleInfo[]>([])

    const router = useRouter()

    const [ primaryColorMap, setPrimaryColorMap ] = useState<{ [key: number]: string }>({});

    // 懒加载, 当前题目卡片是否在视窗内
    const observerRef = useRef<IntersectionObserver | null>(null);
    const [visibleItems, setVisibleItems] = useState<Record<string, boolean>>({});
    const [isLoaded, setIsLoaded] = useState<Record<string, boolean>>({});

    useEffect(() => {
        api.admin.listGames({ size: 16, offset: 0 }).then((res) => {
            setGames(res.data.data)
        })

        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const target = entry.target as HTMLElement; 
                
                const id = target.dataset.id as string;

                if (entry.isIntersecting) {
                    setVisibleItems((prev) => ({
                        ...prev,
                        [id]: true
                    }));
                    setIsLoaded((prev) => ({
                        ...prev,
                        [id]: true
                    }));
                } else {
                    setVisibleItems((prev) => ({
                        ...prev,
                        [id]: false
                    }));
                }
            }
        );
        },
        {
            rootMargin: "420px 0px",
        });
    }, [])

    const observeItem = (el: HTMLElement, id: string) => {
        if (el && observerRef.current) {
            el.dataset.id = id;
            observerRef.current.observe(el);
        }
    };

    const { clientConfig } = useGlobalVariableContext()

    return (
        <div className="w-full h-full flex">
            <MacScrollbar className="w-full h-full p-5 lg:p-10 overflow-y-auto" skin={theme == "light" ? "light" : "dark"}>
                <div className="flex items-center justify-between mb-6 select-none">
                    <span className="font-bold text-3xl">比赛列表</span>
                    <Button onClick={() => {
                        router.push(`/${lng}/admin/games/create`)
                    }}>
                        <CirclePlus />
                        添加比赛
                    </Button>
                </div>
                <div className={`grid auto-rows-[330px] gap-6 select-none w-full ${ games.length > 2 ? "grid-cols-[repeat(auto-fill,minmax(320px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(600px,1fr))] " : "grid-cols-[repeat(auto-fill,minmax(320px,600px))] lg:grid-cols-[repeat(auto-fill,minmax(500px,600px))]"}`}>
                    { games.map((game, index) => {
                        return (
                            <div key={index} className="w-full h-full rounded-2xl border-2 overflow-hidden shadow-lg relative" ref={(el) => observeItem(el!, index.toString())}>
                                { (visibleItems[index.toString()] || isLoaded[index.toString()]) && (
                                    <>
                                        <div className="absolute top-0 left-0 w-full h-full">
                                            <img src={game.poster || clientConfig.DefaultBGImage} className={`w-full h-full object-cover`} onLoad={(e) => {
                                                const fac = new FastAverageColor();
                                                const container = e.target as HTMLImageElement; 

                                                fac.getColorAsync(container)
                                                    .then((color: any) => {
                                                        const brightness = 0.2126 * color.value[0] + 0.7152 * color.value[1] + 0.0722 * color.value[2];
                                                        const brightColor = brightness > 128 ? "black" : "white";
                                                        const invColor = `rgba(${255 - color.value[0]}, ${255 - color.value[1]}, ${255 - color.value[2]}, ${ color.value[3] })`;
                                                        setPrimaryColorMap((prev) => ({
                                                            ...prev,
                                                            [index]: brightColor
                                                        }));
                                                    })
                                                    .catch((e: any) => {
                                                        console.log(e);
                                                    });
                                            }} />
                                        </div>
                                        <div className="group"
                                            style={{
                                                color: primaryColorMap[index] ? `${primaryColorMap[index]}` : "white"
                                            }}
                                        >
                                            <div className="absolute w-full h-full backdrop-blur-md flex flex-col p-5 group-hover:backdrop-blur-[1px] transition-all duration-200 bg-background/15 group-hover:bg-background/5">
                                                <div className="w-full flex">
                                                    <span className="font-bold text-3xl px-2 pt-2 text-ellipsis overflow-hidden text-nowrap">{ game.name }</span>
                                                </div>
                                                <div className="w-full flex">
                                                    <span className="font-bold text-2xl px-2 pt-2 text-ellipsis overflow-hidden text-nowrap">{ game.summary || "Null" }</span>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-5 left-5 flex flex-col">
                                                <span className="text-lg font-bold">比赛时间</span>
                                                <span className="text-lg font-bold mb-[-5px]">{ dayjs(game.start_time).format() }</span>
                                                <span className="text-lg font-bold">{ dayjs(game.end_time).format() }</span>
                                            </div>
                                            <div className="absolute bottom-5 right-5 flex">
                                                <div className="w-[60px] h-[60px] rounded-full hover:text-cyan-500 flex items-center justify-center transition-colors duration-300 [&_svg]:size-10">
                                                    { game.visible ? (
                                                        <Eye />
                                                    ) : (
                                                        <EyeClosed />
                                                    ) }
                                                </div>
                                                <div className="w-[60px] h-[60px] rounded-full hover:text-cyan-500 flex items-center justify-center transition-colors duration-300 [&_svg]:size-10"
                                                    onClick={() => {
                                                        router.push(`/${lng}/admin/games/${game.game_id}`)
                                                    }}
                                                >
                                                    <FilePenLine />
                                                </div>
                                                <div className="w-[60px] h-[60px] rounded-full hover:text-red-500 flex items-center justify-center transition-colors duration-300 [&_svg]:size-10">
                                                    <Trash2 />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) }
                            </div>
                        )
                    }) }
                </div>
            </MacScrollbar>
        </div>
    );
}