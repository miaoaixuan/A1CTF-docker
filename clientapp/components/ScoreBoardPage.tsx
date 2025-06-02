import { ChartArea, CircleArrowLeft, LogOut, X, Download } from 'lucide-react'

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import ReactECharts from 'echarts-for-react';
import React, { Dispatch, SetStateAction, useEffect, useRef, useState, useCallback } from 'react';
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
import { useIsMobile } from 'hooks/use-mobile';
import { ScoreTableMobile } from './ScoreTableMobile';
import { toast } from 'sonner';

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
    const [isChartFullscreen, setIsChartFullscreen] = useState(false)
    const [isChartFloating, setIsChartFloating] = useState(false)
    const [isChartMinimized, setIsChartMinimized] = useState(false)
    const [isNormalChartMinimized, setIsNormalChartMinimized] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)

    const [chartOption, setChartOpton] = useState<echarts.EChartsOption>()
    const [showUserDetail, setShowUserDetail] = useState<TeamScore>({})
    const [personalChartOption, setPersonalChartOption] = useState<echarts.EChartsOption>()
    const lastPersonalTimeLine = useRef<string>()

    const isMobile = useIsMobile()

    // 加载动画
    const [loadingVisiblity, setLoadingVisibility] = useState(true)

    // const serialOptions = useRef<echarts.SeriesOption[]>([])

    const { serialOptions } = useGlobalVariableContext()

    // 使用useMemo稳定gameInfo引用，避免BetterChart不必要的重新渲染
    const stableGameInfo = React.useMemo(() => gameInfo, [
        gameInfo?.game_id,
        gameInfo?.name, 
        gameInfo?.start_time,
        gameInfo?.end_time
    ]);

    // 使用useCallback优化函数props，避免BetterChart不必要的重新渲染
    const handleToggleFullscreen = useCallback(() => {
        setIsChartFullscreen(!isChartFullscreen);
    }, [isChartFullscreen]);

    const handleToggleFloating = useCallback(() => {
        setIsChartFloating(!isChartFloating);
        // 切换到悬浮窗模式时重置正常模式最小化状态
        if (!isChartFloating) {
            setIsNormalChartMinimized(false);
        }
    }, [isChartFloating]);

    const handleFloatingToggleFloating = useCallback(() => {
        setIsChartFloating(!isChartFloating);
        // 退出悬浮窗模式时重置悬浮窗最小化状态
        if (isChartFloating) {
            setIsChartMinimized(false);
        }
    }, [isChartFloating]);

    const handleNormalMinimize = useCallback(() => {
        setIsNormalChartMinimized(true);
    }, []);

    const handleFloatingMinimize = useCallback(() => {
        setIsChartMinimized(true);
    }, []);

    const handleNormalRestore = useCallback(() => {
        setIsNormalChartMinimized(false);
    }, []);

    const handleFloatingRestore = useCallback(() => {
        setIsChartMinimized(false);
    }, []);

    // 下载积分榜CSV功能
    const downloadScoreboardCSV = useCallback(async () => {
        if (!gameInfo || isDownloading) return;
        
        setIsDownloading(true);
        try {
            // 获取完整的积分榜数据
            const response = await api.user.userGetGameScoreboard(gmid);
            const data = response.data.data as GameScoreboardData;
            
            if (!data?.teams || !data?.challenges) {
                throw new Error('积分榜数据不完整');
            }

            // 创建CSV内容
            const csvContent = generateScoreboardCSV(data);
            
            // 创建并下载文件
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            const filename = `${gameInfo.name}_积分榜_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`;
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            // 成功提示
            toast.success('积分榜下载成功！', {
                description: `文件已保存为: ${filename}`,
                duration: 4000,
            });
            
        } catch (error) {
            console.error('下载积分榜失败:', error);
            toast.error('下载积分榜失败', {
                description: error instanceof Error ? error.message : '请稍后重试',
                duration: 4000,
            });
        } finally {
            setIsDownloading(false);
        }
    }, [gameInfo, gmid, isDownloading]);

    // 生成CSV内容
    const generateScoreboardCSV = (data: GameScoreboardData): string => {
        const teams = data.teams || [];
        const challenges = data.challenges || [];
        
        // 按类别分组题目
        const challengesByCategory: Record<string, UserSimpleGameChallenge[]> = {};
        challenges.forEach(challenge => {
            const category = challenge.category?.toLowerCase() || 'misc';
            if (!challengesByCategory[category]) {
                challengesByCategory[category] = [];
            }
            challengesByCategory[category].push(challenge);
        });

        // 创建CSV头部
        const headers = ['排名', '队伍名称', '总分'];
        
        // 添加题目列（按类别分组）
        Object.keys(challengesByCategory).sort().forEach(category => {
            challengesByCategory[category].forEach(challenge => {
                headers.push(`${category.toUpperCase()}-${challenge.challenge_name}`);
            });
        });

        // 创建CSV行
        const rows: string[][] = [headers];
        
        teams.forEach(team => {
            const row = [
                team.rank?.toString() || '',
                `"${team.team_name || ''}"`, // 队伍名用双引号包围，防止逗号问题
                team.score?.toString() || '0'
            ];
            
            // 为每个题目添加分数
            Object.keys(challengesByCategory).sort().forEach(category => {
                challengesByCategory[category].forEach(challenge => {
                    const solvedChallenge = team.solved_challenges?.find(
                        solved => solved.challenge_id === challenge.challenge_id
                    );
                    row.push(solvedChallenge ? solvedChallenge.score?.toString() || '0' : '0');
                });
            });
            
            rows.push(row);
        });

        // 转换为CSV字符串
        return rows.map(row => row.join(',')).join('\n');
    };

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
                                                    color: theme === 'dark' ? '#94a3b8' : '#64748b',
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
                                color: theme === 'dark' ? '#e2e8f0' : '#1e293b',
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
                                                color: theme === 'dark' ? '#94a3b8' : '#64748b',
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
                    <div className='w-full flex flex-col relative gap-2 py-10'>
                        <div id='scoreHeader' className='w-full h-[60px] flex items-center px-10 '>
                            <span className='text-3xl font-bold [text-shadow:_hsl(var(--foreground))_1px_1px_20px] select-none'>ScoreBoard</span>
                            <div className='flex-1' />
                            {/* 下载积分榜按钮 */}
                            {gameInfo && (
                                <Button
                                    onClick={downloadScoreboardCSV}
                                    disabled={isDownloading}
                                    className={`mr-4 transition-all duration-300 hover:scale-110 ${
                                        isDownloading ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    variant="outline"
                                    size="sm"
                                >
                                    <Download size={18} className={`mr-2 ${isDownloading ? 'animate-spin' : ''}`} />
                                    {isDownloading ? '下载中...' : '下载积分榜'}
                                </Button>
                            )}
                            {/* <ThemeSwitcher lng='zh' /> */}
                            {/* <ChartArea size={32} className=' ml-4 hover:scale-110 transition-all duration-300 ease-linear' onClick={() => {
                                setShowGraphy(true)
                            }} /> */}
                            <CircleArrowLeft size={32} className=' ml-4 hover:scale-110 transition-all duration-300 ease-linear' onClick={() => {
                                navigator(gamePath)
                            }} />
                        </div>
                        {gameInfo ? (
                            <>
                                {/* 图表区域 - 根据模式显示 */}
                                {!isChartFloating && !isNormalChartMinimized && (
                                    <div className={`mx-auto transition-all duration-300 ${
                                        isChartFullscreen 
                                            ? 'absolute top-0 left-0 w-full h-screen z-50 px-4 py-4' 
                                            : 'container px-10 h-[50vh] min-h-[450px]'
                                    }`}>
                                        <BetterChart
                                            theme={theme == "dark" ? "dark" : "light"}
                                            gameInfo={stableGameInfo!}
                                            isFullscreen={isChartFullscreen}
                                            isFloating={isChartFloating}
                                            onToggleFullscreen={handleToggleFullscreen}
                                            onToggleFloating={handleToggleFloating}
                                            onMinimize={handleNormalMinimize}
                                        />
                                    </div>
                                )}
                                
                                {/* 悬浮窗图表 */}
                                {isChartFloating && !isChartMinimized && (
                                    <div className="fixed top-0 left-0 w-[500px] h-[350px] z-50 pointer-events-none">
                                        <div className="pointer-events-auto">
                                            <BetterChart
                                                theme={theme == "dark" ? "dark" : "light"}
                                                gameInfo={stableGameInfo!}
                                                isFullscreen={isChartFullscreen}
                                                isFloating={isChartFloating}
                                                onToggleFullscreen={handleToggleFullscreen}
                                                onToggleFloating={handleFloatingToggleFloating}
                                                onMinimize={handleFloatingMinimize}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* 正常模式最小化图表恢复按钮 */}
                                {!isChartFloating && isNormalChartMinimized && (
                                    <div className="fixed bottom-4 right-4 z-50">
                                        <Button
                                            onClick={handleNormalRestore}
                                            className={`p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 ${
                                                theme === 'dark'
                                                    ? 'bg-slate-800/90 border border-slate-600/50 text-slate-200 hover:bg-slate-700/90'
                                                    : 'bg-white/90 border border-gray-300/50 text-slate-700 hover:bg-gray-50/90'
                                            }`}
                                            title="显示图表"
                                        >
                                            <ChartArea className="w-5 h-5" />
                                            <span className="text-sm">显示图表</span>
                                        </Button>
                                    </div>
                                )}

                                {/* 最小化图表恢复按钮 */}
                                {isChartFloating && isChartMinimized && (
                                    <div className="fixed bottom-4 right-4 z-50">
                                        <Button
                                            onClick={handleFloatingRestore}
                                            className={`p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 ${
                                                theme === 'dark'
                                                    ? 'bg-slate-800/90 border border-slate-600/50 text-slate-200 hover:bg-slate-700/90'
                                                    : 'bg-white/90 border border-gray-300/50 text-slate-700 hover:bg-gray-50/90'
                                            }`}
                                            title="显示图表"
                                        >
                                            <ChartArea className="w-5 h-5" />
                                            <span className="text-sm">显示图表</span>
                                        </Button>
                                    </div>
                                )}

                                {/* 积分榜区域 - 悬浮窗模式下不受全屏影响 */}
                                {((!isChartFullscreen && !isNormalChartMinimized) || isChartFloating || isNormalChartMinimized) && (
                                    <div className='flex max-h-[80vh] lg:max-w-[90vw] w-full mx-auto overflow-y-auto overflow-x-hidden justify-center px-10'>
                                        <div className='flex overflow-hidden w-full'>
                                            <div className='flex flex-1 overflow-hidden'>
                                                {scoreBoardModel ? (!isMobile ? (
                                                    <>
                                                        <ScoreTable scoreBoardModel={scoreBoardModel} setShowUserDetail={setShowUserDetail} challenges={challenges} />
                                                    </>
                                                ) : (
                                                    <ScoreTableMobile scoreBoardModel={scoreBoardModel} setShowUserDetail={setShowUserDetail} challenges={challenges} />
                                                )) : (
                                                    <></>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (<></>)}
                    </div>
                </MacScrollbar>

            </div>
        </>
    )
}