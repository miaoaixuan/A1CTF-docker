"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Squares from "../reactbits/Squares/Squares";
import { useCanvas } from "@/contexts/CanvasProvider";

export default function FancyBackground() {
    const [ colorTheme, setColorTheme ] = useState<string[]>([])
    

    const { theme, systemTheme } = useTheme()
    const getColor = () => {
        if (theme == "system") {
            if (systemTheme == "dark") return ["ctf_white.png", "rgba(0, 0, 0, 0)", "#060606", "#ffffff"]
            else return ["ctf_black.png", "rgba(255, 255, 255, 0)", "#fff", "#000000"]
        } else {
            if (theme == "light") return ["ctf_black.png", "rgba(255, 255, 255, 0)", "#fff", "#000000"]
            else return ["ctf_white.png", "rgba(0, 0, 0, 0)", "#060606", "#ffffff"]
        }
    }

    useEffect(() => {
        setColorTheme(getColor())
    }, [theme, systemTheme])

    if (colorTheme.length == 0) return <></>

    return (
        <div className="w-screen h-screen absolute top-0 left-0 pointer-events-none opacity-20 blur-[2px] z-[-10]">
            <Squares 
                speed={0.2} 
                imageSizeX={271}
                imageSizeY={125}
                direction='diagonal'
                borderColor='#000'
                hoverFillColor='#222'
                gradientFrom={colorTheme[1]}
                gradientTo={colorTheme[2]}
                imageSrc={`/images/${colorTheme[0]}`}
                rotation={-5}
            />
        </div>
    )
}