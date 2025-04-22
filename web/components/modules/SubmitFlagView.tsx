"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Flag, Mail, Send, SendHorizonal, X } from "lucide-react";
import { Input } from "../ui/input";

import {
    animated,
    useTransition,
} from '@react-spring/web'
import { UserDetailGameChallenge } from "@/utils/A1API";

const SubmitFlagView = ({ lng, curChallenge }: { lng: string, curChallenge: UserDetailGameChallenge | undefined }) => {

    const [visible, setVisible] = useState(false);

    const transitions = useTransition(visible, {
        from: {
            opacity: 0,
            backdropFilter: 'blur(0px)',
            transform: 'translateY(40px)'
        },
        enter: {
            opacity: 1,
            backdropFilter: 'blur(4px)',
            transform: 'translateY(0)'
        },
        leave: {
            opacity: 0,
            backdropFilter: 'blur(0px)',
            transform: 'translateY(40px)'
        },
        config: { tension: 220, friction: 20 }
    });

    return (
        <>
            {/* 触发按钮 */}
            { curChallenge && (
                <div className="absolute bottom-5 right-5 z-10">
                    <Button
                        className="w-[67px] h-[67px] rounded-3xl backdrop-blur-sm bg-red-600/70 hover:bg-red-800/70 [&_svg]:size-9 flex p-0 items-center justify-center text-white"
                        onClick={() => setVisible(true)}
                    >
                        <Flag className="rotate-12" />
                    </Button>
                </div>
            ) }

            {/* 模态框动画 */}
            {transitions((style, item) =>
                item && (
                    <div className="absolute h-screen w-screen top-0 left-0 z-40 select-none overflow-hidden">
                        {/* 背景模糊层 */}
                        <animated.div
                            style={{
                                opacity: style.opacity,
                                backdropFilter: style.backdropFilter
                            }}
                            className="absolute w-full h-full bg-black/20"
                            onClick={() => setVisible(false)}
                        />

                        {/* 内容层 */}
                        <animated.div
                            style={{
                                opacity: style.opacity,
                                transform: style.transform
                            }}
                            className="absolute w-full h-full flex items-center justify-center"
                        >
                            <div className="w-[50%] flex flex-col gap-6 p-10 h-[290px] bg-background/80 border-4 border-foreground rounded-lg shadow-[0.5em_0.5em_0_0_#121212bb]">
                                <div className="flex gap-6 items-center">
                                    <Mail size={48} />
                                    <span className="font-bold text-3xl">Submit your flag!</span>
                                </div>

                                <input
                                    className="flex w-full bg-transparent px-3 shadow-sm transition-colors duration-300 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 h-[50px] border-foreground rounded-lg border-4 text-xl font-bold py-0 focus-visible:border-blue-400 focus-visible:text-blue-400"
                                    placeholder="Enter your flag here"
                                />

                                <div className="flex gap-6">
                                    <Button
                                        className="h-[50px] rounded-lg p-0 border-4 px-4 py-4 border-red-400 text-red-400 bg-background hover:border-red-600 hover:text-red-600 hover:bg-red-400/10 [&_svg]:size-[32px]"
                                        onClick={() => setVisible(false)}
                                    >
                                        <div className="flex gap-4 items-center">
                                            <X />
                                            <span className="font-bold text-xl">Close</span>
                                        </div>
                                    </Button>
                                    <Button className="h-[50px] rounded-lg p-0 border-4 px-4 py-4 border-foreground bg-background hover:border-blue-400 hover:text-blue-400 hover:bg-blue-400/10 [&_svg]:size-[32px] text-foreground">
                                        <div className="flex gap-4 items-center">
                                            <SendHorizonal />
                                            <span className="font-bold text-xl">Submit</span>
                                        </div>
                                    </Button>
                                </div>
                            </div>
                        </animated.div>
                    </div>
                )
            )}
        </>
    )
}

export default SubmitFlagView;