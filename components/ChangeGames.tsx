"use client";

import Image from "next/image"
import { Button } from "./ui/button"
import { ChevronDown, ChevronUp, Dices, Swords } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion";

import api, { BasicGameInfoModel } from '@/utils/GZApi'
import { MacScrollbar } from "mac-scrollbar";
import { useTheme } from "next-themes";
import SafeComponent from "./SafeComponent";

export function ChangeGames() {

    const [curIndex, setCurIndex] = useState(0)

    const [curGames, setCurGames] = useState<BasicGameInfoModel[]>([
        { id: 1, title: "浙江师范大学第22届 网络安全校赛114514114514", summary: "WTFISIT", poster: "/images/123691039_p0.jpg", limit: 1, start: 1, end: 1},
        { id: 2, title: "A1CTF 2", summary: "WTFISIT", poster: "/images/123691039_p0.jpg", limit: 1, start: 1, end: 1},
        { id: 3, title: "A1CTF 3", summary: "WTFISIT", poster: "/images/123691039_p0.jpg", limit: 1, start: 1, end: 1},
        { id: 1, title: "A1CTF 4", summary: "WTFISIT", poster: "/images/123691039_p0.jpg", limit: 1, start: 1, end: 1},
        { id: 2, title: "A1CTF 5", summary: "WTFISIT", poster: "/images/123691039_p0.jpg", limit: 1, start: 1, end: 1},
        { id: 3, title: "A1CTF 6", summary: "WTFISIT", poster: "/images/123691039_p0.jpg", limit: 1, start: 1, end: 1},
        { id: 1, title: "A1CTF 7", summary: "WTFISIT", poster: "/images/123691039_p0.jpg", limit: 1, start: 1, end: 1},
        { id: 2, title: "A1CTF 8", summary: "WTFISIT", poster: "/images/123691039_p0.jpg", limit: 1, start: 1, end: 1},
        { id: 3, title: "A1CTF 9", summary: "WTFISIT", poster: "/images/123691039_p0.jpg", limit: 1, start: 1, end: 1},
        { id: 2, title: "A1CTF 10", summary: "WTFISIT", poster: "/images/123691039_p0.jpg", limit: 1, start: 1, end: 1},
        { id: 3, title: "A1CTF 11", summary: "WTFISIT", poster: "/images/123691039_p0.jpg", limit: 1, start: 1, end: 1},
        { id: 1, title: "A1CTF 12", summary: "WTFISIT", poster: "/images/123691039_p0.jpg", limit: 1, start: 1, end: 1},
        { id: 2, title: "A1CTF 13", summary: "WTFISIT", poster: "/images/123691039_p0.jpg", limit: 1, start: 1, end: 1},
        { id: 3, title: "A1CTF 14", summary: "WTFISIT", poster: "/images/123691039_p0.jpg", limit: 1, start: 1, end: 1},
        { id: 2, title: "A1CTF 15", summary: "WTFISIT", poster: "/images/123691039_p0.jpg", limit: 1, start: 1, end: 1},
        { id: 3, title: "A1CTF 16", summary: "WTFISIT", poster: "/images/123691039_p0.jpg", limit: 1, start: 1, end: 1},
        { id: 1, title: "A1CTF 17", summary: "WTFISIT", poster: "/images/123691039_p0.jpg", limit: 1, start: 1, end: 1},
        { id: 2, title: "A1CTF 18", summary: "WTFISIT", poster: "/images/123691039_p0.jpg", limit: 1, start: 1, end: 1},
        { id: 3, title: "A1CTF 19", summary: "WTFISIT", poster: "/images/123691039_p0.jpg", limit: 1, start: 1, end: 1}
    ])

    const handleSwitch = (direction: "up" | "down") => {
        if (direction == "up") setCurIndex(Math.max(0, curIndex - 1))
        else if (direction == "down") setCurIndex(Math.min(curIndex + 1, curGames.length - 1))
    }

    // 懒加载
    const observerRef = useRef<IntersectionObserver | null>(null);
    const [visibleItems, setVisibleItems] = useState<Record<string, boolean>>({});
    const [loaded, setLoaded] = useState(false)

    const { theme } = useTheme()

    // 观察器
    const observeItem = (el: HTMLElement, id: string) => {
        if (el && observerRef.current) {
            el.dataset.id = id;
            observerRef.current.observe(el);
        }
    };

    useEffect(() => {
        console.log("114514")
        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const target = entry.target as HTMLElement; 
                const id = target.dataset.id as string;

                if (entry.isIntersecting) {
                    setVisibleItems((prev) => ({
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
            // 前后两个都可见，方便动画
            rootMargin: "200px 0px",
        });

        setLoaded(true)
    }, [])

    // useEffect(() => {
    //     console.log(visibleItems)
    // }, [visibleItems])

    return (
        <div className="flex items-center h-full pl-[50px] pr-[50px]">
            <div className="flex flex-col pl-[10px] pt-[10px] pb-[10px] pr-[10px] h-full justify-center min-w-[250px] max-w-[350px] select-none">
                <div className="flex gap-1 items-center mb-[20px] pl-[10px] pr-[10px]">
                    <Swords size={32} className="transition-colors duration-300" />
                    <span className="text-2xl transition-colors duration-300">比赛列表</span>
                </div>
                <SafeComponent>
                    <MacScrollbar 
                        className="p-4"
                        skin={theme == "light" ? "light" : "dark"}
                    >
                        <div className="flex flex-col pl-[15px] pr-[15px] w-full">
                            { loaded && curGames.map((game, index) => (
                                <div 
                                    className={`flex gap-2 hover:scale-110 transition-transform duration-300 h-[50px] ${index == curIndex ? "text-cyan-500" : ""}`} key={`title-${index}`}
                                    onClick={() => {
                                        setCurIndex(index)
                                    }}
                                >
                                    <Dices size={ index == curIndex ? 32 : 20} className="transition-all duration-300 flex-none" />
                                    <div className="flex flex-col gap-1 overflow-hidden w-full">
                                        <span className={`${ index == curIndex ? "text-xl" : "text-[16px]" } transition-all duration-300 text-ellipsis overflow-hidden whitespace-nowrap`}>{ game.title }</span>
                                        <span className={`mt-[-8px] ${ index == curIndex ? "text-[14px]" : "text-[10px]" } transition-all duration-300`}>{ game.summary }</span>
                                    </div>
                                </div>
                            )) }
                        </div>
                    </MacScrollbar>
                </SafeComponent>
            </div>
            {/* <div className="flex-1"></div> */}
            <div className="h-full flex flex-1 items-center">
                <div className="w-full flex flex-col flex-1 justify-center items-center gap-10 overflow-hidden">
                    <Button variant="ghost" disabled={curIndex == 0} onClick={() => handleSwitch("up")} className="text-lg w-[100px] h-[100px] [&_svg]:size-[80px] hover:scale-110 duration-300 transition-transform"><ChevronUp /></Button>
                    <div className="w-full h-[600px] overflow-hidden">
                        <motion.div className="w-full h-full flex flex-col items-center translate-y-[0px]"
                            animate={{
                                translateY: `-${curIndex * 600}px`
                            }}
                            transition={{
                                duration: 0.5,
                                ease: "easeInOut"
                            }}
                        >
                            { loaded && curGames.map((game, index) => (
                                <div className="w-full h-[600px] flex-none flex items-center justify-center" 
                                    key={`game-${index}`}
                                    ref={(el) => observeItem(el!, index?.toString() || "")}
                                >
                                    { visibleItems[index.toString()] && (
                                        <div 
                                            className="w-[900px] h-[500px] transition-colors duration-300 flex-none border-2 border-[#121212] opacity-[1] dark:border-[#ffffff] rounded-[4px] shadow-[0.8em_0.8em_0_0_#121212bb] dark:shadow-[0.8em_0.8em_0_0_#ffffffbb] relative"
                                        >
                                            <div className="transition-colors duration-300 absolute border-2 border-[#121212] dark:border-[#ffffff] min-w-[300px] h-[104px] rounded-[8px] translate-x-[-25%] translate-y-[-50px] z-10">
                                                <div className="flex max-w-[400px] flex-col w-full h-full p-4 pl-6 pr-6 justify-center bg-background/95 rounded-[8px]">
                                                    <span className="text-2xl font-bold text-nowrap overflow-hidden text-ellipsis" title={ game.title }>{ game.title }</span>
                                                    <span className="text-lg">Start at 2024/2/6 20:54</span>
                                                </div>
                                            </div>
                                            <Image
                                                src={game.poster || "#"}
                                                alt="Image"
                                                fill={true}
                                                objectFit="cover"
                                                loading="lazy"
                                            />
                                        </div>
                                    ) }
                                </div>
                            )) }
                        </motion.div>
                    </div>
                    <Button variant="ghost" disabled={curIndex == curGames.length} onClick={() => handleSwitch("down")} className="text-lg w-[100px] h-[100px] [&_svg]:size-[80px] hover:scale-110 duration-300 transition-transform"><ChevronDown /></Button>
                </div>
            </div>
        </div>
    )
}