import PageHeader from "@/components/A1Headers"
import A1Footer from "@/components/A1Footer";
import AnimatedButton from "@/components/AnimatedButton"
import GameSwitchHover from "@/components/GameSwitchHover"

// i18n 多语言
import { useTranslation } from '@/app/i18n'
import { Button } from "@/components/ui/button";

export default async function Games({ params }: { params: Promise<{ lng: string }>}) {
    
    const { lng } = await params;
    const { t } = await useTranslation(lng);

    return (
        <div className="p-0 font-[family-name:var(--font-geist-sans)] h-screen flex flex-col">
            <PageHeader lng={ lng }/>
            <main className="flex p-10 flex-1 overflow-y-auto justify-center items-center">
                {/* <GameSwitchHover x={800} y={100}/> */}
                <div className="mt-[-400px] ml-[-1200px]">
                    <AnimatedButton id={114514}>Click Me</AnimatedButton>
                </div>
            </main>
            {/* <A1Footer/> */}
        </div>
    );
}
