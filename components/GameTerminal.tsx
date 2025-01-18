"use client";

import dynamic from "next/dynamic";
import { TerminalContextProvider } from "react-terminal";

import { SkeletonCard } from "@/components/SkeletonCard";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

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

export function GameTerminal() {

    const { theme } = useTheme();

    const [ terminalTheme, setTerminalTheme ] = useState(theme == "dark" ? "a1-theme-dark" : "a1-theme")

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
                <span><span className="text-cyan-400">submit</span> &lt;flag&gt; -- submit your flag</span><br/>
                <span><span className="text-cyan-400">download</span> -- download attachments</span><br/>
                <span><span className="text-cyan-400">ciallo</span> -- <span className="text-purple-400">Your can guess~</span></span>
            </div>
        ),
        submit: (flag: string) => {
            if (!flag.length) return (
                <span>Usage: submit &lt;flag&gt;</span>
            )

            return (
                <div className="bg-green-600 pl-3 pr-3 pt-2 pb-2 w-[360px] rounded-lg mt-2">
                    Correct! Your winned <span className="text-red-500 font-bold">300</span> scores!
                </div>
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
