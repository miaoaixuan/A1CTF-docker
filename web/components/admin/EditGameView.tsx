"use client";

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import { useFieldArray, Controller, useWatch } from "react-hook-form";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { Input } from "../ui/input";
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

import { ArrowLeft, ArrowRight, ArrowUpDown, CalendarIcon, CircleArrowLeft, Cloud, FileCode, Github, LoaderPinwheel, PlusCircle, Save, ScanBarcode, Squirrel, TableProperties, Tag, Underline, Upload } from "lucide-react"
import { Textarea } from "../ui/textarea";

import CodeEditor from '@uiw/react-textarea-code-editor';

import { BadgeCent, Binary, Bot, Bug, FileSearch, GlobeLock, HardDrive, MessageSquareLock, Radar, Smartphone, SquareCode } from "lucide-react"
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MacScrollbar } from "mac-scrollbar";
import { ChallengeConfig, GameInfo } from "@/utils/A1API";
import { api, ErrorMessage } from "@/utils/ApiHelper";
import dayjs from "dayjs";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch"
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { Badge } from "../ui/badge";

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

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { Label } from "@/components/ui/label"
import { Checkbox } from "../ui/checkbox";
import { size } from "mathjs";

interface GameStageFormProps {
    control: any;
    index: number;
    form: any,
    removeStage: (index: number) => void;
}

interface GameChallengeFormProps {
    control: any;
    index: number;
    form: any;
    removeGameChallenge: (index: number) => void;
}

function GameStageForm({ control, index, removeStage, form }: GameStageFormProps) {

    function handleDateSelect(date: Date | undefined, tm_type: "start_time" | "end_time") {
        if (date) {
            form.setValue(`stages.${index}.${tm_type}`, date);
        }
    }

    function handleTimeChange(type: "hour" | "minute", value: string, tm_type: "start_time" | "end_time") {
        const field_name = `stages.${index}.${tm_type}`;
        console.log(field_name)
        const currentDate = form.getValues(field_name) || new Date();
        let newDate = new Date(currentDate);

        if (type === "hour") {
            const hour = parseInt(value, 10);
            newDate.setHours(hour);
        } else if (type === "minute") {
            newDate.setMinutes(parseInt(value, 10));
        }

        console.log(newDate)
        form.setValue(field_name, newDate);
    }


    return (
        <div className="border p-6 mb-4 rounded-lg hover:shadow-lg transition-shadow duration-300 space-y-4">
            <div className="flex justify-between items-center mb-2">
                <span className="font-md font-semibold">阶段 {index + 1}</span>
                <Button variant="destructive" type="button" onClick={() => removeStage(index)}>
                    删除阶段
                </Button>
            </div>
            <FormField
                control={control}
                name={`stages.${index}.stage_name`}
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center h-[20px]">
                            <FormLabel>阶段名称</FormLabel>
                            <div className="flex-1" />
                            <FormMessage className="text-[14px]" />
                        </div>
                        <FormControl>
                            <Input {...field} value={field.value ?? ""} />
                        </FormControl>
                    </FormItem>
                )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name={`stages.${index}.start_time`}
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>开始时间</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(field.value, "MM/dd/yyyy HH:mm")
                                            ) : (
                                                <span>MM/DD/YYYY HH:mm</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <div className="sm:flex">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={(date) => handleDateSelect(date, "start_time")}
                                            initialFocus
                                        />
                                        <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                                            <ScrollArea className="w-64 sm:w-auto">
                                                <div className="flex sm:flex-col p-2">
                                                    {Array.from({ length: 24 }, (_, i) => i)
                                                        .reverse()
                                                        .map((hour) => (
                                                            <Button
                                                                key={hour}
                                                                size="icon"
                                                                variant={
                                                                    field.value && field.value.getHours() === hour
                                                                        ? "default"
                                                                        : "ghost"
                                                                }
                                                                className="sm:w-full shrink-0 aspect-square"
                                                                onClick={() =>
                                                                    handleTimeChange("hour", hour.toString(), "start_time")
                                                                }
                                                            >
                                                                {hour}
                                                            </Button>
                                                        ))}
                                                </div>
                                                <ScrollBar
                                                    orientation="horizontal"
                                                    className="sm:hidden"
                                                />
                                            </ScrollArea>
                                            <ScrollArea className="w-64 sm:w-auto">
                                                <div className="flex sm:flex-col p-2">
                                                    {Array.from({ length: 60 }, (_, i) => i).map(
                                                        (minute) => (
                                                            <Button
                                                                key={minute}
                                                                size="icon"
                                                                variant={
                                                                    field.value &&
                                                                        field.value.getMinutes() === minute
                                                                        ? "default"
                                                                        : "ghost"
                                                                }
                                                                className="sm:w-full shrink-0 aspect-square"
                                                                onClick={() =>
                                                                    handleTimeChange("minute", minute.toString(), "start_time")
                                                                }
                                                            >
                                                                {minute.toString().padStart(2, "0")}
                                                            </Button>
                                                        )
                                                    )}
                                                </div>
                                                <ScrollBar
                                                    orientation="horizontal"
                                                    className="sm:hidden"
                                                />
                                            </ScrollArea>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <FormDescription>
                                请选择这个阶段的开始时间
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name={`stages.${index}.end_time`}
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>结束时间</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(field.value, "MM/dd/yyyy HH:mm")
                                            ) : (
                                                <span>MM/DD/YYYY HH:mm</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <div className="sm:flex">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={(date) => handleDateSelect(date, "end_time")}
                                            initialFocus
                                        />
                                        <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                                            <ScrollArea className="w-64 sm:w-auto">
                                                <div className="flex sm:flex-col p-2">
                                                    {Array.from({ length: 24 }, (_, i) => i)
                                                        .reverse()
                                                        .map((hour) => (
                                                            <Button
                                                                key={hour}
                                                                size="icon"
                                                                variant={
                                                                    field.value && field.value.getHours() === hour
                                                                        ? "default"
                                                                        : "ghost"
                                                                }
                                                                className="sm:w-full shrink-0 aspect-square"
                                                                onClick={() =>
                                                                    handleTimeChange("hour", hour.toString(), "end_time")
                                                                }
                                                            >
                                                                {hour}
                                                            </Button>
                                                        ))}
                                                </div>
                                                <ScrollBar
                                                    orientation="horizontal"
                                                    className="sm:hidden"
                                                />
                                            </ScrollArea>
                                            <ScrollArea className="w-64 sm:w-auto">
                                                <div className="flex sm:flex-col p-2">
                                                    {Array.from({ length: 60 }, (_, i) => i).map(
                                                        (minute) => (
                                                            <Button
                                                                key={minute}
                                                                size="icon"
                                                                variant={
                                                                    field.value &&
                                                                        field.value.getMinutes() === minute
                                                                        ? "default"
                                                                        : "ghost"
                                                                }
                                                                className="sm:w-full shrink-0 aspect-square"
                                                                onClick={() =>
                                                                    handleTimeChange("minute", minute.toString(), "end_time")
                                                                }
                                                            >
                                                                {minute.toString().padStart(2, "0")}
                                                            </Button>
                                                        )
                                                    )}
                                                </div>
                                                <ScrollBar
                                                    orientation="horizontal"
                                                    className="sm:hidden"
                                                />
                                            </ScrollArea>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <FormDescription>
                                请选择这个阶段的结束时间
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
}

function GameChallengeForm({ control, index, form, removeGameChallenge }: GameChallengeFormProps) {

    return (
        <div className="border-[1px] rounded-lg h-full w-full shadow-md">

        </div>
    );
}

export type ChallengeSearchResult = {
    ChallengeID: number,
    Category: string,
    Name: string,
    CreateTime: string
}

export const columns: ColumnDef<ChallengeSearchResult>[] = [
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
            return (
                <Button variant={"outline"} size={"sm"} className="select-none" >Select</Button>
            )
        },
    },
]

export function EditGameView({ game_info, lng }: { game_info: GameInfo, lng: string }) {

    const categories: { [key: string]: any } = {
        "MISC": <Radar size={21} />,
        "CRYPTO": <MessageSquareLock size={21} />,
        "PWN": <Bug size={21} />,
        "WEB": <GlobeLock size={21} />,
        "REVERSE": <Binary size={21} />,
        "FORENSICS": <FileSearch size={21} />,
        "HARDWARE": <HardDrive size={21} />,
        "MOBILE": <Smartphone size={21} />,
        "PPC": <SquareCode size={21} />,
        "AI": <Bot size={21} />,
        "PENTENT": <BadgeCent size={21} />,
        "OSINT": <Github size={21} />
    };

    const formSchema = z.object({
        name: z.string().min(2, { message: "名字最短要两个字符" }),
        summary: z.string().optional(),
        description: z.string().optional(),
        poster: z.string().optional(),
        invite_code: z.string().optional(),
        start_time: z.date().optional(),
        end_time: z.date().optional(),
        practice_mode: z.boolean(),
        team_number_limit: z.number(),
        container_number_limit: z.number(),
        require_wp: z.boolean(),
        wp_expire_time: z.date().optional(),
        stages: z.array(
            z.object({
                stage_name: z.string().nonempty(),
                start_time: z.date(),
                end_time: z.date(),
            })
        ),
        visible: z.boolean(),
        challenges: z.array(
            z.object({
                challenge_id: z.number(),
                challenge_name: z.string(),
                category: z.enum(Object.keys(categories) as [string, ...string[]], {
                    errorMap: () => ({ message: "需要选择一个有效的题目类别" })
                }),
                judge_config: z.object({
                    judge_type: z.enum(["DYNAMIC", "SCRIPT"], {
                        errorMap: () => ({ message: "需要选择一个有效的题目类别" })
                    }),
                    judge_script: z.string().optional(),
                    flag_template: z.string().optional(),
                })
            })
        )
    });

    const env_to_string = (data: { name: string, value: string }[]) => {
        console.log(data)
        let env = ""
        data.forEach((item) => {
            env += `${item.name}=${item.value},`
        })
        return env.substring(0, env.length - 1)
    }

    const string_to_env = (data: string): { name: string, value: string }[] => {
        let env: { name: string, value: string }[] = []

        data.split(",").forEach((item) => {
            const [name, value] = item.split("=")
            env.push({ name, value })
        })

        return env
    }

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: game_info.name,
            summary: game_info.summary || "",
            description: game_info.description || "",
            poster: game_info.poster || "",
            invite_code: game_info.invite_code || "",
            start_time: game_info.start_time ? dayjs(game_info.start_time).toDate() : new Date(),
            end_time: game_info.end_time ? dayjs(game_info.end_time).toDate() : new Date(),
            practice_mode: game_info.practice_mode,
            team_number_limit: game_info.team_number_limit,
            container_number_limit: game_info.container_number_limit,
            require_wp: game_info.require_wp,
            wp_expire_time: game_info.wp_expire_time ? dayjs(game_info.wp_expire_time).toDate() : new Date(),
            visible: game_info.visible,
            stages: game_info.stages.map((stage) => ({
                stage_name: stage.stage_name,
                start_time: dayjs(stage.start_time).toDate(),
                end_time: dayjs(stage.end_time).toDate(),
            })),
            challenges: game_info.challenges?.map((challenge) => ({
                challenge_id: challenge.challenge_id,
                judge_config: {
                    judge_type: challenge.judge_config?.judge_type,
                    judge_script: challenge.judge_config?.judge_script || "",
                    flag_template: challenge.judge_config?.flag_template || "",
                }
            }))
        }
    })

    const {
        fields: challengeFields,
        append: appendChallenge,
        remove: removeChallenge,
    } = useFieldArray({
        control: form.control,
        name: "challenges",
    });

    const {
        fields: stageFields,
        append: appendStage,
        remove: removeStage,
    } = useFieldArray({
        control: form.control,
        name: "stages",
    });

    const [showScript, setShowScript] = useState(false);

    function onSubmit(values: z.infer<typeof formSchema>) {
        // const finalData = {
        //     attachments: values.attachments,
        //     category: values.category.toUpperCase(),
        //     challenge_id: challenge_info.challenge_id,
        //     container_config: values.container_config.map((e) => ({
        //         name: e.name,
        //         image: e.image,
        //         command: e.command != "" ? e.command : null,
        //         env: e.env != "" ? string_to_env(e.env || "") : [],
        //         expose_ports: e.expose_ports,
        //     })),
        //     create_time: challenge_info.create_time,
        //     description: values.description,
        //     judge_config: values.judge_config,
        //     name: values.name,
        //     type_: challenge_info.type_,
        // };
        // api.admin.updateChallenge(finalData as ChallengeConfig).then((res) => {
        //     toast.success("更新成功", { position: "top-center" })
        // }).catch((error: AxiosError) => {
        //     if (error.response?.status) {
        //         const errorMessage: ErrorMessage = error.response.data as ErrorMessage
        //         toast.error(errorMessage.message, { position: "top-center" })
        //     } else {
        //         toast.error("Unknow Error", { position: "top-center" })
        //     }
        // })
    }

    const colorMap: { [key: string]: string } = {
        "misc": "rgb(32, 201, 151)",
        "crypto": "rgb(132, 94, 247)",
        "pwn": "rgb(255, 107, 107)",
        "web": "rgb(51, 154, 240)",
        "reverse": "rgb(252, 196, 25)",
        "forensics": "rgb(92, 124, 250)",
        "hardware": "rgb(208, 208, 208)",
        "mobile": "rgb(240, 101, 149)",
        "ppc": "rgb(34, 184, 207)",
        "ai": "rgb(148, 216, 45)",
        "pentent": "rgb(204, 93, 232)",
        "osint": "rgb(255, 146, 43)"
    };

    const cateIcon: { [key: string]: any } = {
        "all": <Squirrel size={23} />,
        "misc": <Radar size={23} />,
        "crypto": <MessageSquareLock size={23} />,
        "pwn": <Bug size={23} />,
        "web": <GlobeLock size={23} />,
        "reverse": <Binary size={23} />,
        "forensics": <FileSearch size={23} />,
        "hardware": <HardDrive size={23} />,
        "mobile": <Smartphone size={23} />,
        "PPC": <SquareCode size={23} />,
        "ai": <Bot size={23} />,
        "pentent": <BadgeCent size={23} />,
        "osint": <Github size={23} />
    };

    const [searchContent, setSearchContent] = useState("")
    const [curChoicedCategory, setCurChoicedCategory] = useState("all")

    const router = useRouter()

    const filtedData = challengeFields.filter((chl) => {
        if (searchContent == "") return curChoicedCategory == "all" || chl.category?.toLowerCase() == curChoicedCategory;
        else return chl.challenge_name.toLowerCase().includes(searchContent.toLowerCase()) && (curChoicedCategory == "all" || chl.category?.toLowerCase() == curChoicedCategory)
    })

    const curKeyWord = useRef("")
    const [addChallengeInput, setAddChallengeInput] = useState("")
    const [searchResult, setSearchResult] = useState<ChallengeSearchResult[]>([])
    const [rowSelection, setRowSelection] = useState({})
    const [loadingHover, setLoadingHover] = useState(false)
    const lastInputTime = useRef(0)

    const [curPage, setCurPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

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

    const [isOpen, setIsOpen] = useState(false)

    const setInputState = (value: string) => {
        setAddChallengeInput(value)
        curKeyWord.current = value
        if (lastInputTime.current == 0) setLoadingHover(true)
        lastInputTime.current = dayjs().valueOf()
    }

    useEffect(() => {
        table.setPageSize(5)
        let inputListener = setInterval(() => {
            const curTimeStamp = dayjs().valueOf()
            if (lastInputTime.current != 0 && (curTimeStamp - lastInputTime.current) > 500) {
                lastInputTime.current = 0
                api.admin.searchChallenges({ keyword: curKeyWord.current }).then((res) => {
                    setSearchResult(res.data.data.map((c) => ({
                        "Category": c.category,
                        "ChallengeID": c.challenge_id || 0,
                        "Name": c.name,
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


    function handleDateSelect(date: Date | undefined, tm_type: "start_time" | "end_time" | "wp_expire_time") {
        if (date) {
            form.setValue(tm_type, date);
        }
    }

    function handleTimeChange(type: "hour" | "minute", value: string, tm_type: "start_time" | "end_time" | "wp_expire_time") {
        const field_name = tm_type;
        const currentDate = form.getValues(field_name) || new Date();
        let newDate = new Date(currentDate);

        if (type === "hour") {
            const hour = parseInt(value, 10);
            newDate.setHours(hour);
        } else if (type === "minute") {
            newDate.setMinutes(parseInt(value, 10));
        }

        form.setValue(field_name, newDate);
    }

    return (
        <div className="absolute w-screen h-screen bg-background items-center justify-center flex select-none overflow-x-hidden overflow-hidden">
            <Form {...form}>
                <MacScrollbar className="h-full w-full flex flex-col items-center">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-20 pt-20 w-[80%] flex flex-col">
                        <div className="flex">
                            <Button type="button" variant={"default"} onClick={() => {
                                router.push(`/${lng}/admin/challenges`)
                            }}>
                                <CircleArrowLeft />
                                Back to games
                            </Button>
                        </div>
                        <span className="text-3xl font-bold">Edit - {game_info.name}</span>
                        <span className="text-lg font-semibold">基本信息</span>
                        <div className="flex gap-10 items-center">
                            <div className="w-1/3">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center h-[20px]">
                                                <FormLabel>比赛名称</FormLabel>
                                                <div className="flex-1" />
                                                <FormMessage className="text-[14px]" />
                                            </div>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                请填写比赛名称
                                            </FormDescription>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="w-1/3">
                                <FormField
                                    control={form.control}
                                    name={`start_time`}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>开始时间</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "MM/dd/yyyy HH:mm")
                                                            ) : (
                                                                <span>MM/DD/YYYY HH:mm</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <div className="sm:flex">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={(date) => handleDateSelect(date, "start_time")}
                                                            initialFocus
                                                        />
                                                        <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                                                            <ScrollArea className="w-64 sm:w-auto">
                                                                <div className="flex sm:flex-col p-2">
                                                                    {Array.from({ length: 24 }, (_, i) => i)
                                                                        .reverse()
                                                                        .map((hour) => (
                                                                            <Button
                                                                                key={hour}
                                                                                size="icon"
                                                                                variant={
                                                                                    field.value && field.value.getHours() === hour
                                                                                        ? "default"
                                                                                        : "ghost"
                                                                                }
                                                                                className="sm:w-full shrink-0 aspect-square"
                                                                                onClick={() =>
                                                                                    handleTimeChange("hour", hour.toString(), "start_time")
                                                                                }
                                                                            >
                                                                                {hour}
                                                                            </Button>
                                                                        ))}
                                                                </div>
                                                                <ScrollBar
                                                                    orientation="horizontal"
                                                                    className="sm:hidden"
                                                                />
                                                            </ScrollArea>
                                                            <ScrollArea className="w-64 sm:w-auto">
                                                                <div className="flex sm:flex-col p-2">
                                                                    {Array.from({ length: 60 }, (_, i) => i).map(
                                                                        (minute) => (
                                                                            <Button
                                                                                key={minute}
                                                                                size="icon"
                                                                                variant={
                                                                                    field.value &&
                                                                                        field.value.getMinutes() === minute
                                                                                        ? "default"
                                                                                        : "ghost"
                                                                                }
                                                                                className="sm:w-full shrink-0 aspect-square"
                                                                                onClick={() =>
                                                                                    handleTimeChange("minute", minute.toString(), "start_time")
                                                                                }
                                                                            >
                                                                                {minute.toString().padStart(2, "0")}
                                                                            </Button>
                                                                        )
                                                                    )}
                                                                </div>
                                                                <ScrollBar
                                                                    orientation="horizontal"
                                                                    className="sm:hidden"
                                                                />
                                                            </ScrollArea>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            <FormDescription>
                                                请选择比赛开始时间
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="w-1/3">
                                <FormField
                                    control={form.control}
                                    name={`end_time`}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>结束时间</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "MM/dd/yyyy HH:mm")
                                                            ) : (
                                                                <span>MM/DD/YYYY HH:mm</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <div className="sm:flex">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={(date) => handleDateSelect(date, "end_time")}
                                                            initialFocus
                                                        />
                                                        <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                                                            <ScrollArea className="w-64 sm:w-auto">
                                                                <div className="flex sm:flex-col p-2">
                                                                    {Array.from({ length: 24 }, (_, i) => i)
                                                                        .reverse()
                                                                        .map((hour) => (
                                                                            <Button
                                                                                key={hour}
                                                                                size="icon"
                                                                                variant={
                                                                                    field.value && field.value.getHours() === hour
                                                                                        ? "default"
                                                                                        : "ghost"
                                                                                }
                                                                                className="sm:w-full shrink-0 aspect-square"
                                                                                onClick={() =>
                                                                                    handleTimeChange("hour", hour.toString(), "end_time")
                                                                                }
                                                                            >
                                                                                {hour}
                                                                            </Button>
                                                                        ))}
                                                                </div>
                                                                <ScrollBar
                                                                    orientation="horizontal"
                                                                    className="sm:hidden"
                                                                />
                                                            </ScrollArea>
                                                            <ScrollArea className="w-64 sm:w-auto">
                                                                <div className="flex sm:flex-col p-2">
                                                                    {Array.from({ length: 60 }, (_, i) => i).map(
                                                                        (minute) => (
                                                                            <Button
                                                                                key={minute}
                                                                                size="icon"
                                                                                variant={
                                                                                    field.value &&
                                                                                        field.value.getMinutes() === minute
                                                                                        ? "default"
                                                                                        : "ghost"
                                                                                }
                                                                                className="sm:w-full shrink-0 aspect-square"
                                                                                onClick={() =>
                                                                                    handleTimeChange("minute", minute.toString(), "end_time")
                                                                                }
                                                                            >
                                                                                {minute.toString().padStart(2, "0")}
                                                                            </Button>
                                                                        )
                                                                    )}
                                                                </div>
                                                                <ScrollBar
                                                                    orientation="horizontal"
                                                                    className="sm:hidden"
                                                                />
                                                            </ScrollArea>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            <FormDescription>
                                                请选择比赛结束时间
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <FormField
                            control={form.control}
                            name="summary"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center h-[20px]">
                                        <FormLabel>比赛简介</FormLabel>
                                        <div className="flex-1" />
                                        <FormMessage className="text-[14px]" />
                                    </div>
                                    <FormControl>
                                        <Textarea {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        比赛简介
                                    </FormDescription>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center h-[20px]">
                                        <FormLabel>比赛详细信息</FormLabel>
                                        <div className="flex-1" />
                                        <FormMessage className="text-[14px]" />
                                    </div>
                                    <FormControl>
                                        <Textarea {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        比赛详细信息
                                    </FormDescription>
                                </FormItem>
                            )}
                        />
                        <div className="flex gap-10 items-center">
                            <div className="w-1/3">
                                <FormField
                                    control={form.control}
                                    name="practice_mode"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                            <div className="space-y-0.5">
                                                <FormLabel>练习模式</FormLabel>
                                                <FormDescription>
                                                    是否开启练习模式
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="w-1/3">
                                <FormField
                                    control={form.control}
                                    name="require_wp"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                            <div className="space-y-0.5">
                                                <FormLabel>WriteUP</FormLabel>
                                                <FormDescription>
                                                    是否需要提交 WriteUP
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="w-1/3">
                                <FormField
                                    control={form.control}
                                    name="visible"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                            <div className="space-y-0.5">
                                                <FormLabel>是否隐藏</FormLabel>
                                                <FormDescription>
                                                    比赛是否可见
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <span className="text-lg font-semibold">详细设置</span>
                        <div className="flex gap-10 items-center">
                            <div className="w-1/2 flex flex-col gap-6">
                                <FormField
                                    control={form.control}
                                    name="invite_code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center h-[20px]">
                                                <FormLabel>邀请码</FormLabel>
                                                <div className="flex-1" />
                                                <FormMessage className="text-[14px]" />
                                            </div>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                不需要请留空
                                            </FormDescription>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`wp_expire_time`}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>WriteUP截至时间</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "MM/dd/yyyy HH:mm")
                                                            ) : (
                                                                <span>MM/DD/YYYY HH:mm</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <div className="sm:flex">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={(date) => handleDateSelect(date, "wp_expire_time")}
                                                            initialFocus
                                                        />
                                                        <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                                                            <ScrollArea className="w-64 sm:w-auto">
                                                                <div className="flex sm:flex-col p-2">
                                                                    {Array.from({ length: 24 }, (_, i) => i)
                                                                        .reverse()
                                                                        .map((hour) => (
                                                                            <Button
                                                                                key={hour}
                                                                                size="icon"
                                                                                variant={
                                                                                    field.value && field.value.getHours() === hour
                                                                                        ? "default"
                                                                                        : "ghost"
                                                                                }
                                                                                className="sm:w-full shrink-0 aspect-square"
                                                                                onClick={() =>
                                                                                    handleTimeChange("hour", hour.toString(), "wp_expire_time")
                                                                                }
                                                                            >
                                                                                {hour}
                                                                            </Button>
                                                                        ))}
                                                                </div>
                                                                <ScrollBar
                                                                    orientation="horizontal"
                                                                    className="sm:hidden"
                                                                />
                                                            </ScrollArea>
                                                            <ScrollArea className="w-64 sm:w-auto">
                                                                <div className="flex sm:flex-col p-2">
                                                                    {Array.from({ length: 60 }, (_, i) => i).map(
                                                                        (minute) => (
                                                                            <Button
                                                                                key={minute}
                                                                                size="icon"
                                                                                variant={
                                                                                    field.value &&
                                                                                        field.value.getMinutes() === minute
                                                                                        ? "default"
                                                                                        : "ghost"
                                                                                }
                                                                                className="sm:w-full shrink-0 aspect-square"
                                                                                onClick={() =>
                                                                                    handleTimeChange("minute", minute.toString(), "wp_expire_time")
                                                                                }
                                                                            >
                                                                                {minute.toString().padStart(2, "0")}
                                                                            </Button>
                                                                        )
                                                                    )}
                                                                </div>
                                                                <ScrollBar
                                                                    orientation="horizontal"
                                                                    className="sm:hidden"
                                                                />
                                                            </ScrollArea>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            <FormDescription>
                                                请选择WP截止时间
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="team_number_limit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center h-[20px]">
                                                <FormLabel>队伍人数限制</FormLabel>
                                                <div className="flex-1" />
                                                <FormMessage className="text-[14px]" />
                                            </div>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                队伍人数限制
                                            </FormDescription>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="container_number_limit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center h-[20px]">
                                                <FormLabel>队伍容器数量限制</FormLabel>
                                                <div className="flex-1" />
                                                <FormMessage className="text-[14px]" />
                                            </div>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                队伍容器数量限制
                                            </FormDescription>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="w-1/2 h-full py-4">
                                <div className="w-full h-full rounded-lg border shadow-md relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-full opacity-0 hover:bg-background hover:opacity-85 z-20 transition-all duration-300 flex items-center justify-center cursor-pointer" >
                                       <div className="flex gap-5 hover:text-cyan-500 transition-colors duration-300 items-center">
                                            <Upload size={60} />
                                            <span className="text-3xl font-bold">上传海报</span> 
                                       </div>
                                    </div>
                                    <div className="absolute top-0 left-0 w-full h-full" style={{ background: `url(${form.getValues("poster") || "/images/p2g7wm.jpg"})`, backgroundSize: "cover", backgroundPosition: "center" }} >
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 比赛阶段列表 */}
                        <div className="mt-6">
                            <div className="flex items-center mb-4">
                                <span className="text-lg font-semibold">比赛阶段</span>
                                <div className="flex-1" />
                                <Button
                                    type="button"
                                    variant={"outline"}
                                    className="[&_svg]:size-5"
                                    onClick={() =>
                                        appendStage({
                                            stage_name: "",
                                            start_time: new Date(),
                                            end_time: new Date(),
                                        })
                                    }
                                >
                                    <PlusCircle />
                                    添加阶段
                                </Button>
                            </div>
                            {stageFields.length > 0 ? stageFields.map((stage, index) => (
                                <GameStageForm
                                    key={index}
                                    control={form.control}
                                    form={form}
                                    index={index}
                                    removeStage={removeStage}
                                />
                            )) : (
                                <span className="text-sm text-foreground/70">还没有比赛阶段哦</span>
                            )}
                        </div>

                        {/* 题目列表 */}
                        <div className="mt-6">
                            <div className="flex items-center mb-4">
                                <span className="text-lg font-semibold">题目设置</span>
                                <div className="flex-1" />
                                <Dialog open={isOpen} onOpenChange={(status) => {
                                    setIsOpen(status)
                                    if (status && searchResult.length == 0 && curKeyWord.current == "") {
                                        setLoadingHover(true)
                                        api.admin.searchChallenges({ keyword: curKeyWord.current }).then((res) => {
                                            setSearchResult(res.data.data.map((c) => ({
                                                "Category": c.category,
                                                "ChallengeID": c.challenge_id || 0,
                                                "Name": c.name,
                                                "CreateTime": c.create_time
                                            })))
                                            setTotalCount(res.data.data.length)
                                            setLoadingHover(false)
                                        })
                                    }
                                }}>
                                    <DialogTrigger asChild>
                                        <Button
                                            type="button"
                                            variant={"outline"}
                                            className="[&_svg]:size-5"
                                        >
                                            <PlusCircle />
                                            添加题目
                                        </Button>
                                    </DialogTrigger>
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
                                                        <LoaderPinwheel className="animate-spin" />
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
                            </div>
                            <div className="flex w-full gap-4 h-[600px]">
                                <div className="flex flex-col w-[150px] gap-1 select-none flex-none">
                                    <span className="font-bold mb-2">Categories</span>
                                    {Object.keys(cateIcon).map((cat, index) => (
                                        <Button key={index} className={`flex items-center justify-start gap-2 px-2 pt-[6px] pb-[6px] rounded-lg transition-colors duration-300`}
                                            variant={curChoicedCategory === cat ? "default" : "ghost"}
                                            type="button"
                                            onClick={() => setCurChoicedCategory(cat)}
                                        >
                                            {cateIcon[cat]}
                                            <span className="text-md">{cat.substring(0, 1).toUpperCase() + cat.substring(1)}</span>
                                            <div className="flex-1" />
                                            <Badge className={`p-1 h-[20px] ${curChoicedCategory === cat ? "invert" : ""}`}>{challengeFields.filter((res) => (cat == "all" || res.category?.toLowerCase() == cat)).length}</Badge>
                                        </Button>
                                    ))}
                                </div>
                                <div className="flex-1">
                                    {filtedData.length > 0 ? (
                                        <MacScrollbar className="max-h-[600px] overflow-y-auto p-6">
                                            <div className={`grid auto-rows-[70px] gap-4 w-full grid-cols-[repeat(auto-fill,minmax(320px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(600px,1fr))] "}`}>
                                                {filtedData.map((challenge, index) => (
                                                    <GameChallengeForm
                                                        key={index}
                                                        control={form.control}
                                                        form={form}
                                                        index={index}
                                                        removeGameChallenge={removeChallenge}
                                                    />
                                                ))}
                                            </div>
                                        </MacScrollbar>
                                    ) : (
                                        <div className="flex items-center justify-center h-full w-full">
                                            <span className="text-xl">还没有设置题目哦</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex">
                            <Button type="submit">
                                <Save />
                                提交
                            </Button>
                        </div>
                    </form>
                </MacScrollbar>
            </Form>
        </div>
    );
}