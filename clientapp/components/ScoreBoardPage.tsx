import { ChartArea, CircleArrowLeft, LogOut, X } from 'lucide-react'

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import ReactECharts from 'echarts-for-react';
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
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
import BetterChart from './BetterChart';

import { useGlobalVariableContext } from 'contexts/GlobalVariableContext';
import { api } from 'utils/ApiHelper';
import { GameScoreboardData, TeamScore, TeamTimeline, UserFullGameInfo, UserSimpleGameChallenge } from 'utils/A1API';
import { LoadingPage } from './LoadingPage';
import { useLocation, useNavigate } from 'react-router';

export default function ScoreBoardPage(
    { gmid }
        :
        { gmid: number }
) {

    const [chartData, setChartData] = useState<any>([])

    const { theme, resolvedTheme } = useTheme();

    const [gameInfo, setGameInfo] = useState<UserFullGameInfo | undefined>(undefined)
    const [gameStatus, setGameStatus] = useState<string>("")
    const [challenges, setChallenges] = useState<Record<string, UserSimpleGameChallenge[]>>({})
    const [scoreBoardModel, setScoreBoardModel] = useState<GameScoreboardData>()

    const lastTimeLine = useRef<string>()
    const [showGraphy, setShowGraphy] = useState(false)

    const [chartOption, setChartOpton] = useState<echarts.EChartsOption>()
    const [showUserDetail, setShowUserDetail] = useState<TeamScore>({})
    const [personalChartOption, setPersonalChartOption] = useState<echarts.EChartsOption>()
    const lastPersonalTimeLine = useRef<string>()

    // 加载动画
    const [loadingVisiblity, setLoadingVisibility] = useState(true)

    // const serialOptions = useRef<echarts.SeriesOption[]>([])

    const { serialOptions } = useGlobalVariableContext()

    // 获取 gameInfo
    useEffect(() => {
        api.user.userGetGameInfoWithTeamInfo(gmid).then((res) => {
            setGameInfo(res.data.data)
        })
    }, [gmid])

    useEffect(() => {

        if (!gameInfo?.name) return
        if (dayjs() < dayjs(gameInfo.start_time)) return

        const updateScoreBoard = () => {
            api.user.userGetGameScoreboard(gmid).then((res) => {

                setScoreBoardModel(res.data.data)

                const groupedChallenges: Record<string, UserSimpleGameChallenge[]> = {};
                res.data.data?.challenges?.forEach((challenge: UserSimpleGameChallenge) => {
                    const category = challenge.category?.toLowerCase() || "misc";
                    if (!groupedChallenges[category]) {
                        groupedChallenges[category] = [];
                    }
                    groupedChallenges[category].push(challenge);
                });
                setChallenges(groupedChallenges)

                const current = dayjs()
                const end = dayjs(gameInfo.end_time).diff(current) > 0 ? current : dayjs(gameInfo.end_time)

                const curTimeLine = JSON.stringify(res.data.data?.time_lines)

                if (curTimeLine != lastTimeLine.current || true) {
                    lastTimeLine.current = curTimeLine

                    serialOptions.current = [
                        {
                            type: 'line',
                            step: 'end',
                            data: [],
                            markLine:
                                dayjs(gameInfo.end_time).diff(dayjs(), 's') < 0
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
                        ...(res.data.data?.time_lines?.map((team) => ({
                            name: team.team_name,
                            type: 'line',
                            showSymbol: false,
                            step: 'end',
                            data: [
                                [+new Date(dayjs(gameInfo.start_time).toDate()), 0],
                                ...(team.scores?.map((item) => [item.record_time || 0, item.score || 0]) || []),
                                [+end.toDate(), (team.scores && team.scores[team.scores.length - 1]?.score) || 0]
                            ],
                            lineStyle: {
                                width: 4
                            },
                            endLabel: {
                                show: true,
                                formatter: `${team.team_name} - ${team.scores![team.scores!.length - 1]?.score ?? 0} pts`, // {a} 表示系列名称
                                color: '#333',
                                fontWeight: 'bold',
                                fontSize: 14,
                                distance: 10 // 调整标签与端点的距离
                            },
                            smooth: true,
                        }) as echarts.SeriesOption) || [])
                    ] as echarts.SeriesOption[]

                    // setChartOpton({
                    //     backgroundColor: 'transparent',
                    //     tooltip: {
                    //         trigger: 'axis',
                    //         borderWidth: 0,
                    //         textStyle: {
                    //             fontSize: 12,
                    //             color: theme == "dark" ? "#121212" : "#FFFFFF",
                    //         },
                    //         backgroundColor: theme == "dark" ? "#FFFFFF" : "#121212"
                    //     },
                    //     title: {
                    //         left: 'center',
                    //         text: `${gameInfo?.title} - 记分榜`,
                    //         textStyle: {
                    //             color: theme == "dark" ? "#FFFFFF" : "#121212",
                    //         }
                    //     },
                    //     toolbox: {
                    //         show: true,
                    //         feature: {
                    //             dataZoom: {
                    //                 yAxisIndex: 'none'
                    //             },
                    //             restore: {},
                    //             saveAsImage: {}
                    //         }
                    //     },
                    //     xAxis: {
                    //         type: 'time',
                    //         min: dayjs(gameInfo?.start).toDate(),
                    //         max: dayjs(gameInfo?.end).toDate(),
                    //         splitLine: {
                    //             show: false,
                    //         },
                    //     },
                    //     yAxis: {
                    //         type: 'value',
                    //         boundaryGap: [0, '100%'],
                    //         max: (value: any) => (Math.floor(value.max / 1000) + 1) * 1000,
                    //         splitLine: {
                    //             show: true,
                    //         },
                    //     },
                    //     dataZoom: [
                    //         {
                    //             type: 'inside',
                    //             start: 0,
                    //             end: 100,
                    //             xAxisIndex: 0,
                    //             filterMode: 'none'
                    //         },
                    //         {
                    //             start: 0,
                    //             end: 100,
                    //             xAxisIndex: 0,
                    //             showDetail: false,
                    //         }
                    //     ],
                    //     series: 
                    // })
                }

                setLoadingVisibility(false)
            })
        }

        updateScoreBoard()
        const scoreBoardInter = setInterval(() => {
            // if (visibleRef.current) updateScoreBoard()
            updateScoreBoard()
        }, randomInt(4000, 5000))

        return () => {
            clearInterval(scoreBoardInter)
        }
    }, [gameInfo])

    useEffect(() => {

        if (!gameInfo) return
        const current = dayjs()
        const end = dayjs(gameInfo.end_time).diff(current) > 0 ? current : dayjs(gameInfo.end_time)

        const curTimeLine = JSON.stringify(scoreBoardModel?.time_lines?.find((e) => e.team_id == showUserDetail.team_id))

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
                    text: `${showUserDetail.team_name} - 记分榜`,
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
                    min: dayjs(gameInfo?.start_time).toDate(),
                    max: dayjs(gameInfo?.end_time).toDate(),
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
                            dayjs(gameInfo.end_time).diff(dayjs(), 's') < 0
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
                    ...(scoreBoardModel?.time_lines?.filter((e) => e.team_id == showUserDetail.team_id).map((team) => ({
                        name: team.team_name,
                        type: 'line',
                        showSymbol: false,
                        step: 'end',
                        data: [
                            [+new Date(dayjs(gameInfo.start_time).toDate()), 0],
                            ...(team.scores?.map((item) => [item.record_time || 0, item.score || 0]) || []),
                            [+end.toDate(), (team.scores && team.scores[team.scores.length - 1]?.score) || 0]
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

    const getChallenge = (id: number): UserSimpleGameChallenge | undefined => {
        let target: UserSimpleGameChallenge | undefined
        if (challenges) {
            Object.values(challenges).forEach((es) => {
                const tmp = es.find((e) => e.challenge_id == id)
                if (tmp) target = tmp;
            })
        }
        return target
    }

    const navigator = useNavigate()

    const gamePath = useLocation().pathname.split("/").slice(0, -1).join("/")

    useEffect(() => {
        if (gameInfo) {
            console.log(scoreBoardModel)
        }
    }, [scoreBoardModel])

    return (
        <>
            <LoadingPage visible={loadingVisiblity} />
            <AnimatePresence>
                {showUserDetail.team_id && (
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
                            <Tooltip id="challengeTooltip2" opacity={0.9} className='z-[200]' />
                            <MacScrollbar className='w-full h-full overflow-y-auto pr-3 lg:pr-0 lg:overflow-hidden' skin={theme == "light" ? "light" : "dark"} suppressScrollX>
                                <div className='flex flex-row h-full w-full gap-4'>
                                    <div className='flex flex-col w-full h-full gap-1 lg:basis-1/2 lg:overflow-hidden'>
                                        <div className='flex items-center gap-4 mb-3'>
                                            <Avatar className="select-none w-12 h-12">
                                                {showUserDetail.team_avatar ? (
                                                    <>
                                                        <AvatarImage src={showUserDetail.team_avatar || "#"} alt="@shadcn" />
                                                        <AvatarFallback><Skeleton className="h-12 w-12 rounded-full" /></AvatarFallback>
                                                    </>
                                                ) : (
                                                    <div className='w-full h-full bg-foreground/80 flex items-center justify-center'>
                                                        <span className='text-background text-lg'> {showUserDetail.team_name?.substring(0, 2)} </span>
                                                    </div>
                                                )}
                                            </Avatar>
                                            <span className='text-3xl font-bold'>{showUserDetail.team_name}</span>
                                        </div>
                                        <span className='text-2xl'>Rank: {showUserDetail.rank} </span>
                                        <span className='text-2xl'>Solved {showUserDetail?.solved_challenges?.length ?? 0} problems</span>
                                        <span className='text-2xl'>Score: {showUserDetail.score} pts</span>
                                        <span className='text-2xl'>Slogan: {showUserDetail.team_slogan || "He didn't say anything."} </span>
                                        <div className='lg:pr-14 pt-5 h-[400px] flex-shrink-0 lg:h-auto lg:flex-1'>
                                            {personalChartOption && (
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
                                            )}
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
                                            {showUserDetail.solved_challenges?.map((e, index) => (
                                                <div key={`solved-problem-${index}`} className={`flex h-9 flex-none items-center border-b-2 gap-2`}>
                                                    <div className='w-[150px] flex-shrink-0 justify-center hidden lg:flex'>
                                                        <span>{dayjs(e.solve_time).format("MM-DD HH:mm:ss")}</span>
                                                    </div>
                                                    <div className='flex-1 overflow-hidden'>
                                                        <span className='text-nowrap overflow-hidden text-ellipsis'
                                                            data-tooltip-id="challengeTooltip2"
                                                            data-tooltip-html={`<div class='text-sm flex flex-col'><span>${dayjs(e.solve_time).format("MM-DD HH:mm:ss")}</span><span>${e.solver}</span><span>${getChallenge(e.challenge_id || 0)?.challenge_name}</span></div>`}
                                                        >{getChallenge(e.challenge_id || 0)?.challenge_name}</span>
                                                    </div>
                                                    <div className='w-[100px] flex-shrink-0 flex overflow-hidden'>
                                                        <span className='text-green-500'> + {e.score} pts</span>
                                                    </div>
                                                </div>
                                            ))}
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
                                            {showUserDetail.solved_challenges?.map((e, index) => (
                                                <div key={`solved-problem-${index}`} className={`flex h-9 flex-none items-center border-b-2`}>
                                                    <div className='w-[150px] flex-shrink-0 flex justify-center'>
                                                        <span>{dayjs(e.solve_time).format("MM-DD HH:mm:ss")}</span>
                                                    </div>
                                                    <div className='w-[100px] flex-shrink-0 flex justify-center overflow-hidden'>
                                                        <span className='text-nowrap overflow-hidden text-ellipsis'>{e.solver}</span>
                                                    </div>
                                                    <div className='flex-1 overflow-hidden pl-2 pr-2'>
                                                        <span className='text-nowrap overflow-hidden text-ellipsis'>{getChallenge(e.challenge_id || 0)?.challenge_name}</span>
                                                    </div>
                                                    <div className='w-[120px] flex-none flex overflow-hidden justify-center'>
                                                        <span className='text-green-500'> + {e.score} pts</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </MacScrollbar>
                                    </div>
                                </div>
                            </MacScrollbar>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className='absolute top-0 left-0 h-screen w-screen bg-transparent backdrop-blur-md transition-colors duration-300'>
                <Tooltip id="challengeTooltip" opacity={0.9} className='z-[200]' />
                <MacScrollbar
                    className="w-full h-full overflow-y-auto"
                    skin={theme == "light" ? "light" : "dark"}
                    suppressScrollX
                >
                    <div className='w-full h-full flex flex-col relative p-10  gap-2'>
                        <div id='scoreHeader' className='w-full h-[60px] flex items-center'>
                            <span className='text-3xl font-bold [text-shadow:_hsl(var(--foreground))_1px_1px_20px] select-none'>ScoreBoard</span>
                            <div className='flex-1' />
                            {/* <ThemeSwitcher lng='zh' /> */}
                            <ChartArea size={32} className=' ml-4 hover:scale-110 transition-all duration-300 ease-linear' onClick={() => {
                                setShowGraphy(true)
                            }} />
                            <CircleArrowLeft size={32} className=' ml-4 hover:scale-110 transition-all duration-300 ease-linear' onClick={() => {
                                navigator(gamePath)
                            }} />
                        </div>
                        {gameInfo ? (
                            <>
                                <div className='w-full h-[500px]'>
                                    <BetterChart
                                        theme={"light"}
                                        gameInfo={gameInfo!}
                                    />
                                </div>
                                <div className='flex flex-1 overflow-y-auto overflow-x-hidden h-full justify-center'>
                                    <div className='flex overflow-hidden'>
                                        <div className='flex flex-1 overflow-hidden'>
                                            {scoreBoardModel && (
                                                <ScoreTable scoreBoardModel={scoreBoardModel} setShowUserDetail={setShowUserDetail} challenges={challenges} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (<></>)}
                    </div>
                </MacScrollbar>

            </div>
        </>
    )
}