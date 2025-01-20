'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

import Image from "next/image";
import { Label } from '@radix-ui/react-label';

import { useTransitionContext } from "@/contexts/TransitionContext";

export default function GameSwitchHover({ x, y, id } : { x: number, y: number, id: number }) {

    const [showContent, setShowContent] = useState(false);
    const [scale, setscale] = useState(0);

    const [durationTime, setDurationTime] = useState(1.2);
    const [durationTime2, setDurationTime2] = useState(0.5);

    const [fromY, setFromY] = useState(10);

    const { theme } = useTheme();
    const { startTransition } = useTransitionContext();
    const router = useRouter();

    const screenHeight = window.innerHeight; // 获取屏幕高度

    const bgColor =
        theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

    useEffect(() => {

        // 优化弹出位置，符合直觉
        if (y > screenHeight / 2) setFromY(10)
            else setFromY(-10)

        // 展开遮罩
        setscale(150)

        // 延迟显示介绍信息
        setTimeout(() => {
            setShowContent(true);
        }, 500);

        // 收回遮罩
        setTimeout(() => {
            setDurationTime(0.5)
            setShowContent(false)
            setscale(0)

            setTimeout(() => {
                startTransition(() => {
                    router.push(`/games/${id}`);
                })
            }, 500)
        }, 3000);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    return (
        <div className="absolute w-screen h-screen top-0 left-0 overflow-hidden">
            <AnimatePresence>
                <motion.div
                    className={"absolute w-10 h-10 rounded-full backdrop-blur-lg"}
                    style={{ left: `${x}px`, top: `${y}px`, backgroundColor: bgColor, willChange: "backdrop-filter" }}
                    initial={{
                        scale: 0,
                        backdropFilter: "blur(1px)"
                    }}
                    animate={{
                        scale: scale,
                        backdropFilter: "blur(16px)"
                    }}
                    // exit={{
                    //     scale: 0,
                    //     opacity: 0,
                    // }}
                    // onAnimationStart={() => { alert("End") }}
                    transition={{
                        duration: durationTime,
                        ease: 'easeInOut',
                    }}
                >

                </motion.div>
            </AnimatePresence>
            <div className='w-full h-full flex justify-center items-center'>
                <AnimatePresence>
                    {showContent && (
                        <motion.div
                            initial={{ opacity: 0, scale: 1, translateY: fromY }}
                            animate={{ opacity: 1, scale: 1, translateY: 0 }}
                            exit={{ opacity: 0, scale: 1, translateY: fromY }}
                            transition={{
                                duration: durationTime2,
                                ease: 'easeInOut',
                            }}
                            className="flex flex-col z-20 items-center"
                        >
                            <Image
                                className="mb-10"
                                src="/images/123691039_p0.jpg"
                                alt="game-cover"
                                width={700}
                                height={100}
                            />
                            <h1 className="text-3xl font-bold">A1CTF 2025</h1>
                            <p className="mt-2">Test Test Test...</p>
                            <div className='flex mt-4'>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={"animate-spin"}
                                >
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                                <Label className="font-bold ml-3">Loading...</Label>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
