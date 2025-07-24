import { Button } from "components/ui/button"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "components/ui/table"
import { Badge } from "components/ui/badge"
import { MacScrollbar } from "mac-scrollbar"
import { Captions, TriangleAlert, RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock, Flag, Trophy, User, Users, Plus, X, Filter, Trash, Copy, Shield, MapPin } from "lucide-react"
import { useParams } from "react-router"
import { useEffect, useState } from "react"
import dayjs from "dayjs"
import { api } from "utils/ApiHelper"
import { AdminSubmitItem, AdminCheatItem } from "utils/A1API"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Input } from "components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "components/ui/dialog"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "components/ui/select"
import copy from "copy-to-clipboard"

export function GameEventModule() {

    const { game_id } = useParams<{ game_id: string }>()
    const gameId = parseInt(game_id || '0')

    const [curChoicedType, setCurChoicedType] = useState<string>("submissions")

    // Helper functions for cheats
    const cheatTypeColor = (type: string) => {
        switch (type) {
            case "SubmitSomeonesFlag":
                return "text-red-600 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950"
            case "SubmitWithoutDownloadAttachments":
                return "text-orange-600 border-orange-200 bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:bg-orange-950"
            case "SubmitWithoutStartContainer":
                return "text-yellow-600 border-yellow-200 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-800 dark:bg-yellow-950"
            default:
                return "text-gray-600 border-gray-200 bg-gray-50 dark:text-gray-400 dark:border-gray-800 dark:bg-gray-950"
        }
    }

    const cheatTypeIcon = (type: string) => {
        switch (type) {
            case "SubmitSomeonesFlag":
                return <Shield className="w-3 h-3" />
            case "SubmitWithoutDownloadAttachments":
                return <TriangleAlert className="w-3 h-3" />
            case "SubmitWithoutStartContainer":
                return <AlertCircle className="w-3 h-3" />
            default:
                return <Shield className="w-3 h-3" />
        }
    }

    const cheatTypeText = (type: string) => {
        switch (type) {
            case "SubmitSomeonesFlag":
                return "提交他人Flag"
            case "SubmitWithoutDownloadAttachments":
                return "未下载附件"
            case "SubmitWithoutStartContainer":
                return "未启动容器"
            default:
                return type
        }
    }

    const [submissions, setSubmissions] = useState<AdminSubmitItem[]>([])
    const [cheats, setCheats] = useState<AdminCheatItem[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [currentPage, setCurrentPage] = useState<number>(1)
    const pageSize = 15
    const [total, setTotal] = useState<number>(0)

    // cheats state
    const [cheatsLoading, setCheatsLoading] = useState<boolean>(false)
    const [cheatsCurrentPage, setCheatsCurrentPage] = useState<number>(1)
    const [cheatsTotal, setCheatsTotal] = useState<number>(0)

    const cheatsTotalPages = Math.ceil(cheatsTotal / pageSize)

    // filter state
    const [challengeNames, setChallengeNames] = useState<string[]>([])
    const [teamNames, setTeamNames] = useState<string[]>([])
    const [challengeIds, setChallengeIds] = useState<number[]>([])
    const [teamIds, setTeamIds] = useState<number[]>([])
    type JudgeStatus = "JudgeAC" | "JudgeWA"
    const [judgeStatuses, setJudgeStatuses] = useState<JudgeStatus[]>([])
    const statusOptions: JudgeStatus[] = ["JudgeAC", "JudgeWA"]

    // cheats filter state
    const [cheatsChallengeNames, setCheatsChallengeNames] = useState<string[]>([])
    const [cheatsTeamNames, setCheatsTeamNames] = useState<string[]>([])
    const [cheatsChallengeIds, setCheatsChallengeIds] = useState<number[]>([])
    const [cheatsTeamIds, setCheatsTeamIds] = useState<number[]>([])
    type CheatType = "SubmitSomeonesFlag" | "SubmitWithoutDownloadAttachments" | "SubmitWithoutStartContainer"
    const [cheatTypes, setCheatTypes] = useState<CheatType[]>([])
    const cheatTypeOptions: CheatType[] = ["SubmitSomeonesFlag", "SubmitWithoutDownloadAttachments", "SubmitWithoutStartContainer"]

    const [curChoicedCategory, setCurChoicedCategory] = useState<string>("teamName")

    const [newChallengeName, setNewChallengeName] = useState("")
    const [newTeamName, setNewTeamName] = useState("")
    const [newChallengeId, setNewChallengeId] = useState<string>("")
    const [newTeamId, setNewTeamId] = useState<string>("")

    // dialog control & temp states
    const [dialogOpen, setDialogOpen] = useState(false)
    const [tempJudgeStatuses, setTempJudgeStatuses] = useState<JudgeStatus[]>([])
    const [tempStartTime, setTempStartTime] = useState<string | undefined>(undefined)
    const [tempEndTime, setTempEndTime] = useState<string | undefined>(undefined)

    const [startTime, setStartTime] = useState<string | undefined>(undefined)
    const [endTime, setEndTime] = useState<string | undefined>(undefined)

    // cheats dialog control & temp states
    const [cheatsDialogOpen, setCheatsDialogOpen] = useState(false)
    const [tempCheatTypes, setTempCheatTypes] = useState<CheatType[]>([])
    const [tempCheatsStartTime, setTempCheatsStartTime] = useState<string | undefined>(undefined)
    const [tempCheatsEndTime, setTempCheatsEndTime] = useState<string | undefined>(undefined)

    const [cheatsStartTime, setCheatsStartTime] = useState<string | undefined>(undefined)
    const [cheatsEndTime, setCheatsEndTime] = useState<string | undefined>(undefined)
    const [cheatsCurChoicedCategory, setCheatsCurChoicedCategory] = useState<string>("teamName")
    const [newCheatsChallengeName, setNewCheatsChallengeName] = useState("")
    const [newCheatsTeamName, setNewCheatsTeamName] = useState("")
    const [newCheatsChallengeId, setNewCheatsChallengeId] = useState<string>("")
    const [newCheatsTeamId, setNewCheatsTeamId] = useState<string>("")

    const { theme } = useTheme()

    const loadSubmissions = async (page: number) => {
        try {
            setLoading(true)
            const res = await api.admin.adminListGameSubmits(gameId, {
                game_id: gameId,
                size: pageSize,
                offset: (page - 1) * pageSize,
                challenge_names: challengeNames,
                team_names: teamNames,
                challenge_ids: challengeIds,
                team_ids: teamIds,
                judge_statuses: judgeStatuses,
                start_time: startTime && startTime.trim() !== "" ? startTime : undefined,
                end_time: endTime && endTime.trim() !== "" ? endTime : undefined
            })

            const list = res.data.data || []
            setTotal(res.data.total || 0)
            setSubmissions(list)
        } catch (err) {
            console.error(err)
            toast.error('加载提交记录失败')
        } finally {
            setLoading(false)
        }
    }

    const loadCheats = async () => {
        setCheatsLoading(true)
        try {
            const response = await api.admin.adminListGameCheats(gameId, {
                game_id: gameId,
                size: pageSize,
                offset: (cheatsCurrentPage - 1) * pageSize,
                challenge_names: cheatsChallengeNames.length > 0 ? cheatsChallengeNames : undefined,
                team_names: cheatsTeamNames.length > 0 ? cheatsTeamNames : undefined,
                challenge_ids: cheatsChallengeIds.length > 0 ? cheatsChallengeIds : undefined,
                team_ids: cheatsTeamIds.length > 0 ? cheatsTeamIds : undefined,
                cheat_types: cheatTypes.length > 0 ? cheatTypes : undefined,
                start_time: cheatsStartTime,
                end_time: cheatsEndTime,
            })
            setCheats(response.data.data)
            setCheatsTotal(response.data.total)
        } catch (error) {
            console.error("Failed to load cheats:", error)
            toast.error("加载作弊记录失败")
        } finally {
            setCheatsLoading(false)
        }
    }

    useEffect(() => {
        // 初次加载
        if (gameId) {
            loadSubmissions(1)
            loadCheats()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameId])

    useEffect(() => {
        // 当作弊记录筛选条件或分页变化时重新加载
        loadCheats()
    }, [cheatsCurrentPage, cheatsChallengeNames, cheatsTeamNames, cheatsChallengeIds, cheatsTeamIds, cheatTypes, cheatsStartTime, cheatsEndTime])

    const statusColor = (status: string) => {
        switch (status) {
            case 'JudgeAC':
                return 'text-green-600'
            case 'JudgeWA':
                return 'text-red-500'
            case 'JudgeError':
            case 'JudgeTimeout':
                return 'text-orange-500'
            case 'JudgeQueueing':
            case 'JudgeRunning':
                return 'text-blue-500'
            default:
                return 'text-muted-foreground'
        }
    }

    const statusIcon = (status: string) => {
        switch (status) {
            case 'JudgeAC':
                return <CheckCircle2 className="w-4 h-4" />
            case 'JudgeWA':
                return <XCircle className="w-4 h-4" />
            default:
                return <AlertCircle className="w-4 h-4" />
        }
    }

    const gotoChallenge = (challengeId: number) => {
        window.open(window.location.origin + `/games/${gameId}?challenge=${challengeId}`, '_blank')
    }

    const totalPages = Math.ceil(total / pageSize) || 1

    // 当过滤或分页改变时加载
    useEffect(() => {
        loadSubmissions(currentPage)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, challengeNames, teamNames, judgeStatuses, startTime, endTime, teamIds, challengeIds])

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between select-none">
                <span className="font-bold text-2xl">比赛事件</span>
                <div className="flex items-center overflow-hidden rounded-3xl border-2">
                    <Button
                        variant={`${curChoicedType === "submissions" ? "default" : "ghost"}`}
                        onClick={() => setCurChoicedType("submissions")}
                        className="rounded-none rounded-l-3xl"
                    >
                        <Captions className="mr-1" />
                        提交记录
                    </Button>
                    <Button
                        variant={`${curChoicedType === "cheats" ? "default" : "ghost"}`}
                        onClick={() => setCurChoicedType("cheats")}
                        className="rounded-none rounded-r-3xl"
                    >
                        <TriangleAlert className="mr-1" />
                        异常记录
                    </Button>
                </div>
            </div>

            {curChoicedType === 'submissions' && (
                <div className="space-y-4">
                    {/* Filter action bar */}
                    <div className="flex flex-wrap gap-1 items-center">
                        {/* Active filter chips */}
                        <div className="flex flex-wrap gap-1 select-none">
                            {challengeNames.map((c, i) => (<Badge key={"c" + i} variant="secondary" className="gap-1">题目名:{c}<X className="w-3 h-3 cursor-pointer" onClick={() => { setChallengeNames(prev => prev.filter((_, idx) => idx !== i)); setCurrentPage(1) }} /></Badge>))}
                            {challengeIds.map((id, i) => (<Badge key={"cid" + i} variant="secondary" className="gap-1">题目ID:{id}<X className="w-3 h-3 cursor-pointer" onClick={() => { setChallengeIds(prev => prev.filter((_, idx) => idx !== i)); setCurrentPage(1) }} /></Badge>))}
                            {teamNames.map((t, i) => (<Badge key={"t" + i} variant="secondary" className="gap-1">队伍名:{t}<X className="w-3 h-3 cursor-pointer" onClick={() => { setTeamNames(prev => prev.filter((_, idx) => idx !== i)); setCurrentPage(1) }} /></Badge>))}
                            {teamIds.map((tid, i) => (<Badge key={"tid" + i} variant="secondary" className="gap-1">队伍ID:{tid}<X className="w-3 h-3 cursor-pointer" onClick={() => { setTeamIds(prev => prev.filter((_, idx) => idx !== i)); setCurrentPage(1) }} /></Badge>))}
                            {judgeStatuses.map((s, i) => (<Badge key={"s" + i} variant="secondary" className="gap-1">{s.replace('Judge', '')}<X className="w-3 h-3 cursor-pointer" onClick={() => { setJudgeStatuses(prev => prev.filter((_, idx) => idx !== i)); setCurrentPage(1) }} /></Badge>))}
                            {(startTime || endTime) && (
                                <Badge variant="secondary" className="gap-1">{startTime ? dayjs(startTime).format('MM-DD HH:mm') : '...'}<span>-</span>{endTime ? dayjs(endTime).format('MM-DD HH:mm') : '...'}<X className="w-3 h-3 cursor-pointer" onClick={() => { setStartTime(undefined); setEndTime(undefined); setCurrentPage(1) }} /></Badge>
                            )}
                        </div>

                        <Badge variant="secondary" className="gap-[1px] select-none hover:bg-foreground/20"
                            onClick={() => {
                                // copy current filters to temp before open
                                setTempJudgeStatuses([...judgeStatuses])
                                setTempStartTime(startTime)
                                setTempEndTime(endTime)
                                setDialogOpen(true)
                            }}
                        >
                            <Filter className="w-3 h-3 mr-1" />添加筛选条件
                        </Badge>
                        <Badge variant="secondary" className="gap-[1px] select-none hover:bg-foreground/20"
                            onClick={() => {
                                // copy current filters to temp before open
                                setChallengeNames([])
                                setTeamNames([])
                                setChallengeIds([])
                                setTeamIds([])
                                setJudgeStatuses([])
                                setStartTime(undefined)
                                setEndTime(undefined)
                                setCurrentPage(1)
                            }}
                        >
                            <Trash className="w-3 h-3 mr-1" />清空筛选条件
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                        <RefreshCw
                            className={`w-4 h-4 cursor-pointer ${loading ? 'animate-spin' : ''}`}
                            onClick={() => { if (!loading) { setCurrentPage(1); loadSubmissions(1) } }}
                        />
                        <span className="text-muted-foreground text-sm select-none">共 {total} 条提交</span>
                    </div>

                    {submissions.length === 0 && !loading ? (
                        <div className="text-center py-12">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">暂无提交记录</h3>
                            <p className="text-muted-foreground">等待选手提交后将在此处显示</p>
                        </div>
                    ) : (
                        <MacScrollbar className="flex-1" skin={theme === 'dark' ? 'dark' : 'light'}>
                            <div className="flex flex-col pr-4">
                                {/* Table Header */}
                                <div className="flex items-center gap-4 px-4 py-3 border-b-2 bg-gradient-to-r from-muted/50 to-muted/30 text-sm font-semibold text-foreground sticky top-0 backdrop-blur-sm shadow-sm">
                                    <div className="flex-[1] min-w-0">提交时间</div>
                                    <div className="flex-[0.5] text-center">状态</div>
                                    <div className="flex-[1] min-w-0">用户</div>
                                    <div className="flex-[1] min-w-0">队伍</div>
                                    <div className="flex-[2] min-w-0">题目</div>
                                    <div className="flex-[3] min-w-0">Flag内容</div>
                                </div>
                                {submissions.map((sub, index) => (
                                    <div key={sub.judge_id} className={`flex items-center gap-4 px-4 py-3 border-b border-border/50 hover:bg-accent/60 hover:shadow-sm transition-all duration-200 text-sm w-full ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                                        <div className="flex items-center flex-[1] gap-1 text-muted-foreground min-w-0" title={dayjs(sub.judge_time).format('YYYY-MM-DD HH:mm:ss')}>
                                            <Clock className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{dayjs(sub.judge_time).format('YYYY-MM-DD HH:mm:ss')}</span>
                                        </div>
                                        <div className="flex-[0.5] justify-center flex">
                                            <Badge 
                                                variant="outline" 
                                                className={`flex items-center gap-1 select-none min-w-0 px-3 py-1 rounded-full font-medium shadow-sm transition-all duration-200 ${statusColor(sub.judge_status)}`}
                                            >
                                                {statusIcon(sub.judge_status)}
                                                <span className="truncate">{sub.judge_status.replace('Judge', '')}</span>
                                            </Badge>
                                        </div>
                                        <div className="flex items-center flex-[1] gap-1 min-w-0" title={sub.username}>
                                            <User className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{sub.username}</span>
                                        </div>
                                        <div className="flex items-center flex-[1] gap-1 min-w-0" title={sub.team_name}>
                                            <Users className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{sub.team_name}</span>
                                            <Badge 
                                                variant="outline" 
                                                className="text-xs select-none hover:bg-primary/10 hover:border-primary/30 cursor-pointer transition-all duration-200 rounded-md px-2 py-1 font-mono" 
                                                onClick={() => {
                                                    copy(sub.team_id.toString())
                                                    toast.success('已复制队伍ID')
                                                }}
                                            >
                                                #{sub.team_id}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center flex-[2] gap-1 min-w-0" title={sub.challenge_name}>
                                            <Trophy className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{sub.challenge_name}</span>
                                            <Badge 
                                                variant="outline" 
                                                className="text-xs select-none hover:bg-blue/10 hover:border-blue/30 cursor-pointer transition-all duration-200 rounded-md px-2 py-1 font-mono" 
                                                onClick={() => {
                                                    gotoChallenge(sub.challenge_id)
                                                }}
                                            >
                                                #{sub.challenge_id}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center flex-[3] gap-1 font-mono min-w-0" title={sub.flag_content}>
                                            <Flag className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{sub.flag_content}</span>
                                            <Badge 
                                                variant="outline" 
                                                className="text-xs select-none hover:bg-green/10 hover:border-green/30 cursor-pointer transition-all duration-200 rounded-md p-1.5 hover:scale-105" 
                                                onClick={() => {
                                                    copy(sub.flag_content)
                                                    toast.success('已复制')
                                                }}
                                            >
                                                <Copy className="w-3 h-3" />
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </MacScrollbar>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-4 select-none flex-wrap">
                            <Button 
                                size="sm" 
                                variant="outline" 
                                disabled={currentPage === 1} 
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                            >
                                上一页
                            </Button>
                            {Array.from({ length: totalPages }).slice(0, 10).map((_, idx) => {
                                const page = idx + 1
                                if (page > totalPages) return null
                                return (
                                    <Button 
                                        key={page} 
                                        size="sm" 
                                        variant={currentPage === page ? 'default' : 'outline'} 
                                        onClick={() => setCurrentPage(page)}
                                        className={`transition-all duration-200 ${currentPage === page ? 'shadow-md' : 'hover:bg-primary/10 hover:border-primary/30'}`}
                                    >
                                        {page}
                                    </Button>
                                )
                            })}
                            {totalPages > 10 && (
                                <span className="text-sm mx-2 text-muted-foreground">...</span>
                            )}
                            <Button 
                                size="sm" 
                                variant="outline" 
                                disabled={currentPage === totalPages} 
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                            >
                                下一页
                            </Button>
                        </div>
                    )}

                    {/* Filter Dialog */}
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>筛选提交记录</DialogTitle>
                            </DialogHeader>

                            <div className="space-y-2 mt-4">
                                <h4 className="font-medium">筛选条件</h4>
                                <Select value={curChoicedCategory} onValueChange={(value) => setCurChoicedCategory(value)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="筛选条件" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="teamName">队伍名称</SelectItem>
                                        <SelectItem value="challengeName">题目名称</SelectItem>
                                        <SelectItem value="judgeStatus">评测状态</SelectItem>
                                        <SelectItem value="timeRange">时间范围</SelectItem>
                                        <SelectItem value="challengeId">题目ID</SelectItem>
                                        <SelectItem value="teamId">队伍ID</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>



                            {/* Challenge names */}
                            {curChoicedCategory === "challengeName" && (
                                <div className="space-y-2">
                                    <h4 className="font-medium">题目名称关键词</h4>
                                    <Input value={newChallengeName} onChange={(e) => setNewChallengeName(e.target.value)} placeholder="题目关键词" className="h-8" />
                                </div>
                            )}

                            {/* Team names */}
                            {curChoicedCategory === "teamName" && (
                                <div className="space-y-2 mt-4">
                                    <h4 className="font-medium">队伍名称关键词</h4>
                                    <Input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="队伍关键词" className="h-8" />
                                </div>
                            )}

                            {/* Challenge IDs */}
                            {curChoicedCategory === "challengeId" && (
                                <div className="space-y-2 mt-4">
                                    <h4 className="font-medium">题目 ID</h4>
                                    <Input value={newChallengeId} onChange={(e) => setNewChallengeId(e.target.value)} placeholder="题目ID" className="h-8" />
                                </div>
                            )}

                            {/* Team IDs */}
                            {curChoicedCategory === "teamId" && (
                                <div className="space-y-2 mt-4">
                                    <h4 className="font-medium">队伍 ID</h4>
                                    <Input value={newTeamId} onChange={(e) => setNewTeamId(e.target.value)} placeholder="队伍ID" className="h-8" />
                                </div>
                            )}

                            {/* Status select */}
                            {curChoicedCategory === "judgeStatus" && (
                                <div className="space-y-2 mt-4">
                                    <h4 className="font-medium">评测状态</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {statusOptions.map(st => {
                                            const active = tempJudgeStatuses.includes(st)
                                            return (
                                                <Button key={st} size="sm" variant={active ? "default" : "outline"} onClick={() => {
                                                    setTempJudgeStatuses(prev => active ? prev.filter(s => s !== st) : [...prev, st]);
                                                }}>{st.replace('Judge', '')}</Button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Time range */}
                            {curChoicedCategory === "timeRange" && (
                                <div className="space-y-2 mt-4">
                                    <h4 className="font-medium">时间范围</h4>
                                    <div className="flex items-center gap-1">
                                        <Input type="datetime-local" value={tempStartTime || ""} onChange={(e) => setTempStartTime(e.target.value || undefined)} className="h-8" />
                                        <span className="px-1">-</span>
                                        <Input type="datetime-local" value={tempEndTime || ""} onChange={(e) => setTempEndTime(e.target.value || undefined)} className="h-8" />
                                    </div>
                                </div>
                            )}

                            <DialogFooter className="mt-6">
                                <Button variant="secondary" onClick={() => setDialogOpen(false)}>取消</Button>
                                <Button onClick={() => {
                                    switch (curChoicedCategory) {
                                        case "challengeName":
                                            if (newChallengeName.trim()) { setChallengeNames(prev => [...prev, newChallengeName.trim()]); setNewChallengeName(""); }
                                            break;
                                        case "teamName":
                                            if (newTeamName.trim()) { setTeamNames(prev => [...prev, newTeamName.trim()]); setNewTeamName(""); }
                                            break
                                        case "challengeId":
                                            const num1 = parseInt(newChallengeId.trim());
                                            if (!isNaN(num1)) { setChallengeIds(prev => prev.includes(num1) ? prev : [...prev, num1]); setNewChallengeId(""); }
                                            break
                                        case "teamId":
                                            const num2 = parseInt(newTeamId.trim());
                                            if (!isNaN(num2)) { setTeamIds(prev => prev.includes(num2) ? prev : [...prev, num2]); setNewTeamId(""); }
                                            break
                                        case "judgeStatus":
                                            setJudgeStatuses(tempJudgeStatuses);
                                            break
                                        case "timeRange":
                                            setStartTime(tempStartTime);
                                            setEndTime(tempEndTime);
                                            break
                                    }
                                    setCurrentPage(1)
                                    setDialogOpen(false)
                                }}>应用</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            {curChoicedType === 'cheats' && (
                <div className="space-y-4">
                    {/* Filter action bar */}
                    <div className="flex flex-wrap gap-1 items-center">
                        {/* Active filter chips */}
                        <div className="flex flex-wrap gap-1 select-none">
                            {cheatsChallengeNames.map((c, i) => (<Badge key={"c" + i} variant="secondary" className="gap-1">题目名:{c}<X className="w-3 h-3 cursor-pointer" onClick={() => { setCheatsChallengeNames(prev => prev.filter((_, idx) => idx !== i)); setCheatsCurrentPage(1) }} /></Badge>))}
                            {cheatsChallengeIds.map((id, i) => (<Badge key={"cid" + i} variant="secondary" className="gap-1">题目ID:{id}<X className="w-3 h-3 cursor-pointer" onClick={() => { setCheatsChallengeIds(prev => prev.filter((_, idx) => idx !== i)); setCheatsCurrentPage(1) }} /></Badge>))}
                            {cheatsTeamNames.map((t, i) => (<Badge key={"t" + i} variant="secondary" className="gap-1">队伍名:{t}<X className="w-3 h-3 cursor-pointer" onClick={() => { setCheatsTeamNames(prev => prev.filter((_, idx) => idx !== i)); setCheatsCurrentPage(1) }} /></Badge>))}
                            {cheatsTeamIds.map((tid, i) => (<Badge key={"tid" + i} variant="secondary" className="gap-1">队伍ID:{tid}<X className="w-3 h-3 cursor-pointer" onClick={() => { setCheatsTeamIds(prev => prev.filter((_, idx) => idx !== i)); setCheatsCurrentPage(1) }} /></Badge>))}
                            {cheatTypes.map((s, i) => (<Badge key={"s" + i} variant="secondary" className="gap-1">{cheatTypeText(s)}<X className="w-3 h-3 cursor-pointer" onClick={() => { setCheatTypes(prev => prev.filter((_, idx) => idx !== i)); setCheatsCurrentPage(1) }} /></Badge>))}
                            {(cheatsStartTime || cheatsEndTime) && (
                                <Badge variant="secondary" className="gap-1">{cheatsStartTime ? dayjs(cheatsStartTime).format('MM-DD HH:mm') : '...'}<span>-</span>{cheatsEndTime ? dayjs(cheatsEndTime).format('MM-DD HH:mm') : '...'}<X className="w-3 h-3 cursor-pointer" onClick={() => { setCheatsStartTime(undefined); setCheatsEndTime(undefined); setCheatsCurrentPage(1) }} /></Badge>
                            )}
                        </div>

                        <Badge variant="secondary" className="gap-[1px] select-none hover:bg-foreground/20"
                            onClick={() => {
                                // copy current filters to temp before open
                                setTempCheatTypes([...cheatTypes])
                                setTempCheatsStartTime(cheatsStartTime)
                                setTempCheatsEndTime(cheatsEndTime)
                                setCheatsDialogOpen(true)
                            }}
                        >
                            <Filter className="w-3 h-3 mr-1" />添加筛选条件
                        </Badge>
                        <Badge variant="secondary" className="gap-[1px] select-none hover:bg-foreground/20"
                            onClick={() => {
                                // copy current filters to temp before open
                                setCheatsChallengeNames([])
                                setCheatsTeamNames([])
                                setCheatsChallengeIds([])
                                setCheatsTeamIds([])
                                setCheatTypes([])
                                setCheatsStartTime(undefined)
                                setCheatsEndTime(undefined)
                                setCheatsCurrentPage(1)
                            }}
                        >
                            <Trash className="w-3 h-3 mr-1" />清空筛选条件
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                        <RefreshCw
                            className={`w-4 h-4 cursor-pointer ${cheatsLoading ? 'animate-spin' : ''}`}
                            onClick={() => { if (!cheatsLoading) { setCheatsCurrentPage(1); loadCheats() } }}
                        />
                        <span className="text-muted-foreground text-sm select-none">共 {cheatsTotal} 条异常记录</span>
                    </div>

                    {cheats.length === 0 && !cheatsLoading ? (
                        <div className="text-center py-12">
                            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">暂无异常记录</h3>
                            <p className="text-muted-foreground">系统将自动检测并记录异常行为</p>
                        </div>
                    ) : (
                        <MacScrollbar className="flex-1" skin={theme === 'dark' ? 'dark' : 'light'}>
                            <div className="flex flex-col pr-4">
                                {/* Table Header */}
                                <div className="flex items-center gap-3 px-4 py-3 border-b-2 bg-gradient-to-r from-muted/50 to-muted/30 text-sm font-semibold text-foreground sticky top-0 backdrop-blur-sm shadow-sm">
                                    <div className="flex-[1] min-w-0">异常时间</div>
                                    <div className="flex-[1] text-center">异常类型</div>
                                    <div className="flex-[1] min-w-0">用户</div>
                                    <div className="flex-[1] min-w-0">队伍</div>
                                    <div className="flex-[2] min-w-0">题目</div>
                                    <div className="flex-[2] min-w-0">异常信息</div>
                                    <div className="flex-[1] min-w-0">提交者IP</div>
                                </div>
                                {cheats.map((cheat, index) => (
                                    <div key={cheat.cheat_id} className={`flex items-center gap-3 px-4 py-3 border-b border-border/50 hover:bg-accent/60 hover:shadow-sm transition-all duration-200 text-sm w-full ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                                        <div className="flex items-center flex-[1] gap-1 text-muted-foreground min-w-0" title={dayjs(cheat.cheat_time).format('YYYY-MM-DD HH:mm:ss')}>
                                            <Clock className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{dayjs(cheat.cheat_time).format('YYYY-MM-DD HH:mm:ss')}</span>
                                        </div>
                                        <div className="flex-[1] justify-center flex">
                                            <Badge 
                                                variant="outline" 
                                                className={`flex items-center gap-1 select-none min-w-0 px-3 py-1 rounded-full font-medium shadow-sm transition-all duration-200 ${cheatTypeColor(cheat.cheat_type)}`}
                                            >
                                                {cheatTypeIcon(cheat.cheat_type)}
                                                <span className="truncate">{cheatTypeText(cheat.cheat_type)}</span>
                                            </Badge>
                                        </div>
                                        <div className="flex items-center flex-[1] gap-1 min-w-0" title={cheat.username}>
                                            <User className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{cheat.username}</span>
                                        </div>
                                        <div className="flex items-center flex-[1] gap-1 min-w-0" title={cheat.team_name}>
                                            <Users className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{cheat.team_name}</span>
                                            <Badge 
                                                variant="outline" 
                                                className="text-xs select-none hover:bg-primary/10 hover:border-primary/30 cursor-pointer transition-all duration-200 rounded-md px-2 py-1 font-mono" 
                                                onClick={() => {
                                                    copy(cheat.team_id.toString())
                                                    toast.success('已复制队伍ID')
                                                }}
                                            >
                                                #{cheat.team_id}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center flex-[2] gap-1 min-w-0" title={cheat.challenge_name}>
                                            <Trophy className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{cheat.challenge_name}</span>
                                            <Badge 
                                                variant="outline" 
                                                className="text-xs select-none hover:bg-blue/10 hover:border-blue/30 cursor-pointer transition-all duration-200 rounded-md px-2 py-1 font-mono" 
                                                onClick={() => {
                                                    gotoChallenge(cheat.challenge_id)
                                                }}
                                            >
                                                #{cheat.challenge_id}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center flex-[2] gap-1 min-w-0">
                                            {(() => {
                                                if (cheat.cheat_type === "SubmitSomeonesFlag" && cheat.extra_data && typeof cheat.extra_data === 'object') {
                                                    const extraData = cheat.extra_data as any;
                                                    if (extraData.relevant_team && extraData.relevant_teamname) {
                                                        return (
                                                            <div className="flex items-center gap-1"
                                                                data-tooltip-content="交串Flag的队伍"
                                                                data-tooltip-id="my-tooltip"
                                                                data-tooltip-place="bottom"
                                                            >
                                                                <Users className="w-4 h-4 flex-shrink-0" />
                                                                <span className="truncate" title={extraData.relevant_teamname}>{extraData.relevant_teamname}</span>
                                                                <Badge 
                                                                    variant="outline" 
                                                                    className="text-xs select-none hover:bg-orange/10 hover:border-orange/30 cursor-pointer transition-all duration-200 rounded-md px-2 py-1 font-mono" 
                                                                    onClick={() => {
                                                                        copy(extraData.relevant_team.toString())
                                                                        toast.success('已复制队伍ID')
                                                                    }}
                                                                >
                                                                    #{extraData.relevant_team}
                                                                </Badge>
                                                            </div>
                                                        );
                                                    }
                                                }
                                                return (
                                                    <>
                                                        <span className="truncate text-muted-foreground" title={JSON.stringify(cheat.extra_data)}>{JSON.stringify(cheat.extra_data)}</span>
                                                        <Badge 
                                                            variant="outline" 
                                                            className="text-xs select-none hover:bg-purple/10 hover:border-purple/30 cursor-pointer transition-all duration-200 rounded-md p-1.5 hover:scale-105" 
                                                            onClick={() => {
                                                                copy(JSON.stringify(cheat.extra_data))
                                                                toast.success('已复制异常信息')
                                                            }}
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </Badge>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        {cheat.submiter_ip && (
                                            <div className="flex items-center flex-[1] gap-1 font-mono min-w-0" title={cheat.submiter_ip}>
                                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                                <span className="truncate">{cheat.submiter_ip}</span>
                                                <Badge 
                                                    variant="outline" 
                                                    className="text-xs select-none hover:bg-cyan/10 hover:border-cyan/30 cursor-pointer transition-all duration-200 rounded-md p-1.5 hover:scale-105" 
                                                    onClick={() => {
                                                        copy(cheat.submiter_ip || '')
                                                        toast.success('已复制IP')
                                                    }}
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </MacScrollbar>
                    )}

                    {/* Pagination */}
                    {cheatsTotalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-4 select-none flex-wrap">
                            <Button 
                                size="sm" 
                                variant="outline" 
                                disabled={cheatsCurrentPage === 1} 
                                onClick={() => setCheatsCurrentPage(prev => prev - 1)}
                                className="hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                            >
                                上一页
                            </Button>
                            {Array.from({ length: cheatsTotalPages }).slice(0, 10).map((_, idx) => {
                                const page = idx + 1
                                if (page > cheatsTotalPages) return null
                                return (
                                    <Button 
                                        key={page} 
                                        size="sm" 
                                        variant={cheatsCurrentPage === page ? 'default' : 'outline'} 
                                        onClick={() => setCheatsCurrentPage(page)}
                                        className={`transition-all duration-200 ${cheatsCurrentPage === page ? 'shadow-md' : 'hover:bg-primary/10 hover:border-primary/30'}`}
                                    >
                                        {page}
                                    </Button>
                                )
                            })}
                            {cheatsTotalPages > 10 && (
                                <span className="text-sm mx-2 text-muted-foreground">...</span>
                            )}
                            <Button 
                                size="sm" 
                                variant="outline" 
                                disabled={cheatsCurrentPage === cheatsTotalPages} 
                                onClick={() => setCheatsCurrentPage(prev => prev + 1)}
                                className="hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                            >
                                下一页
                            </Button>
                        </div>
                    )}

                    {/* Filter Dialog */}
                    <Dialog open={cheatsDialogOpen} onOpenChange={setCheatsDialogOpen}>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>筛选异常记录</DialogTitle>
                            </DialogHeader>

                            <div className="space-y-2 mt-4">
                                <h4 className="font-medium">筛选条件</h4>
                                <Select value={cheatsCurChoicedCategory} onValueChange={(value) => setCheatsCurChoicedCategory(value)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="筛选条件" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="teamName">队伍名称</SelectItem>
                                        <SelectItem value="challengeName">题目名称</SelectItem>
                                        <SelectItem value="cheatType">异常类型</SelectItem>
                                        <SelectItem value="timeRange">时间范围</SelectItem>
                                        <SelectItem value="challengeId">题目ID</SelectItem>
                                        <SelectItem value="teamId">队伍ID</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Challenge names */}
                            {cheatsCurChoicedCategory === "challengeName" && (
                                <div className="space-y-2">
                                    <h4 className="font-medium">题目名称关键词</h4>
                                    <Input value={newCheatsChallengeName} onChange={(e) => setNewCheatsChallengeName(e.target.value)} placeholder="题目关键词" className="h-8" />
                                </div>
                            )}

                            {/* Team names */}
                            {cheatsCurChoicedCategory === "teamName" && (
                                <div className="space-y-2 mt-4">
                                    <h4 className="font-medium">队伍名称关键词</h4>
                                    <Input value={newCheatsTeamName} onChange={(e) => setNewCheatsTeamName(e.target.value)} placeholder="队伍关键词" className="h-8" />
                                </div>
                            )}

                            {/* Challenge IDs */}
                            {cheatsCurChoicedCategory === "challengeId" && (
                                <div className="space-y-2 mt-4">
                                    <h4 className="font-medium">题目 ID</h4>
                                    <Input value={newCheatsChallengeId} onChange={(e) => setNewCheatsChallengeId(e.target.value)} placeholder="题目ID" className="h-8" />
                                </div>
                            )}

                            {/* Team IDs */}
                            {cheatsCurChoicedCategory === "teamId" && (
                                <div className="space-y-2 mt-4">
                                    <h4 className="font-medium">队伍 ID</h4>
                                    <Input value={newCheatsTeamId} onChange={(e) => setNewCheatsTeamId(e.target.value)} placeholder="队伍ID" className="h-8" />
                                </div>
                            )}

                            {/* Cheat Type select */}
                            {cheatsCurChoicedCategory === "cheatType" && (
                                <div className="space-y-2 mt-4">
                                    <h4 className="font-medium">异常类型</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {cheatTypeOptions.map(ct => {
                                            const active = tempCheatTypes.includes(ct)
                                            return (
                                                <Button key={ct} size="sm" variant={active ? "default" : "outline"} onClick={() => {
                                                    setTempCheatTypes(prev => active ? prev.filter(s => s !== ct) : [...prev, ct]);
                                                }}>{cheatTypeText(ct)}</Button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Time range */}
                            {cheatsCurChoicedCategory === "timeRange" && (
                                <div className="space-y-2 mt-4">
                                    <h4 className="font-medium">时间范围</h4>
                                    <div className="flex items-center gap-1">
                                        <Input type="datetime-local" value={tempCheatsStartTime || ""} onChange={(e) => setTempCheatsStartTime(e.target.value || undefined)} className="h-8" />
                                        <span className="px-1">-</span>
                                        <Input type="datetime-local" value={tempCheatsEndTime || ""} onChange={(e) => setTempCheatsEndTime(e.target.value || undefined)} className="h-8" />
                                    </div>
                                </div>
                            )}

                            <DialogFooter className="mt-6">
                                <Button variant="secondary" onClick={() => setCheatsDialogOpen(false)}>取消</Button>
                                <Button onClick={() => {
                                    switch (cheatsCurChoicedCategory) {
                                        case "challengeName":
                                            if (newCheatsChallengeName.trim()) { setCheatsChallengeNames(prev => [...prev, newCheatsChallengeName.trim()]); setNewCheatsChallengeName(""); }
                                            break;
                                        case "teamName":
                                            if (newCheatsTeamName.trim()) { setCheatsTeamNames(prev => [...prev, newCheatsTeamName.trim()]); setNewCheatsTeamName(""); }
                                            break
                                        case "challengeId":
                                            const num1 = parseInt(newCheatsChallengeId.trim());
                                            if (!isNaN(num1)) { setCheatsChallengeIds(prev => prev.includes(num1) ? prev : [...prev, num1]); setNewCheatsChallengeId(""); }
                                            break
                                        case "teamId":
                                            const num2 = parseInt(newCheatsTeamId.trim());
                                            if (!isNaN(num2)) { setCheatsTeamIds(prev => prev.includes(num2) ? prev : [...prev, num2]); setNewCheatsTeamId(""); }
                                            break
                                        case "cheatType":
                                            setCheatTypes(tempCheatTypes);
                                            break
                                        case "timeRange":
                                            setCheatsStartTime(tempCheatsStartTime);
                                            setCheatsEndTime(tempCheatsEndTime);
                                            break
                                    }
                                    setCheatsCurrentPage(1)
                                    setCheatsDialogOpen(false)
                                }}>应用</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </div>
    )
}