import { Avatar, AvatarImage, AvatarFallback } from "components/ui/avatar";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "components/ui/tabs"
import { Skeleton } from "components/ui/skeleton";
import dayjs from "dayjs";
import { AnimatePresence, motion } from "framer-motion";
import { Download, X, Calculator, AlertTriangle, Ban, Gift } from "lucide-react";
import { MacScrollbar } from "mac-scrollbar";
import { Tooltip } from "react-tooltip";
import { Button } from "components/ui/button";
import { useTheme } from "next-themes";
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";

import ReactECharts from 'echarts-for-react';
import { GameScoreboardData, TeamScore, UserFullGameInfo, UserSimpleGameChallenge } from "utils/A1API";

export default function TeamScoreDetailPage(
    { 
        showUserDetail,
        setShowUserDetail,
        scoreBoardModel,
        gameInfo,
        challenges
    } : {
        showUserDetail: TeamScore,
        setShowUserDetail: Dispatch<SetStateAction<TeamScore>>
        scoreBoardModel: GameScoreboardData | undefined,
        gameInfo: UserFullGameInfo | undefined,
        challenges: Record<string, UserSimpleGameChallenge[]>
    }
) {

    const { theme } = useTheme()
    const personalChartRef = useRef<ReactECharts>(null)
    const lastPersonalTimeLine = useRef<string>()

    const [personalChartOption, setPersonalChartOption] = useState<echarts.EChartsOption>()

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

    // 获取分数修正类型的图标和颜色
    const getAdjustmentTypeInfo = (type: string) => {
        switch (type) {
            case 'cheat':
                return { 
                    icon: <Ban className="w-5 h-5" />, 
                    color: 'text-red-500',
                    label: '作弊扣分'
                };
            case 'reward':
                return { 
                    icon: <Gift className="w-5 h-5" />, 
                    color: 'text-green-500',
                    label: '奖励加分'
                };
            case 'other':
                return { 
                    icon: <AlertTriangle className="w-5 h-5" />, 
                    color: 'text-yellow-500',
                    label: '其他调整'
                };
            default:
                return { 
                    icon: <Calculator className="w-5 h-5" />, 
                    color: 'text-gray-500',
                    label: '未知'
                };
        }
    }

    useEffect(() => {

        if (!gameInfo) return
        const current = dayjs()
        const end = dayjs(gameInfo.end_time).diff(current) > 0 ? current : dayjs(gameInfo.end_time)

        const curTimeLine = JSON.stringify(scoreBoardModel?.team_timelines?.find((e) => e.team_id == showUserDetail.team_id))

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
                    ...(scoreBoardModel?.team_timelines?.filter((e) => e.team_id == showUserDetail.team_id).map((team) => ({
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

    // 保存个人图表为图片
    const handleSavePersonalChart = useCallback(() => {
        const chartInstance = personalChartRef.current?.getEchartsInstance();
        if (!chartInstance) return;

        try {
            const url = chartInstance.getDataURL({
                type: 'png',
                pixelRatio: 2,
                backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff'
            });

            const link = document.createElement('a');
            link.href = url;
            link.download = `${showUserDetail.team_name || '队伍'}_个人积分图表_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('保存个人图表失败:', error);
        }
    }, [theme, showUserDetail.team_name]);

    return (
        <AnimatePresence>
            {showUserDetail.team_id && (
                <motion.div className='absolute top-0 left-0 w-full h-full z-[300] flex items-center justify-center overflow-hidden'
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
                        <div className='flex gap-2'>
                            <Button className='w-[50px] h-[50px] [&_svg]:size-6 rounded-lg' variant="outline"
                                onClick={handleSavePersonalChart}
                                title="保存图表"
                            >
                                <Download />
                            </Button>
                            <Button className='w-[50px] h-[50px] [&_svg]:size-8 rounded-lg' variant="default"
                                onClick={() => {
                                    setShowUserDetail({})
                                }}
                            >
                                <X />
                            </Button>
                        </div>
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
                                                ref={personalChartRef}
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
                                        <Tabs defaultValue="solved" className="w-full">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="solved" className="flex items-center gap-2">
                                                    <Calculator className="w-4 h-4" />
                                                    解题记录 ({showUserDetail.solved_challenges?.length || 0})
                                                </TabsTrigger>
                                                <TabsTrigger value="adjustments" className="flex items-center gap-2">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    分数修正 ({showUserDetail.score_adjustments?.length || 0})
                                                </TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="solved" className="mt-4">
                                                <div className={`flex h-9 flex-none items-center border-b-2`}>
                                                    <div className='flex-1 flex justify-center border-r-2 h-full items-center'>
                                                        <span className=''>题目名称</span>
                                                    </div>
                                                    <div className='w-[100px] flex-shrink-0 flex justify-center h-full items-center'>
                                                        <span className=''>分数</span>
                                                    </div>
                                                </div>
                                                {showUserDetail.solved_challenges?.map((e, index) => (
                                                    <div key={`solved-problem-${index}`} className={`flex h-9 flex-none items-center border-b-2 gap-2`}>
                                                        <div className='flex-1 overflow-hidden'>
                                                            <span className='text-nowrap overflow-hidden text-ellipsis'
                                                                data-tooltip-id="challengeTooltip2"
                                                                data-tooltip-html={`<div class='text-sm flex flex-col'><span>${dayjs(e.solve_time).format("MM-DD HH:mm:ss")}</span><span>${e.solver}</span><span>${getChallenge(e.challenge_id || 0)?.challenge_name}</span></div>`}
                                                            >{getChallenge(e.challenge_id || 0)?.challenge_name}</span>
                                                        </div>
                                                        <div className='w-[100px] flex-shrink-0 flex overflow-hidden'>
                                                            <span className='text-green-500'> + {getChallenge(e.challenge_id || 0)?.cur_score} pts</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!showUserDetail.solved_challenges || showUserDetail.solved_challenges.length === 0) && (
                                                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                                                        暂无解题记录
                                                    </div>
                                                )}
                                            </TabsContent>

                                            <TabsContent value="adjustments" className="mt-4">
                                                <div className={`flex h-9 flex-none items-center border-b-2`}>
                                                    <div className='flex-1 flex justify-center border-r-2 h-full items-center'>
                                                        <span className=''>修正原因</span>
                                                    </div>
                                                    <div className='w-[100px] flex-shrink-0 flex justify-center h-full items-center'>
                                                        <span className=''>分数变化</span>
                                                    </div>
                                                </div>
                                                {showUserDetail.score_adjustments?.map((adj, index) => {
                                                    const typeInfo = getAdjustmentTypeInfo(adj.adjustment_type);
                                                    return (
                                                        <div key={`score-adjustment-${index}`} className={`flex h-9 flex-none items-center border-b-2 gap-2 bg-muted/30`}>
                                                            <div className='flex-1 overflow-hidden flex items-center gap-2'>
                                                                <span className={typeInfo.color}>
                                                                    {typeInfo.icon}
                                                                </span>
                                                                <span className='text-nowrap overflow-hidden text-ellipsis text-sm'
                                                                    data-tooltip-id="challengeTooltip2"
                                                                    data-tooltip-html={`<div class='text-sm flex flex-col'><span>${dayjs(adj.created_at).format("MM-DD HH:mm:ss")}</span><span>${typeInfo.label}</span><span>${adj.reason}</span></div>`}
                                                                >{adj.reason}</span>
                                                            </div>
                                                            <div className='w-[100px] flex-shrink-0 flex overflow-hidden'>
                                                                <span className={adj.score_change >= 0 ? 'text-green-500' : 'text-red-500'}>
                                                                    {adj.score_change >= 0 ? '+' : ''}{adj.score_change} pts
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {(!showUserDetail.score_adjustments || showUserDetail.score_adjustments.length === 0) && (
                                                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                                                        暂无分数修正记录
                                                    </div>
                                                )}
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                </div>
                                <div className='h-full basis-1/2 overflow-hidden hidden lg:flex'>
                                    <Tabs defaultValue="solved" className="w-full h-full flex flex-col">
                                        <TabsList className="grid w-full grid-cols-2 mb-4">
                                            <TabsTrigger value="solved" className="flex items-center gap-2">
                                                <Calculator className="w-4 h-4" />
                                                解题记录 ({showUserDetail.solved_challenges?.length || 0})
                                            </TabsTrigger>
                                            <TabsTrigger value="adjustments" className="flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4" />
                                                分数修正 ({showUserDetail.score_adjustments?.length || 0})
                                            </TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="solved" className="flex-1 overflow-hidden">
                                            <MacScrollbar className='flex flex-col w-full overflow-hidden pr-5' skin={theme == "light" ? "light" : "dark"}>
                                                <div className={`flex h-9 flex-none items-center border-b-2 w-full`}>
                                                    <div className='w-[150px] flex-shrink-0 flex justify-center border-r-2 h-full items-center'>
                                                        <span>解题时间</span>
                                                    </div>
                                                    <div className='w-[100px] flex-shrink-0 flex justify-center border-r-2 h-full items-center'>
                                                        <span>解题者</span>
                                                    </div>
                                                    <div className='flex-1 flex justify-center border-r-2 h-full items-center'>
                                                        <span className=''>题目名称</span>
                                                    </div>
                                                    <div className='w-[120px] flex-none flex justify-center h-full items-center'>
                                                        <span className=''>分数</span>
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
                                                            <span className='text-green-500'> + {getChallenge(e.challenge_id || 0)?.cur_score} pts</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!showUserDetail.solved_challenges || showUserDetail.solved_challenges.length === 0) && (
                                                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                                                        暂无解题记录
                                                    </div>
                                                )}
                                            </MacScrollbar>
                                        </TabsContent>

                                        <TabsContent value="adjustments" className="flex-1 overflow-hidden">
                                            <MacScrollbar className='flex flex-col w-full overflow-hidden pr-5' skin={theme == "light" ? "light" : "dark"}>
                                                <div className={`flex h-9 flex-none items-center border-b-2 w-full`}>
                                                    <div className='w-[150px] flex-shrink-0 flex justify-center border-r-2 h-full items-center'>
                                                        <span>修正时间</span>
                                                    </div>
                                                    <div className='flex-1 flex justify-center border-r-2 h-full items-center'>
                                                        <span className=''>修正原因</span>
                                                    </div>
                                                    <div className='w-[120px] flex-none flex justify-center h-full items-center'>
                                                        <span className=''>分数变化</span>
                                                    </div>
                                                </div>
                                                {showUserDetail.score_adjustments?.map((adj, index) => {
                                                    const typeInfo = getAdjustmentTypeInfo(adj.adjustment_type);
                                                    return (
                                                        <div key={`score-adjustment-${index}`} className={`flex h-9 flex-none items-center border-b-2 bg-muted/30`}>
                                                            <div className='w-[150px] flex-shrink-0 flex justify-center'>
                                                                <span>{dayjs(adj.created_at).format("MM-DD HH:mm:ss")}</span>
                                                            </div>
                                                            <div className='flex-1 overflow-hidden pl-2 pr-2 flex items-center gap-2'>
                                                                <span className={typeInfo.color}>
                                                                    {typeInfo.icon}
                                                                </span>
                                                                <span className='text-nowrap overflow-hidden text-ellipsis text-sm'>{adj.reason}</span>
                                                            </div>
                                                            <div className='w-[120px] flex-none flex overflow-hidden justify-center'>
                                                                <span className={adj.score_change >= 0 ? 'text-green-500' : 'text-red-500'}>
                                                                    {adj.score_change >= 0 ? '+' : '-'} {Math.abs(adj.score_change)} pts
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {(!showUserDetail.score_adjustments || showUserDetail.score_adjustments.length === 0) && (
                                                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                                                        暂无分数修正记录
                                                    </div>
                                                )}
                                            </MacScrollbar>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </div>
                        </MacScrollbar>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}