import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from 'components/ui/dialog';
import { Input } from 'components/ui/input';
import { ArrowLeft, ArrowRight, ArrowUpDown, Loader2 } from 'lucide-react';
import { Dispatch, memo, ReactNode, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'components/ui/table';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { api, ErrorMessage } from 'utils/ApiHelper';
import { ChallengeCategory, JudgeType, UserSimpleGameChallenge } from 'utils/A1API';
import { Button } from 'components/ui/button';
import { Checkbox } from 'components/ui/checkbox';
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';

export default function AddChallengeFromLibraryDialog(
    { setChallenges, gameID, isOpen, setIsOpen }: {
        setChallenges: Dispatch<SetStateAction<Record<string, UserSimpleGameChallenge[]>>>,
        gameID: number,
        isOpen: boolean,
        setIsOpen: Dispatch<SetStateAction<boolean>>
    }
) {

    type ChallengeSearchResult = {
        ChallengeID: number,
        Category: string,
        Name: string,
        CreateTime: string,
        GameID: number
    }

    const [addChallengeInput, setAddChallengeInput] = useState("")
    const curKeyWord = useRef("")
    const [searchResult, setSearchResult] = useState<ChallengeSearchResult[]>([])
    const [rowSelection, setRowSelection] = useState({})
    const [loadingHover, setLoadingHover] = useState(false)
    const lastInputTime = useRef(0)

    const [curPage, setCurPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const setInputState = (value: string) => {
        setAddChallengeInput(value)
        curKeyWord.current = value
        if (lastInputTime.current == 0) setLoadingHover(true)
        lastInputTime.current = dayjs().valueOf()
    }

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
                    <Button
                        variant={"outline"}
                        size={"sm"}
                        type="button"
                        className="select-none"
                        onClick={() => handleAddChallenge(data)}
                    >Select</Button>
                )
            },
        },
    ]

    const handleAddChallenge = useCallback((data: ChallengeSearchResult) => {
        api.admin.addGameChallenge(data.GameID, data.ChallengeID).then((res) => {
            const challenge = res.data.data
            const category: string = challenge.category?.toLocaleLowerCase() as string
            const newSimpleChallenge: UserSimpleGameChallenge = {
                challenge_id: challenge.challenge_id ?? 0,
                challenge_name: challenge.challenge_name ?? "",
                category: challenge.category || ChallengeCategory.MISC,
                total_score: challenge.total_score ?? 0,
                cur_score: challenge.cur_score ?? 0,
                solve_count: challenge.solve_count || 0,
                visible: false,
            }
            setChallenges((prev) => ({
                ...prev,
                [category]: [...(prev[category] || []), newSimpleChallenge]
            }))
            toast.success("题目添加成功")
        }).catch((err: AxiosError) => {
            const errorMessage: ErrorMessage = err.response?.data as ErrorMessage
            if (err.response?.status == 409) {
                toast.error("此题目已经添加到比赛中了")
            } else {
                toast.error(errorMessage.message)
            }
        })
    }, [setChallenges])

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

    useEffect(() => {
        if (isOpen) {
            setLoadingHover(true)
            api.admin.searchChallenges({ keyword: curKeyWord.current }).then((res) => {
                setSearchResult(res.data.data.map((c) => ({
                    "Category": c.category,
                    "ChallengeID": c.challenge_id || 0,
                    "Name": c.name,
                    "GameID": gameID,
                    "CreateTime": c.create_time
                })))
                setTotalCount(res.data.data.length)
                setLoadingHover(false)
            })
        }
    }, [isOpen])

    console.log("ReRender")

    return (
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
    )
}

AddChallengeFromLibraryDialog.whyDidYouRender = true