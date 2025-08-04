import dayjs, { Dayjs } from "dayjs"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next";

export default function GameTimeCounter(
    { startTime, endTime, gameStatus }: {
        startTime: string | undefined,
        endTime: string | undefined,
        gameStatus: string
    }
) {

    const { t } = useTranslation('challenge_view');

    // 剩余时间 & 剩余时间百分比
    const [remainTime, setRemainTime] = useState("00s")
    const [remainTimePercent, setRemainTimePercent] = useState(100)

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

            const totalTime = Math.floor(dayjs(endTime).diff(dayjs(startTime)) / 1000)

            const timeUpdateFunction = () => {
                const curLeft = Math.floor(dayjs(endTime).diff(dayjs()) / 1000)

                if (curLeft < 0) {
                    setRemainTime("已结束")
                    setRemainTimePercent(0)
                    clearInterval(timeIter)
                }

                setRemainTime(formatDuration(curLeft))
                setRemainTimePercent(Math.floor((curLeft / totalTime) * 100))
            }

            let timeIter: NodeJS.Timeout | undefined = undefined

            if (dayjs(startTime).isBefore(dayjs()) && dayjs(endTime).isAfter(dayjs())) {
                timeUpdateFunction()
                timeIter = setInterval(timeUpdateFunction, 500)
            } else if (dayjs(startTime).isAfter(dayjs())) {
                setRemainTime("未开始")
                setRemainTimePercent(100)
            } else if (dayjs(endTime).isBefore(dayjs())) {
                setRemainTime("已结束")
                setRemainTimePercent(0)
            }

            return () => {
                if (timeIter) clearInterval(timeIter)
            }
        } else {
            setRemainTime(t("practice_time"))
            setRemainTimePercent(0)
        }
    }, [startTime, endTime, gameStatus])

    return (
        <>
            {/* PC */}
            <div className="bg-background rounded-2xl">
                <div className="bg-black/10 pl-4 pr-4 pt-1 pb-1 rounded-2xl overflow-hidden select-none dark:bg-[#2A2A2A] hidden lg:flex relative transition-colors duration-300">
                    <div className="absolute top-0 left-0 bg-black dark:bg-white transition-colors duration-300"
                        style={{ width: `${remainTimePercent}%`, height: '100%' }}
                    />
                    <span className="text-white mix-blend-difference z-20 transition-all duration-500">{remainTime}</span>
                </div>
            </div>

            {/* 移动端 */}
            <div className="bg-black/10 lg:hidden pl-4 pr-4 pt-1 pb-1 rounded-2xl overflow-hidden select-none dark:bg-[#2A2A2A] relative">
                <div
                    className="absolute top-0 left-0 bg-black dark:bg-white"
                    style={{ width: `${remainTimePercent}%`, height: '100%' }}
                />
                <span className="text-white mix-blend-difference z-20">{remainTime}</span>
            </div>
        </>
    )
}