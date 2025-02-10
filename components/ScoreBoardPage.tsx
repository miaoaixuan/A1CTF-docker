"use client";

import api, { ChallengeDetailModel, GameDetailModel, DetailedGameInfoModel, GameNotice, NoticeType } from '@/utils/GZApi'
import { LogOut } from 'lucide-react'

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import ReactECharts from 'echarts-for-react';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import ThemeSwitcher from './ToggleTheme';
import { useTheme } from 'next-themes';

export default function ScoreBoardPage({ gmid } : { gmid: number }) {


    const [ gameInfo, setGameInfo ] = useState<DetailedGameInfoModel>()
    const [ chartData, setChartData ] = useState<any>([])

    const { theme, resolvedTheme } = useTheme();

    useEffect(() => {

        if (!gameInfo?.title) return

        api.game.gameScoreboard(gmid).then((res) => {

            const current = dayjs()
            const end = dayjs(gameInfo.end).diff(current) > 0 ? current : dayjs(gameInfo.end)

            setChartData([
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
            ] as echarts.SeriesOption[])
        })
    }, [gameInfo])

    const option: echarts.EChartsOption = {
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
        series: chartData
    };

    useEffect(() => {
        api.game.gameGame(gmid).then((res) => { setGameInfo(res.data) })
    }, [])

    return (
        <div className='absolute top-0 left-0 h-screen w-screen bg-background opacity-100 z-40 transition-colors duration-300'>
            <div className='w-full h-full flex flex-col relative p-10'>
                <div id='scoreHeader' className='w-full h-[60px] flex items-center'>
                    <span className='text-3xl font-bold [text-shadow:_hsl(var(--foreground))_1px_1px_20px] select-none'>ScoreBoard</span>
                    <div className='flex-1' />
                    <ThemeSwitcher lng='zh' />
                    <LogOut size={32} className=' ml-4 hover:scale-110 transition-all duration-300 ease-linear' />
                </div>
                <div className='flex justify-center overflow-y-auto overflow-x-hidden h-full'>
                    <div className='w-full justify-center pt-4'>
                        {
                            option && (
                                <ReactECharts
                                    option={option}
                                    notMerge={false}
                                    lazyUpdate={true}
                                    style={{
                                        height: "500px"
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
                    </div>
                </div>
            </div>
        </div>
    )
}