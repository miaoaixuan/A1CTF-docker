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

import { ArrowLeft, ArrowRight, ArrowUpDown, ChevronDown, MoreHorizontal, CopyIcon, ClockIcon, ClipboardList, ZapOff, RefreshCw } from "lucide-react"

import * as React from "react"

import { Button } from "components/ui/button"
import { Checkbox } from "components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "components/ui/dropdown-menu"

import { Input } from "components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "components/ui/table"

import { api } from "utils/ApiHelper";
import { Badge } from "../../ui/badge";
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "components/ui/alert-dialog";
import { AdminContainerItem, ContainerStatus } from "utils/A1API";
import { toast } from 'react-toastify/unstyled';
import dayjs from "dayjs";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "components/ui/hover-card"

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

export function ContainerManageView({ 
    gameId,
    challengeID = undefined
}: { 
    gameId: number,
    challengeID?: number | undefined
}) {
    const [data, setData] = React.useState<ContainerModel[]>([])
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

    const [pageSize, setPageSize] = React.useState(30);
    const [curPage, setCurPage] = React.useState(0);
    const [totalCount, setTotalCount] = React.useState(0);

    const [searchKeyword, setSearchKeyword] = React.useState("");
    const [debouncedSearchKeyword, setDebouncedSearchKeyword] = React.useState("");
    
    // 对话框状态
    const [confirmDialog, setConfirmDialog] = React.useState({
        isOpen: false,
        title: "",
        description: "",
        onConfirm: () => {},
    });
    
    // 防抖处理搜索关键词
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchKeyword(searchKeyword);
            setCurPage(0); // 重置到第一页
        }, 200); // 200ms 防抖延迟

        return () => clearTimeout(timer);
    }, [searchKeyword]);
    

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

    // 处理批量停止容器
    const handleBatchDeleteContainers = () => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        const selectedContainerIds = selectedRows.map(row => row.original.ID);
        
        if (selectedContainerIds.length === 0) {
            toast.error("请至少选择一个容器");
            return;
        }

        setConfirmDialog({
            isOpen: true,
            title: "确认批量停止",
            description: `您确定要停止选中的 ${selectedContainerIds.length} 个容器吗？`,
            onConfirm: () => {
                // 批量停止容器
                const promises = selectedContainerIds.map(containerId => 
                    api.admin.adminDeleteContainer({ container_id: containerId })
                );
                
                toast.promise(
                    Promise.allSettled(promises),
                    {
                        loading: `正在停止 ${selectedContainerIds.length} 个容器...`,
                        success: (results) => {
                            const successCount = results.filter(result => result.status === 'fulfilled').length;
                            const failCount = results.length - successCount;
                            
                            fetchContainers(); // 刷新数据
                            setRowSelection({}); // 清空选择
                            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                            
                            if (failCount === 0) {
                                return `成功停止 ${successCount} 个容器`;
                            } else {
                                return `成功停止 ${successCount} 个容器，${failCount} 个失败`;
                            }
                        },
                        error: '批量停止容器失败'
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
                return <div>{dayjs(expireTime).format('YYYY-MM-DD HH:mm:ss')} ({dayjs(expireTime).diff(dayjs(), 'minutes')}mins)</div>
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
            cell: ({ row }) => {
                const ports = row.getValue("Ports") as string;
                return (
                    <HoverCard openDelay={100} closeDelay={100}>
                        <HoverCardTrigger asChild>
                            <Button variant="link" className="px-0 py-0 h-auto font-normal select-none">
                                @links
                            </Button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80 p-4">
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">访问入口</h4>
                                {ports ? (
                                    <div className="text-sm">
                                        {ports.split(", ").map((port, index) => (
                                            <div key={index} className="flex items-center py-1 border-b border-gray-100 last:border-0">
                                                <span>{port}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 ml-auto"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(port.split(" ")[0])
                                                        toast.success("地址已复制到剪贴板")
                                                    }}
                                                >
                                                    <CopyIcon className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground">无可用链接</div>
                                )}
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                );
            },
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
                            data-tooltip-id="my-tooltip"
                            data-tooltip-content="复制Flag"
                            data-tooltip-place="top"
                        >
                            <span className="sr-only">复制Flag</span>
                            <CopyIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-red-600"
                            onClick={() => handleDeleteContainer(container.ID)}
                            data-tooltip-id="my-tooltip"
                            data-tooltip-content="停止容器"
                            data-tooltip-place="top"
                        >
                            <span className="sr-only">停止容器</span>
                            <ZapOff className="h-4 w-4" />
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
                                    <ClipboardList className="h-4 w-4 mr-2" />
                                    复制容器ID
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => submitExtendContainer(container.ID)}
                                    className="text-blue-600"
                                >
                                    <ClockIcon className="h-4 w-4 mr-2" />
                                    延长生命周期
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
        const payload: any = { 
            game_id: gameId, 
            size: pageSize, 
            offset: pageSize * curPage,
            challenge_id: challengeID ?? -1
        };
        
        // 如果有搜索关键词，添加到请求中
        if (debouncedSearchKeyword.trim()) {
            payload.search = debouncedSearchKeyword.trim();
        }
        
        api.admin.adminListContainers(payload).then((res: any) => {
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

    // 处理搜索
    const handleSearch = (value: string) => {
        setSearchKeyword(value);
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
    }, [curPage, pageSize, gameId, debouncedSearchKeyword]);

    return (
        <>
            <div className="w-full flex flex-col gap-4">
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
                <div className="flex items-center">
                    <Input
                        placeholder="按容器或队伍名称过滤..."
                        value={searchKeyword}
                        onChange={(event) => handleSearch(event.target.value)}
                        className="max-w-sm"
                    />
                    <div className="flex gap-2 ml-auto items-center">
                        <Button
                            variant="destructive"
                            className="select-none"
                            onClick={handleBatchDeleteContainers}
                            disabled={table.getFilteredSelectedRowModel().rows.length === 0}
                        >
                            <ZapOff className="h-4 w-4 mr-2" />
                            批量停止 ({table.getFilteredSelectedRowModel().rows.length})
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    显示项目 <ChevronDown />
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
                        <Button variant="outline" size={"icon"} onClick={() => fetchContainers()}>
                            <RefreshCw />
                        </Button>
                    </div>
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
            
            {/* 确认对话框 */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                description={confirmDialog.description}
            />
        </>
    )
}