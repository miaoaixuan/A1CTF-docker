"use client";

import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"

import { ArrowLeft, ArrowRight, ArrowUpDown, ChevronDown, MoreHorizontal, Pencil, LockIcon, CheckIcon, TrashIcon, UnlockIcon, ClipboardList } from "lucide-react"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { MacScrollbar } from "mac-scrollbar";

import { Badge } from "../ui/badge";
import { AdminListTeamItem, ParticipationStatus, UserGameSimpleInfo } from "@/utils/A1API";

import { api, ErrorMessage } from "@/utils/ApiHelper";
import AvatarUsername from "../modules/AvatarUsername";
import { toast } from "sonner";
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"
import { AxiosResponse } from "axios";

export type TeamModel = {
    team_id: number,
    team_name: string,
    team_avatar: string | null,
    team_slogan: string | null,
    members: {
        avatar: string | null,
        user_name: string,
        user_id: string
    }[],
    status: ParticipationStatus,
    score: number
}

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description
}) => {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>确认</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export function TeamManageView() {
    const [data, setData] = React.useState<TeamModel[]>([])
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    )
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

    const [pageSize, setPageSize] = React.useState(30);
    const [curPage, setCurPage] = React.useState(0);
    const [totalCount, setTotalCount] = React.useState(0);
    const [gameId, setGameId] = React.useState(1);
    
    // 比赛选择相关状态
    const [games, setGames] = React.useState<UserGameSimpleInfo[]>([]);
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");
    
    // 对话框状态
    const [confirmDialog, setConfirmDialog] = React.useState({
        isOpen: false,
        title: "",
        description: "",
        onConfirm: () => {},
    });

    // 获取比赛列表
    const fetchGames = () => {
        api.admin.listGames({ size: 100, offset: 0 }).then((res: AxiosResponse<{ code: number; data: UserGameSimpleInfo[] }>) => {
            if (res.data.code === 200) {
                setGames(res.data.data);
            } else {
                toast.error("获取比赛列表失败");
            }
        }).catch((err: Error) => {
            toast.error("获取比赛列表失败");
            console.error("获取比赛列表失败:", err);
        });
    };

    // 在组件加载时获取比赛列表
    React.useEffect(() => {
        fetchGames();
    }, []);

    // 处理队伍状态变更
    const handleUpdateTeamStatus = (teamId: number, action: 'approve' | 'ban' | 'unban') => {
        // 根据不同操作调用不同API
        let apiCall;
        let loadingMessage;
        
        switch(action) {
            case 'approve':
                apiCall = api.admin.adminApproveTeam({ team_id: teamId, game_id: gameId });
                loadingMessage = '正在批准队伍...';
                break;
            case 'ban':
                apiCall = api.admin.adminBanTeam({ team_id: teamId, game_id: gameId });
                loadingMessage = '正在锁定队伍...';
                break;
            case 'unban':
                apiCall = api.admin.adminUnbanTeam({ team_id: teamId, game_id: gameId });
                loadingMessage = '正在解锁队伍...';
                break;
        }
            
        // 使用toast.promise包装API调用
        toast.promise(apiCall, {
            loading: loadingMessage,
            success: (data) => {
                fetchTeams(); // 刷新数据
                return '队伍状态已更新';
            },
            error: '更新队伍状态失败'
        });
    };

    // 处理队伍删除
    const handleDeleteTeam = (teamId: number) => {
        setConfirmDialog({
            isOpen: true,
            title: "确认删除",
            description: "您确定要删除这个队伍吗？此操作不可逆。",
            onConfirm: () => {
                toast.promise(
                    api.admin.adminDeleteTeam({ team_id: teamId, game_id: gameId }),
                    {
                        loading: '正在删除队伍...',
                        success: (data) => {
                            fetchTeams(); // 刷新数据
                            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                            return '队伍已删除';
                        },
                        error: '删除队伍失败'
                    }
                );
            }
        });
    };

    // 设置队伍为已批准状态
    const handleApproveTeam = (teamId: number) => {
        handleUpdateTeamStatus(teamId, 'approve');
    };

    // 设置队伍为已禁赛状态
    const handleBanTeam = (teamId: number) => {
        setConfirmDialog({
            isOpen: true,
            title: "确认锁定",
            description: "您确定要锁定这个队伍吗？这将禁止他们参与比赛。",
            onConfirm: () => {
                handleUpdateTeamStatus(teamId, 'ban');
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
        });
    };
    
    // 设置队伍从禁赛状态解锁
    const handleUnbanTeam = (teamId: number) => {
        setConfirmDialog({
            isOpen: true,
            title: "确认解锁",
            description: "您确定要解锁这个队伍吗？这将允许他们继续参与比赛。",
            onConfirm: () => {
                handleUpdateTeamStatus(teamId, 'unban');
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // 获取状态对应的颜色和中文显示
    const getStatusColorAndText = (status: ParticipationStatus) => {
        switch (status) {
            case ParticipationStatus.Approved:
                return { color: "#52C41A", text: "已审核" };
            case ParticipationStatus.Pending:
                return { color: "#FAAD14", text: "待审核" };
            case ParticipationStatus.Banned:
                return { color: "#FF4D4F", text: "已禁赛" };
            case ParticipationStatus.Rejected:
                return { color: "#F5222D", text: "已拒绝" };
            case ParticipationStatus.Participated:
                return { color: "#1890FF", text: "已参加" };
            default:
                return { color: "#D9D9D9", text: "未报名" };
        }
    };

    const columns: ColumnDef<TeamModel>[] = [
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
            accessorKey: "team_name",
            header: "队伍名称",
            cell: ({ row }) => {
                const avatar_url = row.original.team_avatar;
                return (
                    <div className="flex gap-3 items-center">
                        <AvatarUsername avatar_url={avatar_url} username={row.getValue("team_name") as string} />
                        {row.getValue("team_name")}
                    </div>
                )
            },
        },
        {
            accessorKey: "status",
            header: "状态",
            cell: ({ row }) => {
                const status = row.getValue("status") as ParticipationStatus;
                const { color, text } = getStatusColorAndText(status);
                return (
                    <Badge 
                        className="capitalize w-[60px] px-[5px] flex justify-center select-none"
                        style={{ backgroundColor: color }}
                    >
                        {text}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "score",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        分数
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div>{row.getValue("score")}</div>,
        },
        {
            accessorKey: "members",
            header: "队伍成员",
            cell: ({ row }) => {
                const members = row.original.members;
                return (
                    <div className="flex flex-wrap gap-2">
                        {members.map((member, index) => (
                            <div key={index} className="flex items-center gap-1"
                                data-tooltip-id="my-tooltip"
                                data-tooltip-content={member.user_name}
                                data-tooltip-place="top"
                            >
                                <AvatarUsername 
                                    avatar_url={member.avatar} 
                                    username={member.user_name} 
                                />
                            </div>
                        ))}
                    </div>
                )
            },
        },
        {
            accessorKey: "team_slogan",
            header: "队伍口号",
            cell: ({ row }) => <div>{row.getValue("team_slogan") || "暂无"}</div>,
        },
        {
            id: "actions",
            header: "操作",
            enableHiding: false,
            cell: ({ row }) => {
                const team = row.original;
                
                return (
                    <div className="flex gap-2">
                        <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleApproveTeam(team.team_id)}
                            disabled={team.status !== ParticipationStatus.Pending}
                            data-tooltip-id="my-tooltip"
                            data-tooltip-content="批准队伍"
                            data-tooltip-place="top"
                        >
                            <span className="sr-only">批准</span>
                            <CheckIcon className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">打开菜单</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" >
                                <DropdownMenuLabel>操作</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => navigator.clipboard.writeText(team.team_id.toString())}
                                >
                                    <ClipboardList className="h-4 w-4 mr-2" />
                                    复制队伍ID
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleBanTeam(team.team_id)}
                                    disabled={team.status === ParticipationStatus.Banned}
                                    className="text-amber-600"
                                >
                                    <LockIcon className="h-4 w-4 mr-2" />
                                    锁定队伍
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleUnbanTeam(team.team_id)}
                                    disabled={team.status !== ParticipationStatus.Banned}
                                    className="text-green-600"
                                >
                                    <UnlockIcon className="h-4 w-4 mr-2" />
                                    解锁队伍
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleDeleteTeam(team.team_id)}
                                    className="text-red-600"
                                >
                                    <TrashIcon className="h-4 w-4 mr-2" />
                                    删除队伍
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
        },
    ]

    // 获取队伍列表数据
    const fetchTeams = () => {
        api.admin.adminListTeams({ 
            game_id: gameId, 
            size: pageSize, 
            offset: pageSize * curPage 
        }).then((res) => {
            setTotalCount(res.data.total ?? 0);
            const formattedData: TeamModel[] = res.data.data.map(item => ({
                team_id: item.team_id,
                team_name: item.team_name,
                team_avatar: item.team_avatar || null,
                team_slogan: item.team_slogan || null,
                members: item.members.map(member => ({
                    avatar: member.avatar || null,
                    user_name: member.user_name,
                    user_id: member.user_id
                })),
                status: item.status,
                score: item.score
            }));
            setData(formattedData);
        }).catch((err) => {
            toast.error("获取队伍列表失败");
            console.error("获取队伍列表失败:", err);
        });
    };

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    React.useEffect(() => {
        table.setPageSize(pageSize);
        fetchTeams();
    }, [curPage, pageSize, gameId]);

    return (
        <MacScrollbar className="overflow-hidden w-full">
            <div className="w-full flex justify-center pb-10 pt-4">
                <div className="w-[80%]">
                    <div className="flex items-center justify-between space-x-2 select-none mb-4">
                        <div className="flex items-center space-x-2">
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={open}
                                        className="w-[300px] justify-between"
                                    >
                                        {gameId
                                            ? games.find((game) => game.game_id === gameId)?.name
                                            : "选择比赛..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                        <CommandInput 
                                            placeholder="搜索比赛..." 
                                            value={searchValue}
                                            onValueChange={setSearchValue}
                                        />
                                        <CommandEmpty>未找到比赛</CommandEmpty>
                                        <CommandGroup>
                                            {games
                                                .filter(game => 
                                                    game.name.toLowerCase().includes(searchValue.toLowerCase())
                                                )
                                                .map((game) => (
                                                    <CommandItem
                                                        key={game.game_id}
                                                        value={game.name}
                                                        onSelect={() => {
                                                            setGameId(game.game_id);
                                                            setOpen(false);
                                                            setSearchValue("");
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                gameId === game.game_id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {game.name}
                                                    </CommandItem>
                                                ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="flex-1 text-sm text-muted-foreground flex items-center">
                                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                                {table.getFilteredRowModel().rows.length} 行已选择
                            </div>
                            <div className="flex gap-3 items-center">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setCurPage( curPage - 1 )}
                                    disabled={ curPage == 0 }
                                >
                                    <ArrowLeft />
                                </Button>
                                <div className="text-sm text-muted-foreground">
                                    {curPage + 1} / {Math.ceil(totalCount / pageSize)}
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setCurPage( curPage + 1 )}
                                    disabled={ curPage >= Math.ceil(totalCount / pageSize) - 1 }
                                >
                                    <ArrowRight />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center py-4">
                        <Input
                            placeholder="按队伍名称过滤..."
                            value={(table.getColumn("team_name")?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn("team_name")?.setFilterValue(event.target.value)
                            }
                            className="max-w-sm"
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="ml-auto">
                                    列 <ChevronDown />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="select-none">
                                { table
                                    .getAllColumns()
                                    .filter((column) => column.getCanHide())
                                    .map((column) => {
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(!!value)
                                                }
                                            >
                                                {column.id}
                                            </DropdownMenuCheckboxItem>
                                        )
                                    }) }
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
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
                                            暂无数据
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                description={confirmDialog.description}
            />
        </MacScrollbar>
    )
}