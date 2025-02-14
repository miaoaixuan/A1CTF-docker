"use client";

import A1Animation from "./A1Animation";
import { motion } from "framer-motion";

export function MainPageAnimation() {
    return (
        <div className="w-full h-full flex flex-col justify-center items-center">
            <A1Animation />
            <motion.div className="w-full flex overflow-hidden justify-center"
                initial={{
                    height: 0,
                    marginTop: 0
                }}
                animate={{
                    height: "auto",
                    marginTop: "16px"
                }}
                transition={{
                    duration: 0.5,
                    ease: "easeInOut",
                    delay: 1.8
                }}
            >
                <div className="flex flex-col select-none">
                    <span className="text-3xl lg:text-5xl font-extrabold">Welcome to A1CTF</span>
                    <div className="flex">
                        <div className="flex-1" />
                        <span className="text-[13px] lg:text-lg justify-end">A ctf platform designed for A1natas</span>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}