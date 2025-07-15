import { Loader2, LoaderCircle, LoaderPinwheel } from "lucide-react";
import { useEffect, useState } from "react";

export const LoadingPage = ({visible, screen = true, absolute = false} : { visible: boolean, screen?: boolean, absolute?: boolean }) => {

    return (
        <div className={`${ screen ? "w-screen h-screen" : "w-full h-full"} ${ absolute && "absolute" } select-none flex justify-center items-center z-50 absolute bg-background transition-opacity duration-300 ease-in-out overflow-hidden ${
            visible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}>
            <div className="flex">
                <Loader2 className="animate-spin" />
                <span className="font-bold ml-3">Loading...</span>
            </div>
        </div>
    )
}