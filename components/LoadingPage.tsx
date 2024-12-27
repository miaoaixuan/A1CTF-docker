"use client";

import { Label } from "@radix-ui/react-label";

export const LoadingPage = () => {
    return (
        <div className="w-screen h-screen flex justify-center items-center z-50 absolute backdrop-blur-lg">
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