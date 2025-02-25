"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { CalendarClock, CircleX, X } from "lucide-react";
import dayjs from "dayjs";
import { GameNotice, NoticeType } from "@/utils/GZApi";
import { Mdx } from "./MdxCompoents";
import { useTranslations } from "next-intl";

let messages: GameNotice[] = []

const calcTranslateX = (index: number) => {
    const width = window.innerWidth;
    const boxWidth = (width >= 1024 ? 600 : 300);
    return `${((width - boxWidth) / 2) + boxWidth}px`
}

const calcTranslateY = (index: number) => {
    const height = window.innerHeight

    let boxHeight = 0
    let untilCurBoxHeight = 0

    // 估计信息盒子的高度
    messages.forEach((ele, curIndex) => {
        // 先根据换行符拆开
        const lines = ele.values[0].split("\n")

        // 当前盒子的高度
        let curBoxHeight = 64
        // 基础的 内外高度
        boxHeight += 64

        lines.forEach((line) => {
            const line_count = Math.ceil(line.length / 68)
            // 测试得到一行文本的高度大概为 24
            boxHeight += line_count * 24
            curBoxHeight += line_count * 24
        })
        
        // gap 为 16px
        boxHeight += 16
        curBoxHeight += 16

        if (curIndex <= index) untilCurBoxHeight += curBoxHeight
    })

    boxHeight = Math.min(boxHeight, height - 80)

    const paddingTop = (height - boxHeight) / 2
    return `-${untilCurBoxHeight + paddingTop + 40}px`
}

const shouldAnimated = (index: number) => {
    const height = window.innerHeight

    let boxHeight = 0
    let untilCurBoxHeight = 0

    // 估计信息盒子的高度
    messages.forEach((ele, curIndex) => {
        // 先根据换行符拆开
        const lines = ele.values[0].split("\n")

        // 当前盒子的高度
        let curBoxHeight = 64
        // 基础的 内外高度
        boxHeight += 64

        lines.forEach((line) => {
            const line_count = Math.ceil(line.length / 68)
            // 测试得到一行文本的高度大概为 24
            boxHeight += line_count * 24
            curBoxHeight += line_count * 24
        })
        
        // gap 为 16px
        boxHeight += 16
        curBoxHeight += 16

        if (curIndex < index) untilCurBoxHeight += curBoxHeight
    })

    boxHeight = Math.min(boxHeight, height - 80)
    const paddingTop = (height - boxHeight) / 2
    
    return (untilCurBoxHeight + paddingTop) < height - 40
}

export function NoticesView({ opened, setOpened, notices }: { opened: boolean, setOpened: Dispatch<SetStateAction<boolean>>, notices: GameNotice[] }) {

    messages = notices

    const t = useTranslations("notices_view")

    // 消息卡片的可见列表
    const [visible, setVisible] = useState<boolean>(false)
    // 背景模糊的可见
    const [visible2, setVisible2] = useState<boolean>(false)

    // 延迟和动画时间
    const [durationTime, setDurationTime] = useState<Record<string, number>>({})
    const [delayTime, setDelayTime] = useState<Record<string, number>>({})

    // 懒加载，屏幕外面的消息卡片不需要动画时间
    const observerRef = useRef<IntersectionObserver | null>(null);
    const [visibleItems, setVisibleItems] = useState<Record<string, boolean>>({});

    useEffect(() => {

        // 观察
        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const target = entry.target as HTMLElement; 
                const id = target.dataset.id as string;

                if (entry.isIntersecting) {
                    setVisibleItems((prev) => ({
                        ...prev,
                        [id]: true
                    }));
                } else {
                    setVisibleItems((prev) => ({
                        ...prev,
                        [id]: false
                    }));
                }
            }
        );
        },
        {
            rootMargin: "200px 0px",
        });

        // 打开公告列表前计算每一个元素的动画时间和延迟列表
        if (opened) {
            const newDelayTime: Record<string, number> = {};
            const newDurationTime: Record<string, number> = {};

            // 由于刚打开元素没有渲染，无法得知真实宽度，只能计算得出 shouldAnimated 就是根据模拟计算出来的宽度来判断是否在屏幕内
            messages.forEach((ele, index) => {
                newDurationTime[index.toString()] = shouldAnimated(index) ? 0.9 : 0
                newDelayTime[index.toString()] = shouldAnimated(index) ? 0.1 * index : 0
            })

            // 更新
            setDelayTime(newDelayTime)
            setDurationTime(newDurationTime)

            // 计算完成后设置可视状态
            setVisible(true)
            setVisible2(true)
        } else {
            // 关闭动画由于已经渲染卡片，可以直接得到这个卡片是否在屏幕外面或者里面
            const newDelayTime: Record<string, number> = {};
            const newDurationTime: Record<string, number> = {};

            let countVar1 = 0
            let foundTop = false

            // 第一步找到有多少个可见的，第一张可见卡片前面的卡片需要在所有可视卡片动画完成后瞬间消失
            // 也就是 duration = 0, delay = visibleCount * 0.1
            let visibleCount = 0
            Object.values(visibleItems).forEach((value) => { visibleCount += value ? 1 : 0})

            // 计算每一张卡片的动画时间和延迟时间
            messages.forEach((ele, index) => {
                newDurationTime[index.toString()] = visibleItems[index.toString()] ? 0.9 : 0

                if (visibleItems[index.toString()]) {
                    newDelayTime[index.toString()] = 0.1 * countVar1
                    countVar1 += 1
                    foundTop = true
                } else {
                    if (!foundTop) {
                        // 第一张可视卡片前面的卡片延迟时间都为 0.1 * 可视卡片的数量
                        newDelayTime[index.toString()] = 0.1 * visibleCount
                    } else {
                        // 后面的全部瞬间消失
                        newDelayTime[index.toString()] = 0
                    }
                }
            })

            setDelayTime(newDelayTime)
            setDurationTime(newDurationTime)
        }
    }, [opened])

    useEffect(() => {
        // 关闭盒子
        if (!opened) {
            let visibleCount = 0
            Object.values(visibleItems).forEach((value) => { visibleCount += value ? 1 : 0})
            setVisible(false)

            // 等卡片动画结束再进行背景动画
            setTimeout(() => {
                setVisible2(false)
            }, Math.min((900 + 100 * (visibleCount)) - 500, 2000))
        }
    }, [durationTime])

    const getNoticeMessage = (notice: GameNotice) => {
        switch (notice.type) {
            case NoticeType.Normal:
                return (<Mdx source={notice.values[0]}></Mdx>)
            case NoticeType.FirstBlood:
                return (<span>{`🥇 ${notice.values[0]} ${t("blood_message_p1")} ${notice.values[1]} ${t("blood1")}`}</span>)
            case NoticeType.SecondBlood:
                return (<span>{`🥈 ${notice.values[0]} 获得了 ${notice.values[1]} ${t("blood2")}`}</span>)
            case NoticeType.ThirdBlood:
                return (<span>{`🥉 ${notice.values[0]} 获得了 ${notice.values[1]} ${t("blood3")}`}</span>)
        }
    }

    // 观察器
    const observeItem = (el: HTMLElement, id: string) => {
        if (el && observerRef.current) {
            el.dataset.id = id;
            observerRef.current.observe(el);
        }
    };

    return (
        <AnimatePresence key={`message-panel`}>
            { visible2 && (
                <motion.div className="absolute h-screen w-screen top-0 left-0 z-[100] flex items-center justify-center overflow-hidden"
                    initial={{
                        backdropFilter: "blur(0px)",
                        opacity: 0
                    }}
                    animate={{
                        backdropFilter: "blur(16px)",
                        opacity: 1
                    }}
                    exit={{
                        backdropFilter: "blur(0px)",
                        opacity: 0
                    }}
                    transition={{
                        duration: 0.3
                    }}
                >
                    <AnimatePresence>
                        { opened && (
                            <motion.div className="absolute top-[20px] left-[20px]" key="close_button"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: notices.length ? 0.3 : 0}}
                            >
                                <Button asChild variant="secondary" className="pl-4 pr-4 [&_svg]:size-5 select-none" onClick={() => setOpened(false)}>
                                    <div className="w-full h-full items-center justify-center">
                                        <CircleX />
                                        <span>Close</span>
                                    </div>
                                </Button>
                            </motion.div>
                        ) }
                    </AnimatePresence>
                    <div className="w-full overflow-y-auto" id="scroller">
                        <div className="flex flex-col gap-4 justify-center items-center p-16 lg:p-10 overflow-hidden">
                            { messages.map((mes, index) => (
                                <AnimatePresence key={`message-${index}`}>
                                    { visible && (
                                        <motion.div className="w-[300px] lg:w-[600px] border-[3px] bg-background rounded-xl"
                                            ref={(el) => observeItem(el!, index?.toString() || "")}
                                            initial={{
                                                translateX: calcTranslateX(index),
                                                translateY: calcTranslateY(index),
                                                scale: 0
                                            }}
                                            animate={{
                                                translateX: "0px",
                                                translateY: "0px",
                                                scale: 1
                                            }}
                                            exit={{
                                                translateX: calcTranslateX(index),
                                                translateY: calcTranslateY(index),
                                                scale: 0
                                            }}
                                            transition={{
                                                duration: durationTime[index.toString()],
                                                ease: "backInOut",
                                                delay: delayTime[index.toString()]
                                            }}
                                        >
                                            <div className="w-full h-full flex flex-col p-4 gap-2">
                                                <div className="flex w-full gap-2">
                                                    <CalendarClock />
                                                    <span>{ dayjs(mes.time).format("YYYY-MM-DD HH:mm:ss") }</span>
                                                </div>
                                                <div className="flex flex-col break-words">
                                                    { getNoticeMessage(mes) }
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) }
                                </AnimatePresence>
                            )) }
                        </div>
                    </div>
                </motion.div>
            ) }
        </AnimatePresence>
    )
}