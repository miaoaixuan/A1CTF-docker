"use client";

import { MacScrollbar } from "mac-scrollbar";
import { Mdx } from "./MdxCompoents";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import api from "@/utils/GZApi";
import { LoadingPage } from "./LoadingPage";

export function AboutPage () {

    const { theme } = useTheme()
    const [source, setSource] = useState("")

    const [loadingPageVisible, setLoadingPageVisible] = useState(true)

    useEffect(() => {
        api.info.infoGetLatestPosts().then((res1) => {
            api.info.infoGetPost(res1.data[0].id).then((res2) => {
                setSource(res2.data.content)
                setLoadingPageVisible(false)
            })
        })
    }, [])

    return (
        <div className="flex w-full h-full relative">
            <LoadingPage visible={loadingPageVisible} screen={false} absolute={true} />
            <MacScrollbar className="overflow-y-auto w-full h-full pl-3 pr-3 md:pl-8 md:pr-8 lg:pl-20 lg:pr-20 pt-4 pb-4"
                skin={theme == "light" ? "light" : "dark"}
            >
                <div className="flex w-full justify-center">
                    <div className="max-w-[90%] md:max-w-[80%] lg:max-w-[75%] xl:max-w-[70%]">
                        <Mdx source={source} />
                    </div>
                </div>
            </MacScrollbar>
        </div>
    )
}