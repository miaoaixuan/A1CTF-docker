import PageHeader from "@/components/A1Headers"

// i18n 多语言
import { useTranslation } from '@/app/i18n'
import A1Footer from "@/components/A1Footer";

export default async function Teams({ params }: { params: Promise<{ lng: string }>}) {
    const { lng } = await params;
    const { t } = await useTranslation(lng);

    return (
        <div className="p-0 font-[family-name:var(--font-geist-sans)] h-screen flex flex-col">
            <PageHeader lng={ lng }/>
            <main className="flex items-center justify-center p-10 flex-1 overflow-y-auto">
                Teasm page..
            </main>
            <A1Footer/>
        </div>
    );
}
