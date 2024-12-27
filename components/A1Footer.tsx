import { Label } from "@radix-ui/react-dropdown-menu"
import Link from "next/link";
import { History, Box } from 'lucide-react'

const A1Footer = () => {
    return (
        <footer className="h-14 flex justify-center items-center border-t font-bold text-xs lg:text-base">
            <Box /> 
            <Label className="ml-2">A1CTF for A1natas</Label>
            <Label className="ml-2 mr-2">/</Label>
            <Link className="underline decoration-2 underline-offset-2" href="">carbofish</Link>
            <Label className="ml-2 mr-2">/</Label>
            <History size={30} className="p-1 hover:hsl(var(--primary), 0.9) rounded-[8px] transition-all duration-200 ease-in-out transform hover:scale-110 active:scale-95" />
        </footer>
    )
}

export default A1Footer;