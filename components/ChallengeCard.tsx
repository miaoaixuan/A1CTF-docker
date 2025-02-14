"use client";

import {  ChevronsRight, Dices, CircleCheckBig } from "lucide-react"

import { FC, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion";

interface ChallengeInfo {
    type: string,
    name: string,
    solved: number,
    score: number,
    rank: number,
    choiced: boolean,
    status: boolean
}

export const ChallengeCard: FC<ChallengeInfo & React.HTMLAttributes<HTMLDivElement>> = ({ type, name, solved, score, rank, choiced, status, ...props }) => {

    let colorClass = "bg-amber-600";
    const [ solveStatus, setSolveStatus ] = useState(false)
    
    // 解决懒加载重新播放动画的问题
    const [ initHook, setInitHook ] = useState(true)
    const [ shouldAnime, setShouldAnime ] = useState(false)
    const prevStatus = useRef(false)

    /* 
        copied from gzctf (
        
        misc: rgb(32, 201, 151)
        crypto: rgb(132, 94, 247)
        pwn: rgb(255, 107, 107)
        web: fill: rgb(51, 154, 240)
        reverse: rgb(252, 196, 25)
        forensics: rgb(92, 124, 250)
        hardware: rgb(208, 208, 208)
        mobile: rgb(240, 101, 149)
        ppc: rgb(34, 184, 207)
        ai: rgb(148, 216, 45)
        pentent: rgb(204, 93, 232)
        osint: rgb(255, 146, 43)
    */

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

    if (type in colorMap) colorClass = colorMap[type]
    else colorClass = colorMap["misc"]

    useEffect(() => {
        setInitHook(false)
        setSolveStatus(status)
        prevStatus.current = status
        return () => {
            
        }
    }, [])

    useEffect(() => {
        if (prevStatus.current != status) {
            if (status == true) {
                setShouldAnime(status)
                setTimeout(() => {
                    setShouldAnime(false)
                }, 4000)
            }
            setSolveStatus(status)
            prevStatus.current = status
        }
    }, [status])

    return (
        <div className={`w-full h-[100px] rounded-xl relative hover:scale-[1.04] pl-4 pt-4 pr-4 pb-3 select-none overflow-hidden transition-transform_bordercolor duration-300 will-change-transform border-[2px] bg-background`}
            // style={{
            //     backgroundColor: choiced ? colorClass : "transparent"
            // }}
            {...props} 
        >
            {/* <div className="absolute w-[80px] h-[120px] right-[5px] top-[-12px] rotate-[0deg] opacity-25">
                <AnimatePresence>
                    {
                        choiced && (
                            <motion.div className="flex items-center justify-center h-full"
                                exit={{
                                    translateX: "80%",
                                    translateY: "-40%",
                                    opacity: 0,
                                    scale: 0.1
                                }}
                                initial={{
                                    translateX: "80%",
                                    translateY: "-40%",
                                    opacity: 0,
                                    scale: 0.1
                                }}
                                animate={{
                                    translateX: "0%",
                                    translateY: "0%",
                                    opacity: 1,
                                    scale: 1
                                }}
                                transition={{
                                    duration: initHook ? 0 : 0.4,
                                    ease: "anticipate"
                                }}
                            >
                                <Star size={100} className="fill-yellow-300 text-yellow-600" />
                            </motion.div>
                        )
                    }
                </AnimatePresence>
                
            </div> */}
            <AnimatePresence>
                { shouldAnime && (
                    <>
                        <motion.div className="absolute w-full h-full top-0 left-0 z-100"
                            initial={{
                                backdropFilter: "blur(0px)"
                            }}
                            animate={{
                                backdropFilter: "blur(10px)"
                            }}
                            exit={{
                                backdropFilter: "blur(0px)"
                            }}
                            transition={{
                                duration: 0.5
                            }}
                        >
                            
                        </motion.div>
                        <motion.div
                            className="absolute w-full h-full top-0 left-0 flex justify-center items-center"
                            initial={{
                                opacity: 0
                            }}
                            animate={{
                                opacity: 1
                            }}
                            exit={{
                                opacity: 0
                            }}
                            transition={{
                                duration: 0.5,
                                // delay: 0.2,
                                ease: "anticipate"
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <CircleCheckBig size={40} />
                                <span className="text-2xl font-bold">Solved!</span>
                            </div>
                        </motion.div>
                    </>
                ) }
            </AnimatePresence>
            <div className={`flex flex-col h-full w-full`}>
                <div className="flex items-center gap-1">
                    <div id="card-title" className="flex justify-start items-center gap-2 min-w-0 h-[32px]" >
                        <Dices size={23} className="flex-none transition-colors duration-300" style={{ color: !choiced ? "" : colorClass }}/>
                        <span className={`font-bold text-ellipsis whitespace-nowrap overflow-hidden transition-colors duration-300`} style={{ color: !choiced ? "" : colorClass }}>{ name }</span>
                    </div>
                    
                    { solveStatus ? (
                            <>
                                <div className="flex-1" />
                                <div className="flex justify-end gap-[2px] w-[32px] h-full items-center text-green-600">
                                    <CircleCheckBig size={23} />
                                </div>
                            </>
                    ) : <></> }
                        
                </div>
                <div className="flex-1"/>
                <div className="flex items-center transition-colors duration-300">
                    <div className="flex justify-start">
                        <span className="font-bold">{ solved } solves & { score } pts</span>
                    </div>
                    <div className="flex-1"/>
                    <div className="flex justify-end items-center">
                        <span className="font-bold">Try it</span>
                        <ChevronsRight size={32}/>
                    </div>
                </div>
            </div>
        </div>
    )
}