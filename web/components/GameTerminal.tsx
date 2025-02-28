"use client";

import dynamic from "next/dynamic";
import { TerminalContextProvider } from "react-terminal";

import { SkeletonCard } from "@/components/SkeletonCard";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import api, { ChallengeDetailModel, AnswerResult } from '@/utils/GZApi'
import { TerminalContent, TerminalContentCustom } from "./TerminalContent";

import Image from "next/image";

// 使用 dynamic 懒加载 ReactTerminal，并禁用服务器端渲染
const ReactTerminal = dynamic(
    () => import("react-terminal").then((mod) => mod.ReactTerminal),
    {
        ssr: false, // 禁用服务器端渲染
        loading: () => (
            <div className="w-full h-full">
                <SkeletonCard />
            </div>
        ), // 占位符
    }
);

export function GameTerminal( { gameid, challenge } : { gameid: string, challenge: ChallengeDetailModel }) {

    const { theme } = useTheme();

    const [ terminalTheme, setTerminalTheme ] = useState(theme == "dark" ? "a1-theme-dark" : "a1-theme")
    const gmid = parseInt(gameid, 10)

    useEffect(() => {
        if (theme === "dark") {
            setTerminalTheme("a1-theme-dark");
        } else {
            setTerminalTheme("a1-theme");
        }
    }, [theme]); // 当 theme 改变时执行

    // 定义终端命令
    const commands = {
        help: (
            <div>
                <div className="flex items-center"><TerminalContentCustom className="bg-lime-700 text-white p-1 pl-2 pr-2 rounded-md">Submit &lt;flag&gt; -- submit your flag</TerminalContentCustom></div>
                <span><span className="text-cyan-400">download</span> -- download attachments</span><br/>
                <span><span className="text-cyan-400">ciallo</span> -- <span className="text-purple-400">Your can guess~</span></span>
            </div>
        ),
        submit: async (flag: string) => {

            if (!challenge.title) return (
                <TerminalContent className="bg-red-500 text-white" >Choose a challenge first!</TerminalContent>
            )

            if (!flag.length) return (
                <TerminalContent className="bg-red-500 text-white" >Usage: submit &lt;flag&gt;</TerminalContent>
            )
            
            const { data: submitID } = await api.game.gameSubmit(gmid, challenge.id || 0, { flag })
            const { data: flagStatus } = await api.game.gameStatus(gmid, challenge.id || 0, submitID)

            switch (flagStatus) {
                case AnswerResult.Accepted:
                    return (
                        <TerminalContent className="bg-green-600 text-white" >Correct!</TerminalContent>
                    )
                case AnswerResult.WrongAnswer:
                    return (
                        <TerminalContent className="bg-red-500 text-white" >Wrong</TerminalContent>
                    )
                default:
                    return (
                        <TerminalContent className="bg-purple-400 text-white" >Unknow Error</TerminalContent>
                    )
            }
        },
        download: () => {
            // challenge.context
            return (<></>)
        },
        enllus1on: () => {
            return (
                <Image
                    className="mt-2 rounded-xl"
                    src="/images/enllu.jpg"
                    alt="enllus1on"
                    width={200}
                    height={200}
                    priority
                />
            )
        }
    };

    const welcomeMessage = (
        <span>
          [A1CTF] Weclome! Type &quot;help&quot; for all available commands. <br /><br />
        </span>
    );

    return (
        <TerminalContextProvider>
            <ReactTerminal
                commands={commands}
                showControlBar={false}
                welcomeMessage={welcomeMessage}
                prompt={ `${challenge.title ? challenge.title : ""} >>>` }
                themes={{
                    "a1-theme": {
                        themeBGColor: "transparent",
                        themeToolbarColor: "transparent",
                        themeColor: "#000000", // 文字颜色
                        themePromptColor: "#a917a8"
                    },
                    "a1-theme-dark": {
                        themeBGColor: "transparent",
                        themeToolbarColor: "transparent",
                        themeColor: "#ffffff", // 文字颜色
                        themePromptColor: "#60a5fa"
                    }
                }}
                theme={terminalTheme}
            />
        </TerminalContextProvider>
    );
}
