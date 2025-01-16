"use client";

import { Label } from "@radix-ui/react-label";
import { useEffect, useState } from "react";

export const LoadingPage = () => {

    const [visible, setvisible] = useState(true);

    useEffect(() => {
        console.log("Loading....")
        const timer = setTimeout(() => {
            console.log("OK")
            setvisible(false)
        }, 500);
        return () => clearTimeout(timer);
    });

    return (
        <div className={`w-screen h-screen flex justify-center items-center z-50 absolute backdrop-blur-xl transition-opacity duration-300 ease-in-out ${
            visible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}>
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
    )
}