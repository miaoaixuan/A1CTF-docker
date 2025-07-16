import { MacScrollbar } from "mac-scrollbar";
import { Mdx } from "./MdxCompoents";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { api } from "utils/GZApi";
import { LoadingPage } from "./LoadingPage";
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";

export function AboutPage () {

    const { theme } = useTheme()

    const { clientConfig } = useGlobalVariableContext()

    const [source, setSource] = useState(clientConfig.AboutUS)

    const memoizedDescription = useMemo(() => {
        return source ? (
          <div className="flex flex-col gap-0">
            <Mdx source={source} />
          </div>
        ) : (
          <span>Empty</span>
        );
    }, [source]); // 只依赖description

    return (
        <div className="flex w-full h-full relative">
            <MacScrollbar className="overflow-y-auto w-full h-full pl-3 pr-3 md:pl-8 md:pr-8 lg:pl-20 lg:pr-20 pt-4 pb-4"
                skin={theme == "light" ? "light" : "dark"}
            >
                <div className="flex w-full justify-center">
                    <div className="max-w-[90%] md:max-w-[80%] lg:max-w-[75%] xl:max-w-[70%]">
                        { memoizedDescription }
                    </div>
                </div>
            </MacScrollbar>
        </div>
    )
}