import { MacScrollbar } from "mac-scrollbar";
import { Mdx } from "./MdxCompoents";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { api } from "utils/GZApi";
import { LoadingPage } from "./LoadingPage";
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";
import { Rss } from "lucide-react";

export function AboutPage() {

    const { theme } = useTheme()

    const { clientConfig } = useGlobalVariableContext()

    const [source, setSource] = useState(clientConfig.AboutUS)

    const memoizedDescription = useMemo(() => {
        return <div className="w-full">
            <Mdx source={source} />
        </div>
    }, [source]); // 只依赖description

    return (
        <div className="flex w-full h-full relative">
            {source ? (
                <MacScrollbar className="w-full"
                    skin={theme == "light" ? "light" : "dark"}
                >
                    <div className="container mx-auto py-10 pt-5 px-5 md:px-0">
                        {memoizedDescription}
                    </div>
                </MacScrollbar>
            ) : (
                <div className="w-full h-full flex items-center justify-center flex-col gap-6">
                    <Rss size={64} />
                    <span className="font-bold text-3xl">Content is empty..</span>
                </div>
            )}
        </div>
    )
}