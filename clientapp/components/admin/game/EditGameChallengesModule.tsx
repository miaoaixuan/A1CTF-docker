import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from 'components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from 'components/ui/alert-dialog';
import { Badge } from 'components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'components/ui/table';
import { useCallback, useEffect, useRef, useState } from 'react';

import { challengeCategoryIcons } from 'utils/ClientAssets';
import { api, ErrorMessage } from 'utils/ApiHelper';
import { Button } from 'components/ui/button';
import { ArrowLeft, ArrowRight, ArrowUpDown, Loader2, PlusCircle, Search, Trophy } from 'lucide-react';
import { Input } from 'components/ui/input';

import { AxiosError } from 'axios';

import { ChallengeCategory, AdminFullGameInfo, JudgeType } from 'utils/A1API';
import { useFieldArray, UseFormReturn } from 'react-hook-form';

import * as z from 'zod';
import { EditGameFormSchema } from './EditGameSchema';
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { Checkbox } from 'components/ui/checkbox';
import dayjs from 'dayjs';
import { toast } from 'react-toastify/unstyled';
import { MacScrollbar } from 'mac-scrollbar';
import { JudgeConfigForm } from './JudgeConfigForm';
import { useTheme } from 'next-themes';
import { GameChallengeForm } from './GameChallengeForm';


const cateIcon: { [key: string]: any } = challengeCategoryIcons;

export type ChallengeSearchResult = {
    ChallengeID: number,
    Category: string,
    Name: string,
    CreateTime: string,
    GameID: number
}

export default function EditGameChallengesModule(
    {
        game_info,
        form
    }: {
        game_info: AdminFullGameInfo,
        form: UseFormReturn<z.infer<typeof EditGameFormSchema>>
    }
) {

    const [isOpen, setIsOpen] = useState(false)

    const [addChallengeInput, setAddChallengeInput] = useState("")

    const curKeyWord = useRef("")
    const [searchResult, setSearchResult] = useState<ChallengeSearchResult[]>([])
    const [rowSelection, setRowSelection] = useState({})
    const [loadingHover, setLoadingHover] = useState(false)
    const lastInputTime = useRef(0)

    const [curPage, setCurPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const [curEditChallengeID, setCurEditChallengeID] = useState(0)
    const [isJudgeConfigOpen, setIsJudgeOpen] = useState(false)

    const setInputState = (value: string) => {
        setAddChallengeInput(value)
        curKeyWord.current = value
        if (lastInputTime.current == 0) setLoadingHover(true)
        lastInputTime.current = dayjs().valueOf()
    }

    const {
        fields: challengeFields,
        append: appendChallenge,
        remove: removeChallenge,
    } = useFieldArray({
        control: form.control,
        name: "challenges",
    });

    const { theme } = useTheme()

    const [searchContent, setSearchContent] = useState("")
    const [curChoicedCategory, setCurChoicedCategory] = useState("all")

    const filtedData = challengeFields.filter((chl) => {
        if (searchContent == "") return curChoicedCategory == "all" || chl.category?.toLowerCase() == curChoicedCategory;
        else return chl.challenge_name.toLowerCase().includes(searchContent.toLowerCase()) && (curChoicedCategory == "all" || chl.category?.toLowerCase() == curChoicedCategory)
    })

    // 删除解题记录相关状态
    const [isDeleteTeamSolveOpen, setIsDeleteTeamSolveOpen] = useState(false)
    const [currentChallengeId, setCurrentChallengeId] = useState(0)
    const [teamSearchTerm, setTeamSearchTerm] = useState('')
    const [teamSearchResults, setTeamSearchResults] = useState<{ team_id: number; team_name: string }[]>([])
    const [isSearchingTeams, setIsSearchingTeams] = useState(false)
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)

    // 清空解题记录确认对话框状态
    const [isClearSolvesAlertOpen, setIsClearSolvesAlertOpen] = useState(false)
    const [clearSolvesChallengeId, setClearSolvesChallengeId] = useState(0)

    const columns: ColumnDef<ChallengeSearchResult>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "ChallengeID",
            header: "ChallengeID",
            cell: ({ row }) => (
                <div>{row.getValue("ChallengeID")}</div>
            ),
        },
        {
            accessorKey: "Name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        type="button"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Name
                        <ArrowUpDown />
                    </Button>
                )
            },
            cell: ({ row }) => <div>{row.getValue("Name")}</div>,
        },
        {
            accessorKey: "CreateTime",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        type="button"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        CreateTime
                        <ArrowUpDown />
                    </Button>
                )
            },
            cell: ({ row }) => <div>{row.getValue("CreateTime")}</div>,
        },
        {
            accessorKey: "Category",
            header: "Category",
            cell: ({ row }) => (
                <div>{row.getValue("Category")}</div>
            ),
        },
        {
            id: "Actions",
            header: "Actions",
            enableHiding: false,
            cell: ({ row }) => {

                const data = row.original

                return (
                    <Button variant={"outline"} size={"sm"} type="button" className="select-none"
                        onClick={() => {
                            api.admin.addGameChallenge(data.GameID, data.ChallengeID).then((res) => {
                                const challenge = res.data.data
                                appendChallenge({
                                    challenge_id: challenge.challenge_id,
                                    challenge_name: challenge.challenge_name,
                                    category: challenge.category || ChallengeCategory.MISC,
                                    total_score: challenge.total_score,
                                    cur_score: challenge.cur_score,
                                    solve_count: challenge.solve_count || 0,
                                    belong_stage: null,
                                    hints: [],
                                    visible: false,
                                    judge_config: {
                                        judge_type: challenge.judge_config?.judge_type || JudgeType.DYNAMIC,
                                        judge_script: challenge.judge_config?.judge_script || "",
                                        flag_template: challenge.judge_config?.flag_template || "",
                                    },
                                    minimal_score: 200,
                                    enable_blood_reward: true
                                })
                                toast.success("题目添加成功")
                            })
                        }}
                    >Select</Button>
                )
            },
        },
    ]

    const table = useReactTable<ChallengeSearchResult>({
        data: searchResult,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
            rowSelection,
        },
    })

    // 搜索队伍
    const searchTeams = useCallback(async (searchTerm: string) => {
        if (!searchTerm.trim()) {
            setTeamSearchResults([]);
            return;
        }

        try {
            setIsSearchingTeams(true);
            const response = await api.admin.adminListTeams({
                game_id: game_info.game_id,
                size: 50,
                offset: 0,
                search: searchTerm
            });

            const teamList = response.data.data?.map((team: any) => ({
                team_id: team.team_id,
                team_name: team.team_name
            })) || [];

            setTeamSearchResults(teamList);
        } catch (error) {
            console.error('搜索队伍失败:', error);
            toast.error('搜索队伍失败');
        } finally {
            setIsSearchingTeams(false);
        }
    }, [game_info.game_id]);

    // 删除特定队伍的解题记录
    const handleDeleteTeamSolve = (challengeId: number) => {
        setCurrentChallengeId(challengeId);
        setIsDeleteTeamSolveOpen(true);
        setTeamSearchTerm('');
        setTeamSearchResults([]);
        setSelectedTeamId(null);
    };

    // 清空所有解题记录
    const handleClearAllSolves = (challengeId: number) => {
        setClearSolvesChallengeId(challengeId);
        setIsClearSolvesAlertOpen(true);
    };

    // 确认清空所有解题记录
    const confirmClearAllSolves = async () => {
        try {
            await api.admin.deleteChallengeSolves(game_info.game_id, clearSolvesChallengeId, {});
            toast.success('已清空所有解题记录');
            setIsClearSolvesAlertOpen(false);
        } catch (error: any) {
            console.error('清空解题记录失败:', error);
            toast.error('清空解题记录失败: ' + (error.response?.data?.message || error.message));
        }
    };

    // 确认删除特定队伍的解题记录
    const confirmDeleteTeamSolve = async () => {
        if (!selectedTeamId) {
            toast.error('请选择一个队伍');
            return;
        }

        try {
            await api.admin.deleteChallengeSolves(game_info.game_id, currentChallengeId, {
                team_id: selectedTeamId
            });
            toast.success('已删除队伍解题记录');
            setIsDeleteTeamSolveOpen(false);
        } catch (error: any) {
            console.error('删除队伍解题记录失败:', error);
            toast.error('删除队伍解题记录失败: ' + (error.response?.data?.message || error.message));
        }
    };

    useEffect(() => {
        table.setPageSize(5)
        const inputListener = setInterval(() => {
            const curTimeStamp = dayjs().valueOf()
            if (lastInputTime.current != 0 && (curTimeStamp - lastInputTime.current) > 500) {
                lastInputTime.current = 0
                api.admin.searchChallenges({ keyword: curKeyWord.current }).then((res) => {
                    setSearchResult(res.data.data.map((c) => ({
                        "Category": c.category,
                        "ChallengeID": c.challenge_id || 0,
                        "Name": c.name,
                        "GameID": game_info.game_id,
                        "CreateTime": c.create_time
                    })))
                    setTotalCount(res.data.data.length)
                    setLoadingHover(false)
                })
            }
        }, 200)

        return () => {
            clearInterval(inputListener)
        }
    }, [])

    // 队伍搜索防抖
    useEffect(() => {
        const timer = setTimeout(() => {
            if (teamSearchTerm) {
                searchTeams(teamSearchTerm);
            } else {
                setTeamSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [teamSearchTerm, searchTeams]);

    useEffect(() => {
        console.log("114514")
        if (isOpen) {
            setLoadingHover(true)
            api.admin.searchChallenges({ keyword: curKeyWord.current }).then((res) => {
                setSearchResult(res.data.data.map((c) => ({
                    "Category": c.category,
                    "ChallengeID": c.challenge_id || 0,
                    "Name": c.name,
                    "GameID": game_info.game_id,
                    "CreateTime": c.create_time
                })))
                setTotalCount(res.data.data.length)
                setLoadingHover(false)
            })
        }
    }, [isOpen])

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(status) => {
                setIsOpen(status)
            }}>
                <DialogContent className="sm:max-w-[825px]" onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader className="select-none">
                        <DialogTitle>搜索题目</DialogTitle>
                        <DialogDescription>
                            这会从题目库中搜索题目
                        </DialogDescription>
                    </DialogHeader>
                    <Input className="select-none" value={addChallengeInput} onChange={(e) => setInputState(e.target.value)} placeholder="在这里输入题目名字" />
                    <div className="rounded-md border relative h-[300px]">
                        {loadingHover && (
                            <div className="absolute top-0 left-0 w-full h-full bg-background opacity-95 z-10 flex items-center justify-center">
                                <div className="flex">
                                    <Loader2 className="animate-spin" />
                                    <span className="font-bold ml-3">搜索中...</span>
                                </div>
                            </div>
                        )}
                        <Table>
                            <TableHeader className="select-none">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead key={header.id}>
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                </TableHead>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="flex items-center justify-end space-x-2 select-none">
                        <div className="flex-1 text-sm text-muted-foreground flex items-center">
                            {table.getFilteredSelectedRowModel().rows.length} of{" "}
                            {table.getFilteredRowModel().rows.length} row(s) selected.
                        </div>
                        <div className="flex gap-3 items-center">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    setCurPage(curPage - 1)
                                    table.previousPage()
                                }}
                                disabled={curPage == 0}
                            >
                                <ArrowLeft />
                            </Button>
                            <div className="text-sm text-muted-foreground">
                                {curPage + 1} / {Math.ceil(totalCount / 5)}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    setCurPage(curPage + 1)
                                    table.nextPage()
                                }}
                                disabled={curPage >= Math.ceil(totalCount / 5) - 1}
                            >
                                <ArrowRight />
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isJudgeConfigOpen} onOpenChange={async (status) => {
                const checkResult = await form.trigger(`challenges.${curEditChallengeID}`)
                if (checkResult) setIsJudgeOpen(status)
                else {
                    toast.error("请检查题目设置是否正确")
                }
            }}>
                <DialogContent className="sm:max-w-[1225px] p-0" onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader className="select-none px-8 pt-8">
                        <DialogTitle>覆盖题目评测</DialogTitle>
                        <DialogDescription>
                            这里可以覆盖题目的评测设置, 编辑完成后直接关闭, 外面点保存即可
                        </DialogDescription>
                    </DialogHeader>
                    <MacScrollbar className="w-full max-h-[84vh] overflow-y-auto"
                        skin={theme == "light" ? "light" : "dark"}
                        trackStyle={(horizontal) => ({ [horizontal ? "height" : "width"]: 0, borderWidth: 0 })}
                        thumbStyle={(horizontal) => ({ [horizontal ? "height" : "width"]: 6 })}
                    >
                        <div className="flex flex-col gap-4 pl-8 pr-8 pb-8">
                            <JudgeConfigForm
                                control={form.control}
                                index={curEditChallengeID}
                                form={form}
                            />
                        </div>
                    </MacScrollbar>
                </DialogContent>
            </Dialog>

            {/* 删除队伍解题记录对话框 */}
            <Dialog open={isDeleteTeamSolveOpen} onOpenChange={setIsDeleteTeamSolveOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>删除队伍解题记录</DialogTitle>
                        <DialogDescription>
                            选择要删除解题记录的队伍
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">搜索队伍</label>
                            <Input
                                placeholder="输入队伍名称..."
                                value={teamSearchTerm}
                                onChange={(e) => setTeamSearchTerm(e.target.value)}
                                className="mt-1"
                            />
                        </div>

                        {teamSearchResults.length > 0 && (
                            <div className="border rounded-md max-h-60 overflow-y-auto">
                                {teamSearchResults.map((team) => (
                                    <div
                                        key={team.team_id}
                                        className={`p-3 cursor-pointer hover:bg-muted transition-colors ${selectedTeamId === team.team_id ? 'bg-primary/10 border-primary' : ''
                                            }`}
                                        onClick={() => setSelectedTeamId(team.team_id)}
                                    >
                                        <div className="font-medium">{team.team_name}</div>
                                        <div className="text-sm text-muted-foreground">ID: {team.team_id}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {isSearchingTeams && (
                            <div className="text-center py-4 text-muted-foreground">
                                搜索中...
                            </div>
                        )}

                        {teamSearchTerm && teamSearchResults.length === 0 && !isSearchingTeams && (
                            <div className="text-center py-4 text-muted-foreground">
                                未找到匹配的队伍
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsDeleteTeamSolveOpen(false)}>
                            取消
                        </Button>
                        <Button
                            onClick={confirmDeleteTeamSolve}
                            disabled={!selectedTeamId}
                            variant="destructive"
                        >
                            确认删除
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 清空解题记录确认对话框 */}
            <AlertDialog open={isClearSolvesAlertOpen} onOpenChange={setIsClearSolvesAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认清空解题记录</AlertDialogTitle>
                        <AlertDialogDescription>
                            确定要清空这道题的所有解题记录吗？此操作不可撤销！
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsClearSolvesAlertOpen(false)}>
                            取消
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmClearAllSolves} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            确认清空
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="mt-6">
                {/* Search Bar */}
                <div className="mb-6 flex w-full items-center">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={searchContent}
                            onChange={(e) => setSearchContent(e.target.value)}
                            placeholder="搜索题目..."
                            className="pl-10"
                        />
                    </div>
                    <div className='flex-1' />
                    <Button
                        type="button"
                        variant={"outline"}
                        size="sm"
                        className=""
                        onClick={() => setIsOpen(true)}
                    >
                        <PlusCircle className="h-4 w-4" />
                        添加题目
                    </Button>
                </div>

                <div className="flex gap-6">
                    {/* Categories Sidebar */}
                    <div className="w-64 flex-none">
                        <h3 className="font-semibold text-lg mb-4 text-foreground/90">分类筛选</h3>
                        <div className="space-y-1">
                            {Object.keys(cateIcon).map((cat, index) => (
                                <Button
                                    key={index}
                                    className={`w-full justify-start gap-3 h-11 transition-all duration-200 border ${curChoicedCategory === cat
                                        ? "bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30 text-primary shadow-sm"
                                        : "hover:bg-muted/60 hover:shadow-sm border-transparent"
                                        }`}
                                    variant="ghost"
                                    type="button"
                                    onClick={() => setCurChoicedCategory(cat)}
                                >
                                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${curChoicedCategory === cat ? "bg-primary/20" : "bg-muted/40"}`}>
                                        {cateIcon[cat]}
                                    </div>
                                    <span className="font-medium flex-1 text-left truncate">
                                        {cat === "all" ? "全部" : cat.substring(0, 1).toUpperCase() + cat.substring(1)}
                                    </span>
                                    <Badge
                                        variant="secondary"
                                        className={`h-6 px-2 text-xs font-semibold flex-shrink-0 ${curChoicedCategory === cat ? "bg-primary/20 text-primary" : ""
                                            }`}
                                    >
                                        {challengeFields.filter((res) => (cat == "all" || res.category?.toLowerCase() == cat)).length}
                                    </Badge>
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 overflow-hidden">
                        {filtedData.length > 0 ? (
                            <div className="overflow-y-auto">
                                <div className="p-4 pr-6">
                                    <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
                                        {filtedData.map((gameData, index) => (
                                            <GameChallengeForm
                                                key={index}
                                                control={form.control}
                                                form={form}
                                                gameData={gameData as any}
                                                index={challengeFields.findIndex((e) => e.id == gameData.id)}
                                                removeGameChallenge={removeChallenge}
                                                onEditChallenge={(idx) => {
                                                    setCurEditChallengeID(idx)
                                                    setIsJudgeOpen(true)
                                                }}
                                                handleDeleteTeamSolve={handleDeleteTeamSolve}
                                                handleClearAllSolves={handleClearAllSolves}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[700px] text-center p-8">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-muted/40 to-muted/20 flex items-center justify-center mb-4">
                                    {searchContent ? (
                                        <Search className="h-8 w-8 text-muted-foreground" />
                                    ) : (
                                        <Trophy className="h-8 w-8 text-muted-foreground" />
                                    )}
                                </div>
                                <h3 className="text-xl font-semibold mb-2">
                                    {searchContent ? "没有找到题目" : "还没有设置题目"}
                                </h3>
                                <p className="text-muted-foreground max-w-md">
                                    {searchContent
                                        ? `没有找到包含 "${searchContent}" 的题目`
                                        : "开始为比赛添加题目吧！"
                                    }
                                </p>
                                {searchContent && (
                                    <Button
                                        variant="ghost"
                                        onClick={() => setSearchContent("")}
                                        className="mt-4"
                                        type="button"
                                    >
                                        清除搜索
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}