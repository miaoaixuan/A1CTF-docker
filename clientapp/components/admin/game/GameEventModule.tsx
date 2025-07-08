import { Button } from "components/ui/button"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "components/ui/table"
import { Badge } from "components/ui/badge"
import { MacScrollbar } from "mac-scrollbar"
import { Captions, TriangleAlert, RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock, Flag, Trophy, User, Users, Plus, X, Filter } from "lucide-react"
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
    type JudgeStatus = "JudgeAC" | "JudgeWA" | "JudgeError" | "JudgeTimeout" | "JudgeQueueing" | "JudgeRunning"
    const [judgeStatuses, setJudgeStatuses] = useState<JudgeStatus[]>([])
    const statusOptions: JudgeStatus[] = ["JudgeAC", "JudgeWA", "JudgeError", "JudgeTimeout"]

    const [newChallengeName, setNewChallengeName] = useState("")
    const [newTeamName, setNewTeamName] = useState("")
    const [newChallengeId, setNewChallengeId] = useState<string>("")
    const [newTeamId, setNewTeamId] = useState<string>("")

    // dialog control & temp states
    const [dialogOpen, setDialogOpen] = useState(false)
    const [tempChallengeNames, setTempChallengeNames] = useState<string[]>([])
    const [tempTeamNames, setTempTeamNames] = useState<string[]>([])
    const [tempChallengeIds, setTempChallengeIds] = useState<number[]>([])
    const [tempTeamIds, setTempTeamIds] = useState<number[]>([])
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
                    <div className="flex flex-wrap gap-3 items-center">
                        <Button size="sm" variant="outline" onClick={() => {
                            // copy current filters to temp before open
                            setTempChallengeNames([...challengeNames])
                            setTempTeamNames([...teamNames])
                            setTempChallengeIds([...challengeIds])
                            setTempTeamIds([...teamIds])
                            setTempJudgeStatuses([...judgeStatuses])
                            setTempStartTime(startTime)
                            setTempEndTime(endTime)
                            setDialogOpen(true)
                        }}>
                            <Filter className="w-4 h-4 mr-1" />筛选
                        </Button>

                        {/* Active filter chips */}
                        <div className="flex flex-wrap gap-1">
                            {challengeNames.map((c, i) => (<Badge key={"c" + i} variant="secondary" className="gap-1">题:{c}<X className="w-3 h-3 cursor-pointer" onClick={() => { setChallengeNames(prev => prev.filter((_, idx) => idx !== i)); setCurrentPage(1) }} /></Badge>))}
                            {challengeIds.map((id, i) => (<Badge key={"cid" + i} variant="secondary" className="gap-1">题ID:{id}<X className="w-3 h-3 cursor-pointer" onClick={() => { setChallengeIds(prev => prev.filter((_, idx) => idx !== i)); setCurrentPage(1) }} /></Badge>))}
                            {teamNames.map((t, i) => (<Badge key={"t" + i} variant="secondary" className="gap-1">队:{t}<X className="w-3 h-3 cursor-pointer" onClick={() => { setTeamNames(prev => prev.filter((_, idx) => idx !== i)); setCurrentPage(1) }} /></Badge>))}
                            {teamIds.map((tid, i) => (<Badge key={"tid" + i} variant="secondary" className="gap-1">队ID:{tid}<X className="w-3 h-3 cursor-pointer" onClick={() => { setTeamIds(prev => prev.filter((_, idx) => idx !== i)); setCurrentPage(1) }} /></Badge>))}
                            {judgeStatuses.map((s, i) => (<Badge key={"s" + i} variant="secondary" className="gap-1">{s.replace('Judge', '')}<X className="w-3 h-3 cursor-pointer" onClick={() => { setJudgeStatuses(prev => prev.filter((_, idx) => idx !== i)); setCurrentPage(1) }} /></Badge>))}
                            {(startTime || endTime) && (
                                <Badge variant="secondary" className="gap-1">{startTime ? dayjs(startTime).format('MM-DD HH:mm') : '...'}<span>-</span>{endTime ? dayjs(endTime).format('MM-DD HH:mm') : '...'}<X className="w-3 h-3 cursor-pointer" onClick={() => { setStartTime(undefined); setEndTime(undefined); setCurrentPage(1) }} /></Badge>
                            )}
                        </div>
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
                                        <div className="flex items-center flex-[2] gap-1 text-muted-foreground min-w-0">
                                            <Clock className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{dayjs(sub.judge_time).format('MM-DD HH:mm:ss')}</span>
                                        </div>
                                        <Badge variant="outline" className={`flex items-center gap-1 ${statusColor(sub.judge_status)} flex-[1] justify-center min-w-0`}>
                                            {statusIcon(sub.judge_status)}
                                            <span className="truncate">{sub.judge_status.replace('Judge', '')}</span>
                                        </Badge>
                                        <div className="flex items-center flex-[1.5] gap-1 min-w-0" title={sub.username}>
                                            <User className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{sub.username}</span>
                                        </div>
                                        <div className="flex items-center flex-[1.5] gap-1 min-w-0" title={sub.team_name}>
                                            <Users className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{sub.team_name}</span>
                                        </div>
                                        <div className="flex items-center flex-[2] gap-1 min-w-0" title={sub.challenge_name}>
                                            <Trophy className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{sub.challenge_name}</span>
                                        </div>
                                        <div className="flex items-center flex-[3] gap-1 font-mono min-w-0" title={sub.flag_content}>
                                            <Flag className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">{sub.flag_content}</span>
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

                            {/* Challenge names */}
                            <div className="space-y-2">
                                <h4 className="font-medium">题目名称关键词</h4>
                                <div className="flex items-center gap-2">
                                    <Input value={newChallengeName} onChange={(e) => setNewChallengeName(e.target.value)} placeholder="输入后点击 + 添加" className="h-8" />
                                    <Button size="sm" variant="secondary" onClick={() => {
                                        if (newChallengeName.trim()) { setTempChallengeNames(prev => [...prev, newChallengeName.trim()]); setNewChallengeName(""); }
                                    }}><Plus className="w-4 h-4" /></Button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {tempChallengeNames.map((c, i) => (<Badge key={"tc" + i} variant="secondary" className="gap-1">{c}<X className="w-3 h-3 cursor-pointer" onClick={() => { setTempChallengeNames(prev => prev.filter((_, idx) => idx !== i)); }} /></Badge>))}
                                </div>
                            </div>

                            {/* Team names */}
                            <div className="space-y-2 mt-4">
                                <h4 className="font-medium">队伍名称关键词</h4>
                                <div className="flex items-center gap-2">
                                    <Input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="输入后点击 + 添加" className="h-8" />
                                    <Button size="sm" variant="secondary" onClick={() => {
                                        if (newTeamName.trim()) { setTempTeamNames(prev => [...prev, newTeamName.trim()]); setNewTeamName(""); }
                                    }}><Plus className="w-4 h-4" /></Button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {tempTeamNames.map((t, i) => (<Badge key={"tt" + i} variant="secondary" className="gap-1">{t}<X className="w-3 h-3 cursor-pointer" onClick={() => { setTempTeamNames(prev => prev.filter((_, idx) => idx !== i)); }} /></Badge>))}
                                </div>
                            </div>

                            {/* Challenge IDs */}
                            <div className="space-y-2 mt-4">
                                <h4 className="font-medium">题目 ID</h4>
                                <div className="flex items-center gap-2">
                                    <Input value={newChallengeId} onChange={(e) => setNewChallengeId(e.target.value)} placeholder="输入数字后 + 添加" className="h-8" />
                                    <Button size="sm" variant="secondary" onClick={() => {
                                        const num = parseInt(newChallengeId.trim());
                                        if (!isNaN(num)) { setTempChallengeIds(prev => prev.includes(num) ? prev : [...prev, num]); setNewChallengeId(""); }
                                    }}><Plus className="w-4 h-4" /></Button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {tempChallengeIds.map((cid, i) => (<Badge key={"pcid" + i} variant="secondary" className="gap-1">{cid}<X className="w-3 h-3 cursor-pointer" onClick={() => { setTempChallengeIds(prev => prev.filter((_, idx) => idx !== i)); }} /></Badge>))}
                                </div>
                            </div>

                            {/* Team IDs */}
                            <div className="space-y-2 mt-4">
                                <h4 className="font-medium">队伍 ID</h4>
                                <div className="flex items-center gap-2">
                                    <Input value={newTeamId} onChange={(e) => setNewTeamId(e.target.value)} placeholder="输入数字后 + 添加" className="h-8" />
                                    <Button size="sm" variant="secondary" onClick={() => {
                                        const num = parseInt(newTeamId.trim());
                                        if (!isNaN(num)) { setTempTeamIds(prev => prev.includes(num) ? prev : [...prev, num]); setNewTeamId(""); }
                                    }}><Plus className="w-4 h-4" /></Button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {tempTeamIds.map((tid, i) => (<Badge key={"ptid" + i} variant="secondary" className="gap-1">{tid}<X className="w-3 h-3 cursor-pointer" onClick={() => { setTempTeamIds(prev => prev.filter((_, idx) => idx !== i)); }} /></Badge>))}
                                </div>
                            </div>

                            {/* Status select */}
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

                            {/* Time range */}
                            <div className="space-y-2 mt-4">
                                <h4 className="font-medium">时间范围</h4>
                                <div className="flex items-center gap-1">
                                    <Input type="datetime-local" value={tempStartTime || ""} onChange={(e) => setTempStartTime(e.target.value || undefined)} className="h-8" />
                                    <span className="px-1">-</span>
                                    <Input type="datetime-local" value={tempEndTime || ""} onChange={(e) => setTempEndTime(e.target.value || undefined)} className="h-8" />
                                </div>
                            </div>

                            <DialogFooter className="mt-6">
                                <Button variant="secondary" onClick={() => setDialogOpen(false)}>取消</Button>
                                <Button onClick={() => {
                                    setChallengeNames(tempChallengeNames);
                                    setTeamNames(tempTeamNames);
                                    setJudgeStatuses(tempJudgeStatuses);
                                    setChallengeIds(tempChallengeIds);
                                    setTeamIds(tempTeamIds);
                                    setStartTime(tempStartTime);
                                    setEndTime(tempEndTime);
                                    setCurrentPage(1);
                                    setDialogOpen(false);
                                }}>应用</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </div>
    )
}