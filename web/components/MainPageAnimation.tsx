"use client";

import A1Animation from "./A1Animation";
import { motion } from "framer-motion";
import FuzzyText from "./reactbits/FuzzyText/FuzzyText";
import { useTheme } from "next-themes";
import BlurText from "./reactbits/BlurText/BlurText";
import ASCIIText from "./reactbits/ASCIIText/ASCIIText";
import Ribbons from "@/components/reactbits/Ribbons/Ribbons";

export function MainPageAnimation() {


    const { theme, systemTheme } = useTheme()
    const getColor = () => {
        if (theme == "system") {
            if (systemTheme == "dark") return "#ffffff"
            else return "#000000"
        } else {
            if (theme == "light") return "#000000"
            else return "#ffffff"
        }
    }

    return (
        <>
            <div className="w-screen h-screen absolute top-0 left-0 overflow-hidden blur-sm pointer-events-none">
                <Ribbons
                    baseThickness={10}
                    colors={[getColor()]}
                    speedMultiplier={0.5}
                    maxAge={500}
                    enableFade={true}
                    enableShaderEffect={true}
                />
            </div>
            <div className="w-full h-full flex flex-col justify-center items-center">
                {/* <A1Animation />
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
                </motion.div> */}
                {/* <div className="flex-col items-center gap-10 hidden lg:flex">
                    <FuzzyText
                        baseIntensity={0.2} 
                        color={ getColor() }
                        fontSize={100}
                        enableHover={true}
                    >
                        Welcome to
                    </FuzzyText>
                    <FuzzyText
                        baseIntensity={0.2} 
                        color={ getColor() }
                        fontSize={90}
                        enableHover={true}
                    >
                        A1CTF
                    </FuzzyText>
                </div>
                <div className="flex-col items-center gap-10 hidden md:flex lg:hidden">
                    <FuzzyText
                        baseIntensity={0.2} 
                        color={ getColor() }
                        fontSize={80}
                        enableHover={true}
                    >
                        Welcome to
                    </FuzzyText>
                    <FuzzyText
                        baseIntensity={0.2} 
                        color={ getColor() }
                        fontSize={70}
                        enableHover={true}
                    >
                        A1CTF
                    </FuzzyText>
                </div>
                <div className="flex-col items-center gap-10 hidden sm:flex md:hidden">
                    <FuzzyText
                        baseIntensity={0.2} 
                        color={ getColor() }
                        fontSize={60}
                        enableHover={true}
                    >
                        Welcome to
                    </FuzzyText>
                    <FuzzyText
                        baseIntensity={0.2} 
                        color={ getColor() }
                        fontSize={50}
                        enableHover={true}
                    >
                        A1CTF
                    </FuzzyText>
                </div>
                <div className="flex flex-col items-center gap-10 sm:hidden">
                    <FuzzyText
                        baseIntensity={0.2} 
                        color={ getColor() }
                        fontSize={50}
                        enableHover={true}
                    >
                        Welcome to
                    </FuzzyText>
                    <FuzzyText
                        baseIntensity={0.2} 
                        color={ getColor() }
                        fontSize={40}
                        enableHover={true}
                    >
                        A1CTF
                    </FuzzyText>
                </div> */}

                <div className="hidden lg:flex">
                    <BlurText
                        text="Welcome to A1CTF"
                        animateBy="words"
                        direction="top"
                        delay={200}
                        onAnimationComplete={() => {}}
                        className="text-[4em] font-bold select-none text-bl"
                    />
                </div>

                <div className="flex lg:hidden flex-col gap-10">
                    <FuzzyText
                        baseIntensity={0.05} 
                        color={ getColor() }
                        fontSize={50}
                        enableHover={true}
                    >
                        Welcome to
                    </FuzzyText>
                    <FuzzyText
                        baseIntensity={0.05} 
                        color={ getColor() }
                        fontSize={40}
                        enableHover={true}
                    >
                        A1CTF
                    </FuzzyText>
                </div>

            </div>
        </>
    )
}