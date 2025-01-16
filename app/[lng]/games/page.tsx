import PageHeader from "@/components/A1Headers"
import A1Footer from "@/components/A1Footer";

// i18n 多语言
import { useTranslation } from '@/app/i18n'

export default async function Games({ params }: { params: Promise<{ lng: string }>}) {
    
    const { lng } = await params;
    const { t } = await useTranslation(lng);

    return (
        <div className="p-0 font-[family-name:var(--font-geist-sans)] h-screen flex flex-col">
            <PageHeader lng={ lng }/>
            <main className="flex p-10 flex-1 overflow-y-auto">
                <div className="bg-red-200 w-full h-80 overflow-x-auto">
                </div>
            </main>
            <A1Footer/>
        </div>
    );
}
