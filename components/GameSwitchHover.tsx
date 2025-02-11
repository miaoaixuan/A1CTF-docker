'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

import Image from "next/image";

import { useGameSwitchContext } from "@/contexts/GameSwitchContext";
import { LoaderPinwheel } from 'lucide-react';
import { BasicGameInfoModel } from '@/utils/GZApi';

import { useLocale } from 'next-intl';
import { url } from 'inspector';

export default function GameSwitchHover({ animation } : { animation: boolean }) {


    const { isChangingGame, curSwitchingGame, posterData } = useGameSwitchContext();

    const [fromY, setFromY] = useState(10);

    const [shouldAnime, setShouldAnime] = useState(false)
    const [animeMethod, setAnimeMethod] = useState("easeInOut")
    const [exitAnimationTime, setExitAnimationTime] = useState(0)

    const { theme } = useTheme();

    useEffect(() => {
        if (animation) {
            setShouldAnime(true)
            setAnimeMethod("anticipate")
            setExitAnimationTime(0.6)
        } else {
            setTimeout(() => {
                setShouldAnime(true)
            }, 200)
            setAnimeMethod("easeInOut")
            setExitAnimationTime(0.3)
        }
    }, [])

    return (
        <AnimatePresence>
            { isChangingGame && (
                <motion.div className='absolute w-screen h-screen top-0 left-0 z-[100] bg-background overflow-hidden' key="exitAnime"
                    initial={{
                        translateY: "-100%"
                    }}
                    animate={{
                        translateY: "0%"
                    }}
                    exit={{
                        translateY: "-100%"
                    }}
                    transition={{
                        ease: animeMethod,
                        duration: shouldAnime ? exitAnimationTime : 0
                    }}
                >
                    <motion.div className='w-full h-full bg-cover'
                        style={{
                            backgroundImage: `url(${posterData})`,
                            // backgroundSize: "100%"
                        }}
                        initial={{
                            scale: 1
                        }}
                        animate={{
                            scale: 1.05
                        }}
                        transition={{
                            duration: animation ? 2 : 0,
                            ease: "easeInOut"
                            // delay: 0.6
                        }}
                    >
                    </motion.div>
                    <motion.div
                        className='absolute w-screen h-screen top-0 left-0 backdrop-blur-md'
                    >
                    </motion.div>
                    <div className='absolute top-0 left-0 w-screen h-screen flex items-center justify-center'>
                        <motion.div
                                // initial={{ scale: 1, translateY: fromY }}
                                // animate={{ scale: 1, translateY: 0 }}
                                // transition={{
                                //     duration: shouldAnime ? 0.5 : 0,
                                //     ease: 'easeInOut',
                                //     delay: shouldAnime ? 0.4 : 0
                                // }}
                                className="flex flex-col z-20 items-center text-white p-10 w-full overflow-hidden"
                            >
                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        translateY: "-10%"
                                    }}
                                    animate={{
                                        opacity: 1,
                                        translateY: "0%"
                                    }}
                                    transition={{
                                        duration: animation ? 0.5 : 0,
                                        delay: animation ? 0.5 : 0
                                    }}
                                >
                                    <Image
                                        className="mb-5 rounded-xl shadow-lg flex-shrink-0 flex-grow-0"
                                        src={posterData}
                                        alt="game-cover"
                                        width={700}
                                        height={100}
                                    />    
                                </motion.div>
                                <motion.div className='flex flex-col w-full items-center overflow-hidden'
                                    initial={{
                                        height: "0px"
                                    }}
                                    animate={{
                                        height: "100%"
                                    }}
                                    transition={{
                                        duration: animation ? 0.5 : 0,
                                        delay: animation ? 1.2 : 0,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <span className="text-3xl font-bold">{ curSwitchingGame.title }</span>
                                    <p className="mt-2">{ curSwitchingGame.summary }</p>
                                    <div className='flex mt-4'>
                                        <LoaderPinwheel className="animate-spin" />
                                        <span className="font-bold ml-3">Loading...</span>
                                    </div>
                                </motion.div>
                        </motion.div>
                    </div>
                </motion.div>
            ) }
        </AnimatePresence>
    );
}
