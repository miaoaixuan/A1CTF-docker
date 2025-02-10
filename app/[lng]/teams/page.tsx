import PageHeader from "@/components/A1Headers"

import A1Footer from "@/components/A1Footer";

export default async function Teams({ params }: { params: Promise<{ lng: string }>}) {
    const { lng } = await params;

    return (
        <div className="p-0 h-screen flex flex-col">
            <PageHeader lng={ lng }/>
            <main className="flex items-center justify-center p-10 flex-1 overflow-hidden">
                Teasm page..
            </main>
        </div>
    );
}
