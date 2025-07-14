import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "components/ui/dropdown-menu"

import { SidebarTrigger } from "components/ui/sidebar"
import { Button } from "components/ui/button"
import { AppWindow, Bath, Cable, CircleCheck, CircleX, Loader2, PackageOpen, Presentation, Settings, TriangleAlert, X } from "lucide-react"
import ToggleTheme from "components/ToggleTheme"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "components/ui/avatar"

import { Badge } from "components/ui/badge"
import { Dispatch, SetStateAction, Suspense, useEffect, useState } from "react";
import dayjs from "dayjs";
import { GameNotice, NoticeCategory, UserFullGameInfo, UserProfile } from "utils/A1API";
import { useTranslation } from "react-i18next";
import { Skeleton } from "components/ui/skeleton";
import { ProfileUserInfoModel } from "utils/GZApi";
import AvatarUsername from "../AvatarUsername"
import { EditTeamDialog } from "components/dialogs/EditTeamDialog"
import { useNavigate } from "react-router"

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "components/ui/tooltip"

const ChallengesViewHeader = (
    {
        gameStatus,
        gameInfo,
        setNoticeOpened,
        setScoreBoardVisible,
        notices,
        wsStatus,
        curProfile,
        loadingVisible
    }: {
        gameStatus: string,
        gameInfo: UserFullGameInfo | undefined,
        setNoticeOpened: (arg0: boolean) => void,
        setScoreBoardVisible: (arg0: boolean) => void,
        notices: GameNotice[],
        wsStatus: "connecting" | "connected" | "disconnected",
        curProfile: UserProfile,
        loadingVisible: boolean
    },
) => {

    // 剩余时间 & 剩余时间百分比
    const [remainTime, setRemainTime] = useState("00s")
    const [remainTimePercent, setRemainTimePercent] = useState(100)

    const navigator = useNavigate()

    const { t } = useTranslation('challenge_view');

    const formatDuration = (duration: number) => {
        duration = Math.floor(duration)

        const days = Math.floor(duration / (24 * 3600));
        const hours = Math.floor((duration % (24 * 3600)) / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;

        if (days > 0) {
            return `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
        } else if (hours > 0) {
            return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
        } else if (minutes > 0) {
            return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
        } else {
            return `${String(seconds).padStart(2, '0')}s`;
        }
    }

    useEffect(() => {
        if (gameStatus != "practiceMode") {

            const totalTime = Math.floor(dayjs(gameInfo?.end_time).diff(dayjs(gameInfo?.start_time)) / 1000)

            const timeUpdateFunction = () => {
                const curLeft = Math.floor(dayjs(gameInfo?.end_time).diff(dayjs()) / 1000)

                setRemainTime(formatDuration(curLeft))
                setRemainTimePercent(Math.floor((curLeft / totalTime) * 100))
            }

            timeUpdateFunction()
            const timeIter = setInterval(timeUpdateFunction, 500)

            return () => clearInterval(timeIter)
        } else {
            setRemainTime(t("practice_time"))
            setRemainTimePercent(0)
        }
    }, [gameInfo])

    const [wsStatusTooltipVisible, setWsStatusTooltipVisible] = useState(true)

    const getWsStatusClassName = () => {
        switch (wsStatus) {
            case "connecting":
                return "animate-pulse text-yellow-500"
            case "connected":
                return "text-green-500"
            case "disconnected":
                return "text-red-500"
        }
    }

    useEffect(() => {
        if (wsStatus == "connected") {
            setTimeout(() => {
                setWsStatusTooltipVisible(false)
            }, 2000)
        } else {
            setWsStatusTooltipVisible(true)
        }
    }, [wsStatus])

    return (
        <div className="h-[70px] flex items-center pl-4 pr-4 z-20 w-full bg-transparent border-b-[1px] transition-[border-color] duration-300 flex-none">
            <div className="flex items-center min-w-0 h-[32px]">
                <SidebarTrigger className="transition-colors duration-300" />
                {/* <span className="font-bold ml-3">{ challenge.category } - { challenge.title }</span> */}
                {!loadingVisible ? (
                    <span className="font-bold ml-1 text-ellipsis overflow-hidden text-nowrap transition-colors duration-300">
                        {gameInfo?.name}
                    </span>
                ) : (
                    <Skeleton className="h-6 w-[250px] bg-foreground/10" />
                )}
            </div>
            <div className="flex-1" />
            <div id="rightArea" className="justify-end flex h-ful gap-[6px] lg:gap-[10px] items-center pointer-events-auto">
                {!loadingVisible ? (
                    <>
                        <div className="bg-background rounded-2xl">
                            <div className="bg-black/10 pl-4 pr-4 pt-1 pb-1 rounded-2xl overflow-hidden select-none dark:bg-[#2A2A2A] hidden lg:flex relative transition-colors duration-300">
                                <div className="absolute top-0 left-0 bg-black dark:bg-white transition-colors duration-300"
                                    style={{ width: `${remainTimePercent}%`, height: '100%' }}
                                />
                                <span className="text-white mix-blend-difference z-20 transition-all duration-500">{remainTime}</span>
                            </div>
                        </div>
                        {gameStatus == "running" ? (
                            <Tooltip open={wsStatusTooltipVisible} onOpenChange={(state) => {
                                if (wsStatus == "connected") {
                                    setWsStatusTooltipVisible(state)
                                }
                            }}>
                                <TooltipTrigger asChild>
                                    <div className="flex h-7 items-center justify-center">
                                        <Cable className={`${getWsStatusClassName()} transition-colors duration-300`} />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="select-none">
                                    <div className="flex flex-col gap-[4px]">
                                        <div className="flex items-center gap-[6px]">
                                            <Bath className="w-4 h-4" />
                                            <span className="font-bold">A1 Notice Service</span>
                                        </div>
                                        <div className="flex items-center w-full justify-center">
                                            {
                                                wsStatus == "connecting" ? (
                                                    <div className="flex gap-[4px] items-center text-yellow-500">
                                                        <Loader2 className="animate-spin w-4 h-4" />
                                                        <p>Connecting</p>
                                                    </div>
                                                ) : wsStatus == "connected" ? (
                                                    <p className="text-green-500">Connected</p>
                                                ) : (
                                                    <p className="text-red-300">Disconnected</p>
                                                )
                                            }
                                        </div>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        ) : <></>}
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="lg:hidden" size="icon">
                                    <AppWindow />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="mr-4 mt-2">
                                <div className="w-full h-full flex flex-col gap-1">
                                    <DropdownMenuItem>
                                        <div className="bg-black/10 pl-4 pr-4 pt-1 pb-1 rounded-2xl overflow-hidden select-none dark:bg-[#2A2A2A] relative">
                                            <div
                                                className="absolute top-0 left-0 bg-black dark:bg-white"
                                                style={{ width: `${remainTimePercent}%`, height: '100%' }}
                                            />
                                            <span className="text-white mix-blend-difference z-20">{remainTime}</span>
                                        </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setNoticeOpened(true)} disabled={notices.length == 0}>
                                        <PackageOpen />
                                        <span>{t("open_notices")}</span>
                                        {notices.length ? <Badge variant="destructive" className="p-0 pl-1 pr-1">{notices.filter((e) => e.notice_category == NoticeCategory.NewAnnouncement).length}</Badge> : <></>}
                                    </DropdownMenuItem>
                                </div>

                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="outline" className="select-none hidden lg:flex" onClick={() => setNoticeOpened(true)} disabled={notices.length == 0}>
                            <div className="flex items-center gap-1">
                                <PackageOpen />
                                <span>{t("open_notices")}</span>
                                {notices.length ? <Badge variant="destructive" className="p-0 pl-1 pr-1 text-white">{notices.filter((e) => e.notice_category == NoticeCategory.NewAnnouncement).length}</Badge> : <></>}
                            </div>
                        </Button>
                        {/* <Button size="icon" variant="outline" onClick={testFunction}><FlaskConical /></Button> */}
                    </>
                ) : (
                    <Skeleton className="h-10 w-[450px] bg-foreground/10" />
                )}
            </div>
        </div>
    )
}

export default ChallengesViewHeader