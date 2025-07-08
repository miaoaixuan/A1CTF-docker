import { Button } from "components/ui/button"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "components/ui/table"
import { Badge } from "components/ui/badge"
import { MacScrollbar } from "mac-scrollbar"
import { Captions, TriangleAlert, RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock, Flag, Trophy, User, Users, Plus, X, Filter, Trash, Copy } from "lucide-react"
import { useParams } from "react-router"
import { useEffect, useState } from "react"
import dayjs from "dayjs"
import { api } from "utils/ApiHelper"
import { AdminSubmitItem } from "utils/A1API"
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

    const [submissions, setSubmissions] = useState<AdminSubmitItem[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [currentPage, setCurrentPage] = useState<number>(1)
    const pageSize = 15
    const [total, setTotal] = useState<number>(0)

    // filter state
    const [challengeNames, setChallengeNames] = useState<string[]>([])
    const [teamNames, setTeamNames] = useState<string[]>([])
    const [challengeIds, setChallengeIds] = useState<number[]>([])
    const [teamIds, setTeamIds] = useState<number[]>([])
    type JudgeStatus = "JudgeAC" | "JudgeWA"
    const [judgeStatuses, setJudgeStatuses] = useState<JudgeStatus[]>([])
    const statusOptions: JudgeStatus[] = ["JudgeAC", "JudgeWA"]

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

    useEffect(() => {
        // 初次加载
        if (gameId) {
            loadSubmissions(1)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameId])

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
    }, [currentPage, challengeNames, teamNames, judgeStatuses, startTime, endTime])

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
                            <div className="flex flex-col gap-1 pr-4">
                                {submissions.map((sub) => (
                                    <div key={sub.judge_id} className="flex items-center gap-2 p-3 rounded-md hover:bg-accent/40 transition-colors text-sm w-full">
                                        <div className="flex items-center flex-[1] gap-1 text-muted-foreground min-w-0" title={dayjs(sub.judge_time).format('YYYY-MM-DD HH:mm:ss')}>
                                            <Clock className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{dayjs(sub.judge_time).format('YYYY-MM-DD HH:mm:ss')}</span>
                                        </div>
                                        <div className="flex-[0.5] justify-center flex">
                                            <Badge variant="outline" className={`flex items-center gap-1 select-none ${statusColor(sub.judge_status)} min-w-0`}>
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
                                            <Badge variant="outline" className="text-xs select-none hover:bg-foreground/20 cursor-pointer" onClick={() => {
                                                copy(sub.team_id.toString())
                                                toast.success('已复制队伍ID')
                                            }}>#{sub.team_id}</Badge>
                                        </div>
                                        <div className="flex items-center flex-[2] gap-1 min-w-0" title={sub.challenge_name}>
                                            <Trophy className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{sub.challenge_name}</span>
                                            <Badge variant="outline" className="text-xs select-none hover:bg-foreground/20 cursor-pointer" onClick={() => {
                                                gotoChallenge(sub.challenge_id)
                                            }}>#{sub.challenge_id}</Badge>
                                        </div>
                                        <div className="flex items-center flex-[3] gap-1 font-mono min-w-0" title={sub.flag_content}>
                                            <Flag className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{sub.flag_content}</span>
                                            <Badge variant="outline" className="text-xs select-none hover:bg-foreground/20 cursor-pointer p-1 px-2" onClick={() => {
                                                copy(sub.flag_content)
                                                toast.success('已复制')
                                            }}><Copy className="w-3 h-3" /></Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </MacScrollbar>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-2 select-none flex-wrap">
                            <Button size="sm" variant="ghost" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>上一页</Button>
                            {Array.from({ length: totalPages }).slice(0, 10).map((_, idx) => {
                                const page = idx + 1
                                if (page > totalPages) return null
                                return (
                                    <Button key={page} size="sm" variant={currentPage === page ? 'default' : 'secondary'} onClick={() => setCurrentPage(page)}>
                                        {page}
                                    </Button>
                                )
                            })}
                            {totalPages > 10 && (
                                <span className="text-sm mx-2">...</span>
                            )}
                            <Button size="sm" variant="ghost" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>下一页</Button>
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
        </div>
    )
}