"use client";

import LetterGlitch from "./reactbits/LetterGlitch/LetterGlitch";
import PixelCard from "./reactbits/PixelCard/PixelCard";
import SplitText from "./reactbits/SplitText/SplitText";
import { useSprings, animated, easings } from '@react-spring/web';
import SafeComponent from "./SafeComponent";
import { DoorOpen } from "lucide-react";
import { motion } from "framer-motion";

export function ActivityPage() {
    return (
        <>
            <div className="absolute flex w-screen h-screen justify-center items-center">
                <LetterGlitch
                    glitchSpeed={100}
                    glitchColors={['#CC9117', '#61dca3', '#61b3dc']}
                    centerVignette={true}
                    outerVignette={true}
                    smooth={true}
                />
            </div>
            <div className="absolute flex w-screen h-screen justify-center items-center backdrop-blur-[3px] select-none flex-col gap-5">
                <SplitText
                    text="ZJNU CTF 2025 IS COMING"
                    className="text-[5em] font-semibold text-center"
                    delay={50}
                    animationFrom={{ opacity: 0, filter: "blur(10px)", transform: 'translate3d(0,50px,0)' }}
                    animationTo={{ opacity: 1, filter: "blur(0px)", transform: 'translate3d(0,0,0)' }}
                    easing={ easings.easeInOutCubic }
                    threshold={0.2}
                    rootMargin="-50px"
                    onLetterAnimationComplete={() => {}}
                />
                <motion.div className="overflow-hidden"
                    initial={{
                        height: 0,
                        opacity: 0
                    }}
                    animate={{
                        height: "auto",
                        opacity: 1
                    }}
                    transition={{
                        duration: 0.3,
                        delay: 1.5,
                        easings: "linear"
                    }}
                >
                    <PixelCard variant="pink" className="w-[100px] h-[60px]">
                        <div className="absolute top-0 left-0 w-full h-full items-center justify-center flex gap-2 opacity-60 hover:opacity-100 duration-300 transition-opacity">
                            <div className="flex gap-2 items-center">
                                <DoorOpen />
                                <span className="text-2xl">Join Now</span>
                            </div>
                        </div>
                    </PixelCard>
                </motion.div>
            </div>
        </>
    )
}