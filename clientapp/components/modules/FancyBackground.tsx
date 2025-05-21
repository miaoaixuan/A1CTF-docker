import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Squares from "../reactbits/Squares/Squares";
import { useCanvas } from "contexts/CanvasProvider";
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";

export default function FancyBackground() {
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
        if (clientConfig.FancyBackGroundIconWhite) {
            setColorTheme(getColor())
        }
    }, [clientConfig, theme, systemTheme])

    if (!colorTheme.length) return <></>

    return (
        <div className="w-screen h-screen absolute top-0 left-0 pointer-events-none opacity-20 blur-[2px]">
            <Squares 
                speed={ clientConfig.BGAnimation ? 0.15 : 0} 
                imageSizeX={271}
                imageSizeY={125}
                direction='diagonal'
                borderColor='#000'
                hoverFillColor='#222'
                gradientFrom={colorTheme[1]}
                gradientTo={colorTheme[2]}
                imageSrc={colorTheme[0]}
                rotation={-5}
            />
        </div>
    )
}