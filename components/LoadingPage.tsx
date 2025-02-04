"use client";

import { Label } from "@radix-ui/react-label";
import { LoaderCircle, LoaderPinwheel } from "lucide-react";
import { useEffect, useState } from "react";

export const LoadingPage = ({visible} : { visible: boolean }) => {

    return (
        <div className={`w-screen h-screen flex justify-center items-center z-50 absolute bg-background transition-opacity duration-300 ease-in-out ${
            visible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}>
            <div className="flex">
                <LoaderPinwheel className="animate-spin" />
                <Label className="font-bold ml-3">Loading...</Label>
            </div>
        </div>
    )
}