"use client";

import dynamic from "next/dynamic";
import { TerminalContextProvider } from "react-terminal";

import { SkeletonCard } from "@/components/SkeletonCard";

// 使用 dynamic 懒加载 ReactTerminal，并禁用服务器端渲染
const ReactTerminal = dynamic(
    () => import("react-terminal").then((mod) => mod.ReactTerminal),
    {
        ssr: false, // 禁用服务器端渲染
        loading: () => <SkeletonCard />, // 占位符
    }
);

export function GameTerminal() {
    // 定义终端命令
    const commands = {
        whoami: "jackharper",
        cd: (directory: string) => `changed path to ${directory}`
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
                theme="material-dark"
            />
        </TerminalContextProvider>
    );
}
