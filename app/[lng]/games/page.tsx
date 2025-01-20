import PageHeader from "@/components/A1Headers"
import AnimatedButton from "@/components/AnimatedButton"

export default async function Games({ params }: { params: Promise<{ lng: string }>}) {
    
    const { lng } = await params;

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
