"use client";

import Link from "next/link";
import { History, Box } from 'lucide-react'

const A1Footer = () => {
    return (
        <footer className="h-14 flex justify-center items-center font-bold text-sm lg:text-base">
            <Box /> 
            <span className="ml-2">A1CTF for A1natas</span>
            <span className="ml-2 mr-2">/</span>
            <Link className="underline decoration-2 underline-offset-2" href="">carbofish</Link>
            <span className="ml-2 mr-2">/</span>
            <History size={30} className="p-1 hover:hsl(var(--primary), 0.9) rounded-[8px] transform hover:scale-110 active:scale-95" />
            {/* transition-none duration-200 ease-in-out  */}
        </footer>
    )
}

export default A1Footer;