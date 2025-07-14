import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Squares from "../reactbits/Squares/Squares";
import { useCanvas } from "contexts/CanvasProvider";
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";
import LogoBackgroundAnimation from "./LogoBackgroundAnimation";

export default function FancyBackground() {
    const { clientConfig } = useGlobalVariableContext()

    if (!clientConfig.FancyBackGroundIconWhite) return <></>

    return (
        <div className="w-screen h-screen absolute top-0 left-0 pointer-events-none">
            <LogoBackgroundAnimation
                direction="diagonal"
                speed={0.05}
                imageSizeX={241.2}
                imageSizeY={122.39}
            />
        </div>
    )
}