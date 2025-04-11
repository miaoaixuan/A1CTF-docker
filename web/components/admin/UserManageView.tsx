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

import { api, Role, UserInfoModel } from "@/utils/GZApi";
import { MacScrollbar } from "mac-scrollbar";
import { Avatar } from "@radix-ui/react-avatar";
import { AvatarFallback, AvatarImage } from "../ui/avatar";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";

export type UserModel = {
    id: string,
    Role: "admin" | "monitor" | "user",
    Email: string,
    Username: string,
    StudentID: string,
    RealName: string,
    IP: string
}

export function UserManageView() {

    const [data, setData] = React.useState<UserModel[]>([])
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

    const [curPageData, setCurPageData] = React.useState<UserInfoModel[]>([])

    const columns: ColumnDef<UserModel>[] = [
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
            accessorKey: "Username",
            header: "Username",
            cell: ({ row }) => {
                const avatar_url = curPageData.find((user) => user.email == row.getValue("Email"))?.avatar
    
                return (
                    <div className="flex gap-3 items-center">
                        <Avatar className="select-none w-[35px] h-[35px]">
                            { avatar_url ? (
                                <>
                                    <AvatarImage src={avatar_url || "#"} alt="@shadcn"
                                        className={`rounded-2xl`}
                                    />
                                    <AvatarFallback><Skeleton className="h-full w-full rounded-full" /></AvatarFallback>
                                </>
                            ) : ( 
                                <div className='w-full h-full bg-foreground/80 flex items-center justify-center rounded-2xl'>
                                    <span className='text-background text-md'> { (row.getValue("Username") as string).substring(0, 2) } </span>
                                </div>
                            ) }
                        </Avatar>
                        {row.getValue("Username")}
                    </div>
                )
            },
        },
        {
            accessorKey: "Role",
            header: "Role",
            cell: ({ row }) => (
                <Badge 
                    className="capitalize w-[50px] flex justify-center select-none"
                    style={{
                        backgroundColor: row.getValue("Role") == "admin" ? "#FF4D4F" : row.getValue("Role") == "monitor" ? "#1890FF" : "#52C41A"
                    }}
                >
                    { row.getValue("Role") }
                </Badge>
            ),
        },
        {
            accessorKey: "Email",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Email
                        <ArrowUpDown />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="lowercase">{row.getValue("Email")}</div>,
        },
        {
            accessorKey: "IP",
            header: "IP",
            cell: ({ row }) => (
                <div>{row.getValue("IP")}</div>
            ),
        },
        {
            accessorKey: "RealName",
            header: "RealName",
            cell: ({ row }) => (
                <div>{row.getValue("RealName")}</div>
            ),
        },
        {
            accessorKey: "StudentID",
            header: "StudentID",
            cell: ({ row }) => (
                <div>{row.getValue("StudentID")}</div>
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
                                    onClick={() => navigator.clipboard.writeText(payment.id)}
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
        api.admin.adminUsers({ count: pageSize, skip: pageSize * curPage }).then((res) => {
            setTotalCount(res.data.total ?? 0)
            setCurPageData(res.data.data)
            const data: UserModel[] = []
            res.data.data.forEach((user) => {
                data.push({
                    "Email": user.email ?? "",
                    "id": user.id ?? "",
                    "IP": user.ip ?? "",
                    "RealName": user.realName?? "",
                    "Role": user.role == Role.Admin ? "admin" : user.role == Role.Monitor ? "monitor" : "user",
                    "StudentID": user.stdNumber ?? "",
                    "Username": user.userName ?? ""
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
                            placeholder="Filter emails..."
                            value={(table.getColumn("Email")?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn("Email")?.setFilterValue(event.target.value)
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