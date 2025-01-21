import { A1LogoWithoutAnimation } from "@/components/A1LogoWithoutAnimation";

import { ChallengesView } from '@/components/ChallengesView';

export default async function Games({ params }: { params: Promise<{ lng: string, id: string }>}) {
    
    const { lng, id } = await params;

    return (
        <div className="p-0 font-[family-name:var(--font-geist-sans)] h-screen relative">
            <div className="absolute top-0 left-0 w-screen h-screen z-[-19] overflow-hidden">
                <div className="w-[400px] h-[400px] absolute bottom-[-120px] right-[-120px] rotate-[-20deg]">
                    <A1LogoWithoutAnimation />
                </div>
                {/* <div className="absolute w-[calc(100vw-2px)] h-[calc(100vh-2px)] top-[0px] left-[0px] border-2 z-[-20] dark:border-white">
                </div> */}
            </div>
            <ChallengesView id={id} lng={lng} />
        </div>
    );
}
