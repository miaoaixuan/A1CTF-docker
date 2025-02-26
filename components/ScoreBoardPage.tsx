"use client";

import api, { ChallengeDetailModel, GameDetailModel, DetailedGameInfoModel, GameNotice, NoticeType, ScoreboardModel, ScoreboardItem, ChallengeInfo } from '@/utils/GZApi'
import { ChartArea, LogOut, X } from 'lucide-react'

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import ReactECharts from 'echarts-for-react';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import ThemeSwitcher from './ToggleTheme';
import { useTheme } from 'next-themes';
import { ScoreTable } from './ScoreTable';

import { Tooltip } from 'react-tooltip';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './ui/button';

import { randomInt } from "mathjs";
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Skeleton } from './ui/skeleton';
import { MacScrollbar } from 'mac-scrollbar';

export default function ScoreBoardPage({ gmid, visible, setVisible, gameStatus } : { gmid: number, visible: boolean, setVisible: Dispatch<SetStateAction<boolean>>, gameStatus: string }) {


    const [ gameInfo, setGameInfo ] = useState<DetailedGameInfoModel>()
    const [ chartData, setChartData ] = useState<any>([])

    const { theme, resolvedTheme } = useTheme();
    const [scoreBoardModel, setScoreBoardModel] = useState<ScoreboardModel>()

    const lastTimeLine = useRef<string>()
    const [ showGraphy, setShowGraphy ] = useState(false)

    const [ chartOption, setChartOpton ] = useState<echarts.EChartsOption>() 
    const [ showUserDetail, setShowUserDetail ] = useState<ScoreboardItem>({})
    const [ personalChartOption, setPersonalChartOption ] = useState<echarts.EChartsOption>() 
    const lastPersonalTimeLine = useRef<string>()

    const visibleRef = useRef(false)

    useEffect(() => {

        if (!gameInfo?.title) return

        const updateScoreBoard = () => {
            api.game.gameScoreboard(gmid).then((res) => {

                setScoreBoardModel(res.data)

                const current = dayjs()
                const end = dayjs(gameInfo.end).diff(current) > 0 ? current : dayjs(gameInfo.end)
                
                const curTimeLine = JSON.stringify(res.data.timeLines)

                if (curTimeLine != lastTimeLine.current) {
                    lastTimeLine.current = curTimeLine

                    setChartOpton({
                        backgroundColor: 'transparent',
                        tooltip: {
                            trigger: 'axis',
                            borderWidth: 0,
                            textStyle: {
                                fontSize: 12,
                                color: theme == "dark" ? "#121212" : "#FFFFFF",
                            },
                            backgroundColor: theme == "dark" ? "#FFFFFF" : "#121212"
                        },
                        title: {
                            left: 'center',
                            text: `${gameInfo?.title} - 记分榜`,
                            textStyle: {
                                color: theme == "dark" ? "#FFFFFF" : "#121212",
                            }
                        },
                        toolbox: {
                            show: true,
                            feature: {
                                dataZoom: {
                                    yAxisIndex: 'none'
                                },
                                restore: {},
                                saveAsImage: {}
                            }
                        },
                        xAxis: {
                            type: 'time',
                            min: dayjs(gameInfo?.start).toDate(),
                            max: dayjs(gameInfo?.end).toDate(),
                            splitLine: {
                                show: false,
                            },
                        },
                        yAxis: {
                            type: 'value',
                            boundaryGap: [0, '100%'],
                            max: (value: any) => (Math.floor(value.max / 1000) + 1) * 1000,
                            splitLine: {
                                show: true,
                            },
                        },
                        dataZoom: [
                            {
                                type: 'inside',
                                start: 0,
                                end: 100,
                                xAxisIndex: 0,
                                filterMode: 'none'
                            },
                            {
                                start: 0,
                                end: 100,
                                xAxisIndex: 0,
                                showDetail: false,
                            }
                        ],
                        series: [
                            {
                                type: 'line',
                                step: 'end',
                                data: [],
                                markLine:
                                    dayjs(gameInfo.end).diff(dayjs(), 's') < 0
                                        ? undefined
                                        : {
                                            symbol: 'none',
                                            data: [
                                                {
                                                    xAxis: +end.toDate(),
                                                    // lineStyle: {
                                                    //     color: colorScheme === 'dark' ? "#FFFFFF" : "#000000",
                                                    //     wight: 2,
                                                    // },
                                                    label: {
                                                        textBorderWidth: 0,
                                                        fontWeight: 500,
                                                        formatter: (time: any) => dayjs(time.value).format('YYYY-MM-DD HH:mm'),
                                                    },
                                                },
                                            ],
                                        },
                            },
                            ...(res.data.timeLines?.all.map((team) => ({
                                name: team.name,
                                type: 'line',
                                showSymbol: false,
                                step: 'end',
                                data: [
                                    [+new Date(dayjs(gameInfo.start).toDate()), 0],
                                    ...(team.items?.map((item) => [item.time || 0, item.score || 0]) || []),
                                    [+end.toDate(), (team.items && team.items[team.items.length - 1]?.score) || 0]
                                ],
                                lineStyle: {
                                    width: 3
                                },
                                smooth: true,
                            }) as echarts.SeriesOption) || [])
                        ] as echarts.SeriesOption[]
                    })
                }
                
            })
        }

        setTimeout(() => updateScoreBoard(), 1000)
        const scoreBoardInter = setInterval(() => {
            if (visibleRef.current) updateScoreBoard()
        }, randomInt(4000, 5000))
        
        return () => {
            clearInterval(scoreBoardInter)
        }
    }, [gameInfo])

    useEffect(() => {
        visibleRef.current = visible
    }, [visible])

    useEffect(() => {
        if (gameStatus != "unLogin" && gameStatus != "") {
            api.game.gameGame(gmid).then((res) => { setGameInfo(res.data) })
        }
    }, [gameStatus])

    useEffect(() => {

        if (!gameInfo) return
        const current = dayjs()
        const end = dayjs(gameInfo.end).diff(current) > 0 ? current : dayjs(gameInfo.end)
        
        const curTimeLine = JSON.stringify(scoreBoardModel?.timeLines?.all.find((e) => e.id == showUserDetail.id))

        if (curTimeLine != lastPersonalTimeLine.current) {
            lastPersonalTimeLine.current = curTimeLine

            setPersonalChartOption({
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    borderWidth: 0,
                    textStyle: {
                        fontSize: 12,
                        color: theme == "dark" ? "#121212" : "#FFFFFF",
                    },
                    backgroundColor: theme == "dark" ? "#FFFFFF" : "#121212"
                },
                title: {
                    left: 'center',
                    text: `${showUserDetail.name} - 记分榜`,
                    textStyle: {
                        color: theme == "dark" ? "#FFFFFF" : "#121212",
                    }
                },
                toolbox: {
                    show: false,
                    feature: {
                        dataZoom: {
                            yAxisIndex: 'none'
                        },
                        restore: {},
                        saveAsImage: {}
                    }
                },
                xAxis: {
                    type: 'time',
                    min: dayjs(gameInfo?.start).toDate(),
                    max: dayjs(gameInfo?.end).toDate(),
                    splitLine: {
                        show: false,
                    },
                },
                yAxis: {
                    type: 'value',
                    boundaryGap: [0, '100%'],
                    max: (value: any) => (Math.floor(value.max / 1000) + 1) * 1000,
                    splitLine: {
                        show: true,
                    },
                },
                dataZoom: [
                    {
                        type: 'inside',
                        start: 0,
                        end: 100,
                        xAxisIndex: 0,
                        filterMode: 'none'
                    },
                    {
                        start: 0,
                        end: 100,
                        xAxisIndex: 0,
                        showDetail: false,
                    }
                ],
                series: [
                    {
                        type: 'line',
                        step: 'end',
                        data: [],
                        markLine:
                            dayjs(gameInfo.end).diff(dayjs(), 's') < 0
                                ? undefined
                                : {
                                    symbol: 'none',
                                    data: [
                                        {
                                            xAxis: +end.toDate(),
                                            // lineStyle: {
                                            //     color: colorScheme === 'dark' ? "#FFFFFF" : "#000000",
                                            //     wight: 2,
                                            // },
                                            label: {
                                                textBorderWidth: 0,
                                                fontWeight: 500,
                                                formatter: (time: any) => dayjs(time.value).format('YYYY-MM-DD HH:mm'),
                                            },
                                        },
                                    ],
                                },
                    },
                    ...(scoreBoardModel?.timeLines?.all.filter((e) => e.id == showUserDetail.id).map((team) => ({
                        name: team.name,
                        type: 'line',
                        showSymbol: false,
                        step: 'end',
                        data: [
                            [+new Date(dayjs(gameInfo.start).toDate()), 0],
                            ...(team.items?.map((item) => [item.time || 0, item.score || 0]) || []),
                            [+end.toDate(), (team.items && team.items[team.items.length - 1]?.score) || 0]
                        ],
                        lineStyle: {
                            width: 3
                        },
                        smooth: true,
                    }) as echarts.SeriesOption) || [])
                ] as echarts.SeriesOption[]
            })
        }
    }, [showUserDetail])

    const getChallenge = (id: number): ChallengeInfo => {
        let target = {}
        if (scoreBoardModel?.challenges) {
            Object.values(scoreBoardModel.challenges).forEach((es) => {
                const tmp = es.find((e) => e.id == id)
                if (tmp) target = tmp;
            })
        }
        return target
    }


    return (
        <>
            <AnimatePresence>
                { showGraphy && (
                    <motion.div className='absolute top-0 left-0 w-screen h-screen z-[300] flex items-center justify-center overflow-hidden'
                        initial={{
                            backdropFilter: "blur(0px)"
                        }}
                        animate={{
                            backdropFilter: "blur(12px)"
                        }}
                        exit={{
                            backdropFilter: "blur(0px)"
                        }}
                    >
                        <motion.div className='absolute top-10 right-10 lg:top-20 lg:right-20'
                            initial={{
                                opacity: 0
                            }}
                            animate={{
                                opacity: 1
                            }}
                            exit={{
                                opacity: 0
                            }}
                        >
                            <Button className='w-[50px] h-[50px] [&_svg]:size-8 rounded-lg' variant="default"
                                onClick={() => {
                                    setShowGraphy(false)
                                }}
                            >
                                <X />
                            </Button>
                        </motion.div>
                        <motion.div className='w-[90%] lg:w-[80%] h-[60%]'
                            initial={{
                                opacity: 0
                            }}
                            animate={{
                                opacity: 1
                            }}
                            exit={{
                                opacity: 0
                            }}
                        >
                            {
                                chartOption && (
                                    <ReactECharts
                                        option={chartOption}
                                        notMerge={false}
                                        lazyUpdate={true}
                                        style={{
                                            height: "100%"
                                        }}
                                        opts={{
                                            renderer: 'svg'
                                        }}
                                        theme={"theme_name"}
                                        // onChartReady={this.onChartReadyCallback}
                                        // onEvents={EventsDict}
                                        // opts={}
                                    />
                                )
                            }
                        </motion.div>
                    </motion.div>
                ) }
            </AnimatePresence>
            <AnimatePresence>
                { showUserDetail.id && (
                    <motion.div className='absolute top-0 left-0 w-screen h-screen z-[300] flex items-center justify-center overflow-hidden'
                        initial={{
                            backdropFilter: "blur(0px)"
                        }}
                        animate={{
                            backdropFilter: "blur(12px)"
                        }}
                        exit={{
                            backdropFilter: "blur(0px)"
                        }}
                    >
                        <motion.div className='absolute top-10 right-10 lg:top-15 lg:right-15'
                            initial={{
                                opacity: 0
                            }}
                            animate={{
                                opacity: 1
                            }}
                            exit={{
                                opacity: 0
                            }}
                        >
                            <Button className='w-[50px] h-[50px] [&_svg]:size-8 rounded-lg' variant="default"
                                onClick={() => {
                                    setShowUserDetail({})
                                }}
                            >
                                <X />
                            </Button>
                        </motion.div>
                        <motion.div className='w-[100%] pl-6 pt-10 pb-6 lg:p-0 lg:w-[90%] h-[100%] lg:h-[70%]'
                            initial={{
                                opacity: 0
                            }}
                            animate={{
                                opacity: 1
                            }}
                            exit={{
                                opacity: 0
                            }}
                        >
                            <Tooltip id="challengeTooltip2" opacity={0.9} className='z-[200]'/>
                            <MacScrollbar className='w-full h-full overflow-y-auto pr-3 lg:pr-0 lg:overflow-hidden' skin={theme == "light" ? "light" : "dark"} suppressScrollX>
                                <div className='flex flex-row h-full w-full gap-4'>
                                    <div className='flex flex-col w-full h-full gap-1 lg:basis-1/2 lg:overflow-hidden'>
                                        <div className='flex items-center gap-4 mb-3'>
                                            <Avatar className="select-none w-12 h-12">
                                                { showUserDetail.avatar ? (
                                                    <>
                                                        <AvatarImage src={showUserDetail.avatar || "#"} alt="@shadcn" />
                                                        <AvatarFallback><Skeleton className="h-12 w-12 rounded-full" /></AvatarFallback>
                                                    </>
                                                ) : ( 
                                                    <div className='w-full h-full bg-foreground/80 flex items-center justify-center'>
                                                        <span className='text-background text-lg'> { showUserDetail.name?.substring(0, 2) } </span>
                                                    </div>
                                                ) }
                                            </Avatar>
                                            <span className='text-3xl font-bold'>{ showUserDetail.name }</span>
                                        </div>
                                        <span className='text-2xl'>Rank: { showUserDetail.rank } </span>
                                        <span className='text-2xl'>Solved { showUserDetail.solvedCount } problems</span>
                                        <span className='text-2xl'>Score: { showUserDetail.score } pts</span>
                                        <span className='text-2xl'>Slogan: { showUserDetail.bio || "He didn't say anything." } </span>
                                        <div className='lg:pr-14 pt-5 h-[400px] flex-shrink-0 lg:h-auto lg:flex-1'>
                                            { personalChartOption && (
                                                <ReactECharts
                                                    option={personalChartOption}
                                                    notMerge={false}
                                                    lazyUpdate={true}
                                                    style={{
                                                        height: "100%"
                                                    }}
                                                    opts={{
                                                        renderer: 'svg'
                                                    }}
                                                    theme={"theme_name"}
                                                    // onChartReady={this.onChartReadyCallback}
                                                    // onEvents={EventsDict}
                                                    // opts={}
                                                />
                                            ) }
                                        </div>
                                        <div className='flex flex-col w-full lg:hidden p-2'>
                                            <div className={`flex h-9 flex-none items-center border-b-2`}>
                                                <div className='w-[150px] flex-shrink-0 justify-center border-r-2 h-full items-center hidden lg:flex'>
                                                    <span>Solved Time</span>
                                                </div>
                                                <div className='flex-1 flex justify-center border-r-2 h-full items-center'>
                                                    <span className=''>Challenge name</span>
                                                </div>
                                                <div className='w-[100px] flex-shrink-0 flex justify-center h-full items-center'>
                                                    <span className=''>Score</span>
                                                </div>
                                            </div>
                                            { showUserDetail.solvedChallenges?.map((e, index) => (
                                                <div key={`solved-problem-${index}`} className={`flex h-9 flex-none items-center border-b-2 gap-2`}>
                                                    <div className='w-[150px] flex-shrink-0 justify-center hidden lg:flex'>
                                                        <span>{ dayjs(e.time).format("MM-DD HH:mm:ss") }</span>
                                                    </div>
                                                    <div className='flex-1 overflow-hidden'>
                                                        <span className='text-nowrap overflow-hidden text-ellipsis'
                                                            data-tooltip-id="challengeTooltip2"
                                                            data-tooltip-html={ `<div class='text-sm flex flex-col'><span>${dayjs(e.time).format("MM-DD HH:mm:ss")}</span><span>${e.userName}</span><span>${getChallenge(e.id || 0).title}</span></div>` }
                                                        >{ getChallenge(e.id || 0).title }</span>
                                                    </div>
                                                    <div className='w-[100px] flex-shrink-0 flex overflow-hidden'>
                                                        <span className='text-green-500'> + { e.score } pts</span>
                                                    </div>
                                                </div>
                                            )) }
                                        </div>
                                    </div>
                                    <div className='h-full basis-1/2 overflow-hidden hidden lg:flex'>
                                        <MacScrollbar className='flex flex-col w-full overflow-hidden pr-5' skin={theme == "light" ? "light" : "dark"}>
                                            <div className={`flex h-9 flex-none items-center border-b-2 w-full`}>
                                                <div className='w-[150px] flex-shrink-0 flex justify-center border-r-2 h-full items-center'>
                                                    <span>Solved Time</span>
                                                </div>
                                                <div className='w-[100px] flex-shrink-0 flex justify-center border-r-2 h-full items-center'>
                                                    <span>User</span>
                                                </div>
                                                <div className='flex-1 flex justify-center border-r-2 h-full items-center'>
                                                    <span className=''>Challenge name</span>
                                                </div>
                                                <div className='w-[120px] flex-none flex justify-center h-full items-center'>
                                                    <span className=''>Score</span>
                                                </div>
                                            </div>
                                            { showUserDetail.solvedChallenges?.map((e, index) => (
                                                <div key={`solved-problem-${index}`} className={`flex h-9 flex-none items-center border-b-2`}>
                                                    <div className='w-[150px] flex-shrink-0 flex justify-center'>
                                                        <span>{ dayjs(e.time).format("MM-DD HH:mm:ss") }</span>
                                                    </div>
                                                    <div className='w-[100px] flex-shrink-0 flex justify-center overflow-hidden'>
                                                        <span className='text-nowrap overflow-hidden text-ellipsis'>{ e.userName }</span>
                                                    </div>
                                                    <div className='flex-1 overflow-hidden pl-2 pr-2'>
                                                        <span className='text-nowrap overflow-hidden text-ellipsis'>{ getChallenge(e.id || 0).title }</span>
                                                    </div>
                                                    <div className='w-[120px] flex-none flex overflow-hidden justify-center'>
                                                        <span className='text-green-500'> + { e.score } pts</span>
                                                    </div>
                                                </div>
                                            )) }
                                        </MacScrollbar>
                                    </div>
                                </div>
                            </MacScrollbar>
                        </motion.div>
                    </motion.div>
                ) }
            </AnimatePresence>
            <AnimatePresence>
                { visible && (
                    <motion.div className='absolute top-0 left-0 h-screen w-screen bg-background z-40 transition-colors duration-300'
                        initial={{
                            opacity: 0
                        }}
                        animate={{
                            opacity: 1
                        }}
                        exit={{
                            opacity: 0
                        }}
                    >
                        <Tooltip id="challengeTooltip" opacity={0.9} className='z-[200]'/>
                        <div className='w-full h-full flex flex-col relative p-10  gap-2'>
                            <div id='scoreHeader' className='w-full h-[60px] flex items-center'>
                                <span className='text-3xl font-bold [text-shadow:_hsl(var(--foreground))_1px_1px_20px] select-none'>ScoreBoard</span>
                                <div className='flex-1' />
                                {/* <ThemeSwitcher lng='zh' /> */}
                                <ChartArea size={32} className=' ml-4 hover:scale-110 transition-all duration-300 ease-linear' onClick={() => {
                                    setShowGraphy(true)
                                }} />
                                <LogOut size={32} className=' ml-4 hover:scale-110 transition-all duration-300 ease-linear' onClick={() => {
                                    setVisible(false)
                                }} />
                            </div>
                            <div className='flex flex-1 overflow-y-auto overflow-x-hidden h-full justify-center'>
                                <div className='flex overflow-hidden'>
                                    <div className='flex flex-1 overflow-hidden'>
                                        { scoreBoardModel && (
                                            <ScoreTable scoreBoardModel={scoreBoardModel} setShowUserDetail={setShowUserDetail} />
                                        ) }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) }
            </AnimatePresence>
        </>
    )
}