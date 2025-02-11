"use client";

import api, { ChallengeDetailModel, GameDetailModel, DetailedGameInfoModel, GameNotice, NoticeType, ScoreboardModel } from '@/utils/GZApi'
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

export default function ScoreBoardPage({ gmid, visible, setVisible } : { gmid: number, visible: boolean, setVisible: Dispatch<SetStateAction<boolean>> }) {


    const [ gameInfo, setGameInfo ] = useState<DetailedGameInfoModel>()
    const [ chartData, setChartData ] = useState<any>([])

    const { theme, resolvedTheme } = useTheme();
    const [scoreBoardModel, setScoreBoardModel] = useState<ScoreboardModel>()

    const lastTimeLine = useRef<string>()
    const [ showGraphy, setShowGraphy ] = useState(false)

    const [ chartOption, setChartOpton ] = useState<echarts.EChartsOption>() 

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

        updateScoreBoard()
        const scoreBoardInter = setInterval(updateScoreBoard, 5000)
        
        return () => {
            clearInterval(scoreBoardInter)
        }
    }, [gameInfo])

    useEffect(() => {
        api.game.gameGame(gmid).then((res) => { setGameInfo(res.data) })
    }, [])

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
                                            <ScoreTable scoreBoardModel={scoreBoardModel} />
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