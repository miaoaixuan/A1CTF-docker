import { ChartArea, CircleArrowLeft, LogOut, X, Download, Calculator, Gift, Ban, AlertTriangle } from 'lucide-react'

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import ReactECharts from 'echarts-for-react';
import React, { Dispatch, SetStateAction, useEffect, useRef, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import ThemeSwitcher from 'components/ToggleTheme';
import { useTheme } from 'next-themes';
import { ScoreTable } from 'components/ScoreTable';
import * as XLSX from 'xlsx-js-style';

import { Tooltip } from 'react-tooltip';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from 'components/ui/button';

import { randomInt } from "mathjs";
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar';
import { Skeleton } from 'components/ui/skeleton';
import { MacScrollbar } from 'mac-scrollbar';
import BetterChart from 'components/BetterChart';

import { useGlobalVariableContext } from 'contexts/GlobalVariableContext';
import { api } from 'utils/ApiHelper';
import { GameScoreboardData, TeamScore, TeamTimeline, UserFullGameInfo, UserSimpleGameChallenge, GameGroupSimple, PaginationInfo } from 'utils/A1API';
import { LoadingPage } from 'components/LoadingPage';
import { useLocation, useNavigate } from 'react-router';
import { useIsMobile } from 'hooks/use-mobile';
import { ScoreTableMobile } from 'components/ScoreTableMobile';
import { toast } from 'sonner';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "components/ui/select"

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "components/ui/tabs"

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

    // 分组和分页相关状态
    const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(undefined)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [groups, setGroups] = useState<GameGroupSimple[]>([])
    const [pagination, setPagination] = useState<PaginationInfo | undefined>(undefined)

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
    const personalChartRef = useRef<ReactECharts>(null)

    const isMobile = useIsMobile()

    // 加载动画
    const [loadingVisiblity, setLoadingVisibility] = useState(true)
    // 换页加载状态
    const [pageLoading, setPageLoading] = useState(false)

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

    // 下载积分榜XLSX功能
    const downloadScoreboardXLSX = useCallback(async () => {
        if (!gameInfo || isDownloading) return;
        
        setIsDownloading(true);
        try {
            // 获取完整的积分榜数据（不分页，获取所有数据用于导出）
            const params: any = {};
            if (selectedGroupId) {
                params.group_id = selectedGroupId;
            }
            params.page = 1;
            params.size = (pagination?.total_count ?? 0) + 100; // 获取大量数据用于导出
            
            const response = await api.user.userGetGameScoreboard(gmid, params);
            const data = response.data.data as GameScoreboardData;
            
            if (!data?.teams || !data?.challenges) {
                throw new Error('积分榜数据不完整');
            }

            // 创建XLSX工作簿
            const workbook = generateScoreboardXLSX(data);
            
            // 生成文件并下载
            const groupSuffix = selectedGroupId && data.current_group ? `_${data.current_group.group_name}组` : '';
            const filename = `${gameInfo.name}${groupSuffix}_积分榜_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;
            
            XLSX.writeFile(workbook, filename);
            
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
    }, [gameInfo, gmid, isDownloading, selectedGroupId, pagination]);

    // 分组选择处理
    const handleGroupChange = useCallback((value: string) => {
        const groupId = value === "all" ? undefined : parseInt(value);
        setSelectedGroupId(groupId);
        setCurrentPage(1); // 重置到第一页
    }, []);

    // 分页处理
    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    // 页面大小变化处理
    const handlePageSizeChange = useCallback((size: string) => {
        const newSize = parseInt(size);
        setPageSize(newSize);
        setCurrentPage(1); // 重置到第一页
        
        if (pagination && pagination.current_page > 1) {
            toast.info('页面大小已更改', {
                description: '已重置到第一页',
                duration: 2000,
            });
        }
    }, [pagination]);

    // 生成XLSX工作簿
    const generateScoreboardXLSX = (data: GameScoreboardData): XLSX.WorkBook => {
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

        // 创建表头
        const headers = ['排名', '队伍名称', '总分'];
        
        // 添加题目列（按类别分组）
        Object.keys(challengesByCategory).sort().forEach(category => {
            challengesByCategory[category].forEach(challenge => {
                headers.push(`${category.toUpperCase()}-${challenge.challenge_name}`);
            });
        });

        // 创建数据行（使用正确的单元格对象格式）
        const sheetData: any[][] = [];
        
        // 添加表头行（带样式）
        const headerRow = headers.map(header => ({
            v: header,
            t: 's',
            s: {
                font: { 
                    bold: true, 
                    color: { rgb: "FFFFFF" },
                    sz: 12
                },
                fill: { 
                    patternType: "solid",
                    fgColor: { rgb: "4F46E5" }
                },
                alignment: { 
                    horizontal: "center", 
                    vertical: "center" 
                },
                border: {
                    top: { style: "thin", color: { rgb: "000000" } },
                    bottom: { style: "thin", color: { rgb: "000000" } },
                    left: { style: "thin", color: { rgb: "000000" } },
                    right: { style: "thin", color: { rgb: "000000" } }
                }
            }
        }));
        sheetData.push(headerRow);
        
        // 添加数据行
        teams.forEach((team, teamIndex) => {
            const row: any[] = [];
            
            // 排名列
            const rank = team.rank || 0;
            let rankStyle: any = {
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "E5E7EB" } },
                    bottom: { style: "thin", color: { rgb: "E5E7EB" } },
                    left: { style: "thin", color: { rgb: "E5E7EB" } },
                    right: { style: "thin", color: { rgb: "E5E7EB" } }
                }
            };
            
            // 前三名特殊样式
            if (rank === 1) {
                rankStyle.fill = { patternType: "solid", fgColor: { rgb: "FEF3C7" } };
                rankStyle.font = { bold: true, color: { rgb: "D97706" } };
            } else if (rank === 2) {
                rankStyle.fill = { patternType: "solid", fgColor: { rgb: "F3F4F6" } };
                rankStyle.font = { bold: true, color: { rgb: "6B7280" } };
            } else if (rank === 3) {
                rankStyle.fill = { patternType: "solid", fgColor: { rgb: "FED7AA" } };
                rankStyle.font = { bold: true, color: { rgb: "EA580C" } };
            } else if (teamIndex % 2 === 0) {
                rankStyle.fill = { patternType: "solid", fgColor: { rgb: "F9FAFB" } };
            }
            
            row.push({ v: rank, t: 'n', s: rankStyle });
            
            // 队伍名称列
            let nameStyle: any = {
                alignment: { horizontal: "left", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "E5E7EB" } },
                    bottom: { style: "thin", color: { rgb: "E5E7EB" } },
                    left: { style: "thin", color: { rgb: "E5E7EB" } },
                    right: { style: "thin", color: { rgb: "E5E7EB" } }
                }
            };
            if (teamIndex % 2 === 0 && rank > 3) {
                nameStyle.fill = { patternType: "solid", fgColor: { rgb: "F9FAFB" } };
            }
            row.push({ v: team.team_name || '', t: 's', s: nameStyle });
            
            // 总分列
            let scoreStyle: any = {
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "E5E7EB" } },
                    bottom: { style: "thin", color: { rgb: "E5E7EB" } },
                    left: { style: "thin", color: { rgb: "E5E7EB" } },
                    right: { style: "thin", color: { rgb: "E5E7EB" } }
                }
            };
            if (teamIndex % 2 === 0 && rank > 3) {
                scoreStyle.fill = { patternType: "solid", fgColor: { rgb: "F9FAFB" } };
            }
            row.push({ v: team.score || 0, t: 'n', s: scoreStyle });
            
            // 题目分数列
            Object.keys(challengesByCategory).sort().forEach(category => {
                challengesByCategory[category].forEach(challenge => {
                    const solvedChallenge = team.solved_challenges?.find(
                        solved => solved.challenge_id === challenge.challenge_id
                    );
                    const score = solvedChallenge ? solvedChallenge.score || 0 : 0;
                    
                    let challengeStyle: any = {
                        alignment: { horizontal: "center", vertical: "center" },
                        border: {
                            top: { style: "thin", color: { rgb: "E5E7EB" } },
                            bottom: { style: "thin", color: { rgb: "E5E7EB" } },
                            left: { style: "thin", color: { rgb: "E5E7EB" } },
                            right: { style: "thin", color: { rgb: "E5E7EB" } }
                        }
                    };
                    
                    // 已解题目绿色背景
                    if (score > 0) {
                        challengeStyle.fill = { patternType: "solid", fgColor: { rgb: "DCFCE7" } };
                        challengeStyle.font = { color: { rgb: "166534" }, bold: true };
                    } else if (teamIndex % 2 === 0 && rank > 3) {
                        challengeStyle.fill = { patternType: "solid", fgColor: { rgb: "F9FAFB" } };
                    }
                    
                    row.push({ v: score, t: 'n', s: challengeStyle });
                });
            });
            
            sheetData.push(row);
        });

        // 创建工作表
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        
        // 设置列宽
        const colWidths = [
            { wch: 8 },  // 排名
            { wch: 20 }, // 队伍名称
            { wch: 10 }, // 总分
        ];
        
        // 为每个题目列设置宽度
        Object.keys(challengesByCategory).sort().forEach(category => {
            challengesByCategory[category].forEach(() => {
                colWidths.push({ wch: 15 }); // 题目列宽度
            });
        });
        
        worksheet['!cols'] = colWidths;
        
        // 创建工作簿
        const workbook = XLSX.utils.book_new();
        const sheetName = `积分榜_${dayjs().format('MM-DD_HH-mm')}`;
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        
        // 设置工作簿属性
        workbook.Props = {
            Title: `${gameInfo?.name || 'CTF'} 积分榜`,
            Subject: "CTF竞赛积分榜",
            Author: "A1CTF System",
            CreatedDate: new Date()
        };
        
        return workbook;
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

        const updateScoreBoard = (silent: boolean = false) => {
            // 设置加载状态
            if (!silent) setPageLoading(true);
            
            // 构建查询参数
            const params: any = {
                page: currentPage,
                size: pageSize
            };
            
            if (selectedGroupId) {
                params.group_id = selectedGroupId;
            }

            api.user.userGetGameScoreboard(gmid, params).then((res) => {

                setScoreBoardModel(res.data.data)

                // 设置分组信息
                if (res.data.data?.groups) {
                    setGroups(res.data.data.groups);
                }

                // 设置分页信息
                if (res.data.data?.pagination) {
                    setPagination(res.data.data.pagination);
                }

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

                const curTimeLine = JSON.stringify(res.data.data?.top10_timelines)

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
                        ...(res.data.data?.top10_timelines?.map((team) => ({
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
                }

                setLoadingVisibility(false)
                // 结束加载状态
                setTimeout(() => setPageLoading(false), 200)
            }).catch(error => {
                console.error('加载积分榜失败:', error);
                // 出错时也要结束加载状态
                setPageLoading(false);
                toast.error('加载积分榜失败', {
                    description: '请稍后重试',
                    duration: 3000,
                });
            })
        }

        updateScoreBoard(false)
        const scoreBoardInter = setInterval(() => {
            // if (visibleRef.current) updateScoreBoard()
            updateScoreBoard(true)
        }, randomInt(4000, 5000))

        return () => {
            clearInterval(scoreBoardInter)
        }
    }, [gameInfo, currentPage, selectedGroupId, pageSize])

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

    const navigator = useNavigate()

    const gamePath = useLocation().pathname.split("/").slice(0, -1).join("/")

    return (
        <>
            {/* <LoadingPage visible={loadingVisiblity} /> */}
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
                                                                <span className='text-green-500'> + {e.score} pts</span>
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
                                                                <span className='text-green-500'> + {e.score} pts</span>
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
            <div className='absolute top-0 left-0 h-full w-full transition-colors duration-300'>
                <Tooltip id="challengeTooltip" opacity={0.9} className='z-[200]' />
                <MacScrollbar
                    className="w-full h-full overflow-y-auto"
                    skin={theme == "light" ? "light" : "dark"}
                    suppressScrollX
                >
                    <div className='w-full flex flex-col relative gap-2 py-10'>
                        <div id='scoreHeader' className='w-full h-[60px] flex items-center px-10 mb-6 '>
                            <span className='text-3xl font-bold [text-shadow:_hsl(var(--foreground))_1px_1px_20px] select-none'>ScoreBoard</span>
                            <div className='flex-1' />
                            {/* 下载积分榜按钮 */}
                            {gameInfo && (
                                <Button
                                    onClick={downloadScoreboardXLSX}
                                    disabled={isDownloading}
                                    className={`mr-4 transition-all duration-300 hover:scale-110 ${
                                        isDownloading ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    variant="outline"
                                    size="sm"
                                >
                                    <Download size={18} className={`mr-2 ${isDownloading ? 'animate-spin' : ''}`} />
                                    {isDownloading ? '下载中...' : '下载Excel表格'}
                                </Button>
                            )}
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
                                    <>
                                        {/* 分组选择器和分页信息 */}
                                        <div className={`w-full lg:max-w-[90vw] mx-auto px-10 mb-4 select-none ${!isNormalChartMinimized ? "mt-6" : ""}`}>
                                            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-wrap'>
                                                <div className='flex flex-wrap items-center gap-4'>
                                                    {/* 分组选择器 */}
                                                    {groups.length > 0 && (
                                                        <div className='flex items-center gap-2'>
                                                            <span className='text-sm font-medium'>分组筛选:</span>
                                                            <Select value={selectedGroupId?.toString() || "all"} onValueChange={handleGroupChange} disabled={pageLoading}>
                                                                <SelectTrigger className="w-[180px]">
                                                                    <SelectValue placeholder="选择分组" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="all">全部队伍</SelectItem>
                                                                    {groups.map((group) => (
                                                                        <SelectItem key={group.group_id} value={group.group_id.toString()}>
                                                                            {group.group_name} ({group.team_count}队)
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    )}

                                                    {/* 页面大小选择器 */}
                                                    {pagination && (
                                                        <div className='flex items-center gap-2'>
                                                            <span className='text-sm font-medium hidden sm:inline'>每页显示:</span>
                                                            <span className='text-sm font-medium sm:hidden'>每页:</span>
                                                            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange} disabled={pageLoading}>
                                                                <SelectTrigger className="w-[70px] h-8 text-xs sm:text-sm">
                                                                    <SelectValue placeholder="页面大小" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="10">10</SelectItem>
                                                                    <SelectItem value="15">15</SelectItem>
                                                                    <SelectItem value="20">20</SelectItem>
                                                                    <SelectItem value="50">50</SelectItem>
                                                                    <SelectItem value="100">100</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 分页信息 */}
                                                {pagination && (
                                                    <div className='flex items-center'>
                                                        <span className='text-xs sm:text-sm text-muted-foreground'>
                                                            共 {pagination.total_count} 支队伍，第 {pagination.current_page} / {pagination.total_pages} 页
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className='flex lg:max-w-[90vw] w-full mx-auto overflow-y-auto overflow-x-hidden justify-center px-10'>
                                            <div className='flex overflow-hidden w-full'>
                                                <div className='flex flex-1 overflow-hidden'>
                                                    {scoreBoardModel ? (!isMobile ? (
                                                        <>
                                                            <ScoreTable 
                                                                scoreBoardModel={scoreBoardModel}
                                                                setShowUserDetail={setShowUserDetail}
                                                                challenges={challenges}
                                                                pageSize={pageSize}
                                                                pagination={pagination}
                                                                curPage={currentPage}
                                                                setCurPage={setCurrentPage}
                                                                isLoading={pageLoading}
                                                            />
                                                        </>
                                                    ) : (
                                                        <ScoreTableMobile scoreBoardModel={scoreBoardModel} setShowUserDetail={setShowUserDetail} challenges={challenges} />
                                                    )) : (
                                                        <></>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (<></>)}
                    </div>
                </MacScrollbar>

            </div>
        </>
    )
}