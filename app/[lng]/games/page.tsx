import PageHeader from "@/components/A1Headers"
import A1Footer from "@/components/A1Footer";

// i18n 多语言
import { useTranslation } from '@/app/i18n'

export default async function Games({ params }: { params: Promise<{ lng: string }>}) {
    
    const { lng } = await params;
    const { t } = await useTranslation(lng);

    return (
        <div className="p-0 font-[family-name:var(--font-geist-sans)] h-screen grid grid-rows-[theme(spacing.16)_1fr_theme(spacing.14)]">
            <PageHeader lng={ lng }/>
            <main className="flex items-center justify-center p-10">
                Games page..
            </main>
            <A1Footer/>
        </div>
    );
}
