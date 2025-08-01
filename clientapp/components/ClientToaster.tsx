import { useTheme } from "next-themes";
import { Tooltip } from "react-tooltip";
import { Toaster } from "sonner";
import { ToastContainer, cssTransition } from 'react-toastify/unstyled';
import { cn } from "lib/utils";
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";
import { useEffect } from "react";
import { title } from "process";

export function ClientToaster() {

    const { theme } = useTheme()

    const { clientConfig } = useGlobalVariableContext()

    const titleMap = {
        "/login": { title: "登录" },
        "/games/\\d+/info": { title: "游戏详情" },
        "/games/\\d+/challenges": { title: "比赛题目" },
        "/games/\\d+/scoreboard": { title: "排行榜" },
        "/games/\\d+/team": { title: "队伍管理" },
        "/games": { title: "比赛列表" },
        "/about": { title: "关于" },
        "/signup": { title: "注册" },
    }

    useEffect(() => {
        const suffix = clientConfig.systemName
        const curURL = window.location.pathname
        let matched = false;

        Object.keys(titleMap).forEach((key) => {
            const regex = new RegExp(`^${key}$`)
            if (regex.test(curURL)) {
                document.title = titleMap[key as (keyof typeof titleMap)].title + " - " + suffix
                matched = true
                return
            }
        })

        if (!matched) {
            document.title = suffix
        }
    }, [clientConfig, window.location.pathname])

    const contextClass = {
        success: "bg-green-500/5! text-green-600!",
        error: "bg-red-500/5! text-red-600!",
        info: "bg-cyan-500/5! text-cyan-600!",
        warning: "bg-yellow-500/5! text-yellow-600!",
        default: "text-foreground!",
        dark: "",
    };

    const CustomSlide = cssTransition({
        collapseDuration: 100,
        enter: "animate__animated animate__fadeInRight animate__faster",
        exit: "animate__animated animate__fadeOutRight animate__faster"
    });

    return (
        <div>
            <Toaster
                theme={theme == "light" ? "light" : "dark"}
                style={{ backgroundColor: "hsl(var(--background))" }}
                className="z-[400]"
                richColors
                position="top-right"
                visibleToasts={4}
                closeButton={true}
            />
            <ToastContainer
                position="bottom-right"
                autoClose={5000}
                hideProgressBar={false}
                closeButton={true}
                newestOnTop={false}
                closeOnClick={false}
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme={theme === "light" ? "light" : "dark"}
                transition={CustomSlide}
                toastClassName={(context) => {
                    return cn(context?.defaultClassName, 
                        contextClass[context?.type || "default"], 
                        "backdrop-blur-xs border-1 select-none border-muted!",
                        "text-sm font-bold bg-background/80! dark:bg-background/60!"
                    )
                }}
            />
            <Tooltip id="my-tooltip" className='z-[200]' />
            <Tooltip id="challengeTooltip3" opacity={0.9} className='z-[200]' />
        </div>
    )
}