import PageHeader from "@/components/A1Headers"
import AnimatedButton from "@/components/AnimatedButton"
import { ChangeGames } from "@/components/ChangeGames";
import SafeComponent from "@/components/SafeComponent";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";

export default async function Games({ params }: { params: Promise<{ lng: string }>}) {
    
    const { lng } = await params;

    return (
        <div className="p-0 font-[family-name:var(--font-geist-sans)] h-screen flex flex-col">
            <PageHeader lng={ lng }/>
            <div className="w-full flex-1 overflow-hidden">
                <ChangeGames />
            </div>
        </div>
    );
}
