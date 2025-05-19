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

import { ArrowLeft, ArrowRight, ArrowUpDown, ChevronDown, MoreHorizontal, PlayIcon, StopCircle, TimerIcon, CopyIcon, ClockIcon } from "lucide-react"

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

import { api, ErrorMessage } from "@/utils/ApiHelper";
import { MacScrollbar } from "mac-scrollbar";
import { Badge } from "../ui/badge";
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
import { AdminContainerItem, ContainerStatus } from "@/utils/A1API";
import { toast } from "sonner";
import dayjs from "dayjs";
import { 
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export type ContainerModel = {
    ID: string,
    TeamName: string,
    GameName: string,
    ChallengeName: string,
    Status: ContainerStatus,
    ExpireTime: Date,
    Ports: string
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

export function ContainerManageView() {
    const [data, setData] = React.useState<ContainerModel[]>([])
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

    const [pageSize, setPageSize] = React.useState(30);
    const [curPage, setCurPage] = React.useState(0);
    const [totalCount, setTotalCount] = React.useState(0);
    const [gameId, setGameId] = React.useState(1); // 默认游戏ID
    
    // 对话框状态
    const [confirmDialog, setConfirmDialog] = React.useState({
        isOpen: false,
        title: "",
        description: "",
        onConfirm: () => {},
    });
    

    // 处理容器删除
    const handleDeleteContainer = (containerId: string) => {
        setConfirmDialog({
            isOpen: true,
            title: "确认停止",
            description: "您确定要停止这个容器吗？",
            onConfirm: () => {
                toast.promise(
                    api.admin.adminDeleteContainer({ container_id: containerId }),
                    {
                        loading: '正在停止容器...',
                        success: (data) => {
                            fetchContainers(); // 刷新数据
                            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                            return '容器正在停止';
                        },
                        error: '停止容器失败'
                    }
                );
            }
        });
    };
    
    // 提交延长容器生命周期
    const submitExtendContainer = (containerId: string) => {
        toast.promise(
            api.admin.adminExtendContainer({
                container_id: containerId,
            }),
            {
                loading: '正在延长容器生命周期...',
                success: (response) => {
                    fetchContainers(); // 刷新数据
                    return '容器生命周期已延长';
                },
                error: '延长容器生命周期失败'
            }
        );
    };
    
    // 获取容器Flag
    const handleGetContainerFlag = (containerId: string) => {
        toast.promise(
            api.admin.adminGetContainerFlag({ container_id: containerId }),
            {
                loading: '正在获取容器Flag...',
                success: (response) => {
                    const flagContent = response.data.data.flag_content;
                    // 复制到剪贴板
                    navigator.clipboard.writeText(flagContent);
                    return `Flag已复制到剪贴板`;
                },
                error: '获取容器Flag失败'
            }
        );
    };

    // 获取状态对应的颜色和中文显示
    const getStatusColorAndText = (status: ContainerStatus) => {
        switch (status) {
            case ContainerStatus.ContainerRunning:
                return { color: "#52C41A", text: "运行中" };
            case ContainerStatus.ContainerStopped:
                return { color: "#8C8C8C", text: "已停止" };
            case ContainerStatus.ContainerStarting:
                return { color: "#1890FF", text: "启动中" };
            case ContainerStatus.ContainerError:
                return { color: "#FF4D4F", text: "错误" };
            case ContainerStatus.ContainerStopping:
                return { color: "#FAAD14", text: "停止中" };
            case ContainerStatus.ContainerQueueing:
                return { color: "#722ED1", text: "队列中" };
            case ContainerStatus.NoContainer:
                return { color: "#D9D9D9", text: "无容器" };
            default:
                return { color: "#D9D9D9", text: "未知" };
        }
    };

    const columns: ColumnDef<ContainerModel>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="全选"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="选择行"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "TeamName",
            header: "队伍名称",
            cell: ({ row }) => {    
                return (
                    <div className="flex gap-3 items-center">
                        {row.getValue("TeamName")}
                    </div>
                )
            },
        },
        {
            accessorKey: "ChallengeName",
            header: "题目名称",
            cell: ({ row }) => (
                <div>{row.getValue("ChallengeName")}</div>
            ),
        },
        {
            accessorKey: "Status",
            header: "状态",
            cell: ({ row }) => {
                const status = row.getValue("Status") as ContainerStatus;
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
            accessorKey: "ExpireTime",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        过期时间
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const expireTime = row.getValue("ExpireTime") as Date;
                return <div>{dayjs(expireTime).format('YYYY-MM-DD HH:mm:ss')}</div>
            },
            sortingFn: (rowA, rowB, columnId) => {
                const dateA = rowA.getValue(columnId) as Date;
                const dateB = rowB.getValue(columnId) as Date;
                return dateA.getTime() - dateB.getTime();
            }
        },
        {
            accessorKey: "Ports",
            header: "访问入口",
            cell: ({ row }) => (
                <div>{row.getValue("Ports")}</div>
            ),
        },
        {
            id: "actions",
            header: "操作",
            enableHiding: false,
            cell: ({ row }) => {
                const container = row.original;
                
                return (
                    <div className="flex gap-2">
                        <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleGetContainerFlag(container.ID)}
                            title="复制Flag"
                        >
                            <span className="sr-only">复制Flag</span>
                            <CopyIcon className="h-4 w-4" />
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
                                    onClick={() => navigator.clipboard.writeText(container.ID)}
                                >
                                    复制容器ID
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => submitExtendContainer(container.ID)}
                                    className="text-blue-600"
                                >
                                    <ClockIcon className="h-4 w-4 mr-2" />
                                    延长生命周期
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleDeleteContainer(container.ID)}
                                    className="text-red-600"
                                >
                                    <StopCircle className="h-4 w-4 mr-2" />
                                    停止容器
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
        },
    ]

    // 获取容器列表数据
    const fetchContainers = () => {
        api.admin.adminListContainers({ 
            game_id: gameId, 
            size: pageSize, 
            offset: pageSize * curPage 
        }).then((res: any) => {
            setTotalCount(res.data.total ?? 0);
            const formattedData: ContainerModel[] = res.data.data.map((item: AdminContainerItem) => {
                // 格式化端口信息为可读字符串
                let portsStr = "";
                if (item.container_ports && item.container_ports.length > 0) {
                    portsStr = item.container_ports.map(port => 
                        `${port.ip}:${port.port} (${port.port_name})`
                    ).join(", ");
                }
                
                return {
                    ID: item.container_id,
                    TeamName: item.team_name || "未知队伍",
                    GameName: item.game_name || "未知比赛",
                    ChallengeName: item.challenge_name || item.container_name || "未知题目",
                    Status: item.container_status,
                    ExpireTime: new Date(item.container_expiretime),
                    Ports: portsStr
                };
            });
            setData(formattedData);
        }).catch((err: any) => {
            toast.error("获取容器列表失败");
            console.error("获取容器列表失败:", err);
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
        fetchContainers();
    }, [curPage, pageSize, gameId]);

    return (
        <MacScrollbar className="overflow-hidden w-full">
            <div className="w-full flex justify-center pb-10 pt-4">
                <div className="w-[80%]">
                    <div className="flex items-center justify-end space-x-2 select-none">
                        <div className="flex-1 text-sm text-muted-foreground flex items-center">
                            {table.getFilteredSelectedRowModel().rows.length} / {" "}
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
                    <div className="flex items-center py-4">
                        <Input
                            placeholder="按队伍名称过滤..."
                            value={(table.getColumn("TeamName")?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn("TeamName")?.setFilterValue(event.target.value)
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
            
            {/* 确认对话框 */}
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