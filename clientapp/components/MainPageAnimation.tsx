import A1Animation from "./A1Animation";
import { motion } from "framer-motion";
import FuzzyText from "./reactbits/FuzzyText/FuzzyText";
import { useTheme } from "next-themes";
import BlurText from "./reactbits/BlurText/BlurText";
import ASCIIText from "./reactbits/ASCIIText/ASCIIText";
import Ribbons from "components/reactbits/Ribbons/Ribbons";
import Squares from "./reactbits/Squares/Squares";
import { useEffect, useState } from "react";
import FancyBackground from "./modules/FancyBackground";
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";

export function MainPageAnimation() {

    const [ colorTheme, setColorTheme ] = useState<string[]>([])
    const { clientConfig } = useGlobalVariableContext()
    const { theme, systemTheme } = useTheme()

    const getColor = () => {
        if (theme == "system") {
            if (systemTheme == "dark") return [clientConfig.FancyBackGroundIconWhite, "rgba(0, 0, 0, 0)", "#060606", "#ffffff"]
            else return [clientConfig.FancyBackGroundIconBlack, "rgba(255, 255, 255, 0)", "#fff", "#000000"]
        } else {
            if (theme == "light") return [clientConfig.FancyBackGroundIconBlack, "rgba(255, 255, 255, 0)", "#fff", "#000000"]
            else return [clientConfig.FancyBackGroundIconWhite, "rgba(0, 0, 0, 0)", "#060606", "#ffffff"]
        }
    }

    useEffect(() => {
        setColorTheme(getColor())
    }, [theme, systemTheme])


    return (
        <>
            <div className="w-full h-full flex flex-col justify-center items-center z-40">
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
                <div className="flex-col items-center gap-10 hidden lg:flex">
                    <FuzzyText
                        baseIntensity={0.2} 
                        color={ colorTheme[3] }
                        fontSize={100}
                        enableHover={true}
                    >
                        Welcome to
                    </FuzzyText>
                    <FuzzyText
                        baseIntensity={0.2} 
                        color={ colorTheme[3] }
                        fontSize={90}
                        enableHover={true}
                    >
                        A1CTF
                    </FuzzyText>
                </div>
                <div className="flex-col items-center gap-10 hidden md:flex lg:hidden">
                    <FuzzyText
                        baseIntensity={0.2} 
                        color={ colorTheme[3] }
                        fontSize={80}
                        enableHover={true}
                    >
                        Welcome to
                    </FuzzyText>
                    <FuzzyText
                        baseIntensity={0.2} 
                        color={ colorTheme[3] }
                        fontSize={70}
                        enableHover={true}
                    >
                        A1CTF
                    </FuzzyText>
                </div>
                <div className="flex-col items-center gap-10 hidden sm:flex md:hidden">
                    <FuzzyText
                        baseIntensity={0.2} 
                        color={ colorTheme[3] }
                        fontSize={60}
                        enableHover={true}
                    >
                        Welcome to
                    </FuzzyText>
                    <FuzzyText
                        baseIntensity={0.2} 
                        color={ colorTheme[3] }
                        fontSize={50}
                        enableHover={true}
                    >
                        A1CTF
                    </FuzzyText>
                </div>
                <div className="flex flex-col items-center gap-10 sm:hidden">
                    <FuzzyText
                        baseIntensity={0.2} 
                        color={ colorTheme[3] }
                        fontSize={50}
                        enableHover={true}
                    >
                        Welcome to
                    </FuzzyText>
                    <FuzzyText
                        baseIntensity={0.2} 
                        color={ colorTheme[3] }
                        fontSize={40}
                        enableHover={true}
                    >
                        A1CTF
                    </FuzzyText>
                </div>

                {/* <div className="flex flex-col gap-10">
                    <FuzzyText
                        baseIntensity={0.05} 
                        color={ colorTheme[3] }
                        fontSize={70}
                        enableHover={true}
                    >
                        Welcome to
                    </FuzzyText>
                    <FuzzyText
                        baseIntensity={0.05} 
                        color={ colorTheme[3] }
                        fontSize={80}
                        enableHover={true}
                    >
                        { clientConfig.systemName }
                    </FuzzyText>
                </div> */}

            </div>
        </>
    )
}