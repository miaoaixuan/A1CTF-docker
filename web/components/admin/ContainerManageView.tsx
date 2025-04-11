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

import { ArrowLeft, ArrowRight, ArrowUpDown, ChevronDown, MoreHorizontal, Pencil } from "lucide-react"

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

import { api, ContainerInfoModel, Role, UserInfoModel } from "@/utils/GZApi";
import { MacScrollbar } from "mac-scrollbar";
import { Avatar } from "@radix-ui/react-avatar";
import { AvatarFallback, AvatarImage } from "../ui/avatar";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import dayjs from "dayjs";

export type ContainerModel = {
    ID: string,
    TeamName: string,
    GameName: string,
    LifeCycle: string,
    Entry: string
}

export function ContainerManageView() {

    const [data, setData] = React.useState<ContainerModel[]>([])
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

    const [curPageData, setCurPageData] = React.useState<ContainerInfoModel[]>([])

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
            accessorKey: "TeamName",
            header: "TeamName",
            cell: ({ row }) => {    
                return (
                    <div>
                        {row.getValue("TeamName")}
                    </div>
                )
            },
        },
        {
            accessorKey: "GameName",
            header: "GameName",
            cell: ({ row }) => (
                <div>
                    { row.getValue("GameName") }
                </div>
            ),
        },
        {
            accessorKey: "LifeCycle",
            header: "LifeCycle",
            cell: ({ row }) => <div className="lowercase">{row.getValue("LifeCycle")}</div>,
        },
        {
            accessorKey: "ID",
            header: "ID",
            cell: ({ row }) => (
                <div>{row.getValue("ID")}</div>
            ),
        },
        {
            accessorKey: "Entry",
            header: "Entry",
            cell: ({ row }) => (
                <div>{row.getValue("Entry")}</div>
            ),
        },
        {
            id: "actions",
            header: "Action",
            enableHiding: false,
            cell: ({ row }) => {
                const payment = row.original
    
                return (
                    <div className="flex gap-2">
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Edit</span>
                            <Pencil />
                        </Button>
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" >
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => navigator.clipboard.writeText(payment.ID)}
                                >
                                    Copy payment ID
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>View customer</DropdownMenuItem>
                                <DropdownMenuItem>View payment details</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
        },
    ]

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
        table.setPageSize(pageSize)

        api.admin.adminInstances().then((res) => {

            setTotalCount(res.data.total ?? 0)
            setCurPageData(res.data.data)
            const data: ContainerModel[] = []
            res.data.data.forEach((container) => {
                data.push({
                    "Entry": `${container.ip}:${container.port}`,
                    "ID": container.containerId ?? "",
                    "LifeCycle": `${ dayjs(container.startedAt).format() } - ${ dayjs(container.expectStopAt).format() }`,
                    "GameName": container.challenge?.title ?? "",
                    "TeamName": container.team?.name ?? ""
                })
            })

            setData(data)
        })
    }, [curPage, pageSize])

    return (
        <MacScrollbar className="overflow-hidden w-full">
            <div className="w-full flex justify-center pb-10 pt-4">
                <div className="w-[80%]">
                    <div className="flex items-center justify-end space-x-2 select-none">
                        <div className="flex-1 text-sm text-muted-foreground flex items-center">
                            {table.getFilteredSelectedRowModel().rows.length} of{" "}
                            {table.getFilteredRowModel().rows.length} row(s) selected.
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
                            placeholder="Filter team names..."
                            value={(table.getColumn("TeamName")?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn("TeamName")?.setFilterValue(event.target.value)
                            }
                            className="max-w-sm"
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="ml-auto">
                                    Columns <ChevronDown />
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
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </MacScrollbar>
    )
}