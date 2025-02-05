"use client";

import { CircleCheck, Download, UnfoldVertical } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { Button } from "./ui/button";
import { Progress } from "@/components/ui/progress"
import { AnimatePresence, motion } from "framer-motion";

export function DownloadBar({ progress, downloadName } : { progress: number, downloadName: string }) {

    const [folded, setFolded] = useState(false)

    return (
        <AnimatePresence>
            { downloadName && (
                <motion.div
                    key={"download-panel"}
                    className={`absolute top-[10px] right-[10px] w-[350px] h-[60px] transition-[border-color] duration-300 backdrop-blur-md z-[99] border-2 rounded-xl flex pl-4 pr-2 overflow-hidden`} onClick={() => (folded && setFolded(false))} 
                    initial={{
                        translateY: "calc(-100% - 20px)"
                    }}
                    animate={{
                        translateY: folded ? "calc(-100%)" : "0"
                    }}
                    exit={{
                        translateY: "calc(-100% - 20px)"
                    }}
                    transition={{
                        duration: 0.6,
                        ease: "backInOut"
                    }}
                >
                    { progress > 100 ? (
                        <AnimatePresence>
                            <motion.div className="w-full h-full absolute top-0 left-0 flex items-center justify-center gap-2"
                                key={"downloaded"}
                                initial={{
                                    translateY: "-100%"
                                }}
                                animate={{
                                    translateY: "0"
                                }}
                                transition={{
                                    duration: 0.6,
                                    ease: "anticipate"
                                }}
                            >
                                <CircleCheck size={26} />
                                <span className="text-lg font-bold">Downloaded</span>
                            </motion.div>
                        </AnimatePresence>
                    ) : (
                        <AnimatePresence>
                            <motion.div
                                key={"downloading"}
                                className="w-full flex"
                                exit={{
                                    translateY: "100%"
                                }}
                                transition={{
                                    duration: 0.6,
                                    ease: "anticipate"
                                }}
                            >
                                <div className="flex justify-start items-center h-full w-[275px] mr-[5px]">
                                    <div className="flex flex-col w-full justify-center gap-1 min-w-0">
                                        <div className="flex items-center w-full gap-[6px]">
                                            <Download size={18}/>
                                            <span className="text-sm text-ellipsis whitespace-nowrap overflow-hidden">Downloading {downloadName}</span>
                                        </div>
                                        <Progress value={progress} className="w-full" />
                                    </div>
                                </div>
                                <div className="flex flex-1"/>
                                <div className="flex w-[40px] h-full justify-center items-center">
                                    <Button size="icon" className="[&_svg]:size-6" variant="ghost" onClick={() => setFolded(true)} ><UnfoldVertical /></Button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    ) }
                    
                </motion.div>
            ) }
        </AnimatePresence>
    )
}