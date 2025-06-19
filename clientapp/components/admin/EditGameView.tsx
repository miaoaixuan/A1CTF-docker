import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Textarea } from 'components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from 'components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from 'components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from 'components/ui/popover';
import { Calendar } from 'components/ui/calendar';
import { ScrollArea, ScrollBar } from 'components/ui/scroll-area';
import { Switch } from 'components/ui/switch';
import { Badge } from 'components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select';
import { format } from 'date-fns';
import { cn } from 'lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'components/ui/table';
import { Checkbox } from 'components/ui/checkbox';
import { MacScrollbar } from 'mac-scrollbar';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useGlobalVariableContext } from 'contexts/GlobalVariableContext';
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable, VisibilityState } from '@tanstack/react-table';
import { useForm, useFieldArray, useWatch, useController } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dayjs from 'dayjs';
import { CalendarIcon, CircleArrowLeft, Save, Upload, PlusCircle, Radar, MessageSquareLock, Bug, GlobeLock, Binary, FileSearch, HardDrive, Smartphone, SquareCode, Bot, BadgeCent, Github, Layers2, FileUser, Pencil, Trash2, LoaderPinwheel, ArrowLeft, ArrowRight, ScanBarcode, FileCode, ClockArrowUp, ClockArrowDown, ArrowUpDown, FilePenLine, Settings, Trophy, Users, Search } from 'lucide-react';
import { AxiosError } from 'axios';
import { api, ErrorMessage } from 'utils/ApiHelper';
import { ChallengeCategory, AdminDetailGameChallenge, AdminFullGameInfo, JudgeType } from 'utils/A1API';
import { challengeCategoryIcons, challengeCategoryColorMap } from 'utils/ClientAssets';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { GameTimelineEditor } from './GameTimelineEditor';
import { GameGroupManager } from './GameGroupManager';
import { GameNoticeManager } from './GameNoticeManager';

interface JudgeConfigFormProps {
    control: any;
    index: number;
    form: any;
}

function JudgeConfigForm({ control, index, form }: JudgeConfigFormProps) {

    const attachType = useWatch({
        control,
        name: `challenges.${index}.judge_config.judge_type`, // Watch the specific field
    });

    const {
        fields: hintFields,
        append: appendHint,
        remove: removeHint,
    } = useFieldArray({
        control,
        name: `challenges.${index}.hints`,
    });

    return (
        <>
            <span className="text-lg font-bold">评测设置: </span>
            <FormField
                control={form.control}
                name={`challenges.${index}.judge_config.judge_type`}
                render={({ field }) => (
                    <FormItem className="select-none">
                        <div className="flex items-center h-[20px]">
                            <FormLabel>评测模式</FormLabel>
                            <div className="flex-1" />
                            <FormMessage className="text-[14px]" />
                        </div>
                        <Select onValueChange={(e) => {
                            field.onChange(e)
                        }} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="选择一个评测模式" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="w-full flex">
                                <SelectItem value="DYNAMIC">
                                    <div className="w-full flex gap-2 items-center h-[25px]">
                                        <ScanBarcode />
                                        <span className="text-[12px] font-bold">文字匹配</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="SCRIPT" disabled>
                                    <div className="w-full flex gap-2 items-center h-[25px]">
                                        <FileCode />
                                        <span className="text-[12px] font-bold">脚本匹配</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <FormDescription>
                            请选择一个类别
                        </FormDescription>
                    </FormItem>
                )}
            />

            { attachType == "SCRIPT" ? (
                <FormField
                    control={form.control}
                    name={`challenges.${index}.judge_config.judge_script`}
                    render={({ field }) => (
                        <FormItem className="select-none">
                            <div className="flex items-center h-[20px]">
                                <FormLabel>评测脚本</FormLabel>
                                <div className="flex-1" />
                                <FormMessage className="text-[14px]" />
                            </div>
                            <FormControl>
                                <CodeEditor
                                    value={field.value}
                                    language="js"
                                    placeholder="在这里输入你的评测脚本"
                                    onChange={(evn) => field.onChange(evn.target.value)}
                                    padding={15}
                                    style={{
                                        // backgroundColor: "#f5f5f5",
                                        minHeight: 200,
                                        borderRadius: 5,
                                        // fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
                                    }}
                                />
                            </FormControl>
                            <FormDescription>
                                如果你选择了动态评测, 你需要提供一份符合格式要求的评测脚本
                            </FormDescription>
                        </FormItem>
                    )}
                />
            ) : (
                <FormField
                    control={form.control}
                    name={`challenges.${index}.judge_config.flag_template`}
                    render={({ field }) => (
                        <FormItem className="select-none">
                            <div className="flex items-center h-[20px]">
                                <FormLabel>Flag</FormLabel>
                                <div className="flex-1" />
                                <FormMessage className="text-[14px]" />
                            </div>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <div className="flex flex-col text-[12px] text-foreground/60">
                                <span>Flag支持模板变量</span>
                                <span>[TEAMHASH] 部分会被替换成队伍唯一标识符</span>
                                <span>[UUID] 部分会被替换成随机UUID</span>
                                <span>在Flag头加上[LEET] 会把花括号内的内容用LEET替换字符</span>
                            </div>
                        </FormItem>
                    )}
                />
            )}
            <FormField
                control={form.control}
                name={`challenges.${index}.belong_stage`}
                render={({ field }) => (
                    <FormItem className="select-none">
                        <div className="flex items-center h-[20px]">
                            <FormLabel>所属阶段</FormLabel>
                            <div className="flex-1" />
                            <FormMessage className="text-[14px]" />
                        </div>
                        <Select onValueChange={(e) => {
                            if (e == "null") {
                                field.onChange(null)
                            } else {
                                field.onChange(e)
                            }
                        }} defaultValue={field.value ? field.value.toString() : "null"}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="选择一个阶段" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="w-full flex">
                                <SelectItem value="null">
                                    <div className="w-full flex gap-2 items-center h-[25px]">
                                        <span className="text-[14px] font-bold">全局</span>
                                    </div>
                                </SelectItem>
                                <FormField
                                    control={form.control}
                                    name={`stages`}
                                    render={({ field }) => (
                                        <FormItem className="select-none">
                                            { Object.values(field.value).map((e: any, idx: number) => (
                                                <SelectItem value={e.stage_name} key={`${idx}`}>
                                                    <div className="w-full flex gap-2 items-center h-[25px]">
                                                        <span className="text-[14px] font-bold">{ e.stage_name }</span>
                                                        <div className="bg-foreground/[0.03] flex gap-2 items-center px-[9px] py-[5px] rounded-full">
                                                            <ClockArrowUp size={20} />
                                                            <span className="text-sm">{ dayjs(e.start_time).format("YYYY-MM-DD HH:mm:ss")}</span>
                                                        </div>
                                                        <span>-</span>
                                                        <div className="bg-foreground/[0.03] flex gap-2 items-center px-[9px] py-[5px] rounded-full">
                                                            <ClockArrowDown size={20} />
                                                            <span className="text-sm">{ dayjs(e.end_time).format("YYYY-MM-DD HH:mm:ss")}</span>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            )) }
                                        </FormItem>
                                    )}
                                />
                            </SelectContent>
                        </Select>
                        <FormDescription>
                            请选择题目所属阶段
                        </FormDescription>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name={`challenges.${index}.total_score`}
                render={({ field }) => (
                    <FormItem className="select-none">
                        <div className="flex items-center h-[20px]">
                            <FormLabel>题目总分</FormLabel>
                            <div className="flex-1" />
                            <FormMessage className="text-[14px]" />
                        </div>
                        <FormControl>
                            <Input {...field} value={field.value ?? ""}/>
                        </FormControl>
                        <div className="flex flex-col text-[12px] text-foreground/60">
                            <span>这里是题目的最大分数</span>
                            <span>在开启动态积分的情况下，积分会自动衰减</span>
                        </div>
                    </FormItem>
                )}
            />
            
            <div className="flex items-center w-full gap-2">
                <span className="text-lg font-bold">Hints: </span>
                <div className="flex-1" />
                <Button
                    type="button"
                    variant={"outline"}
                    className="[&_svg]:size-5"
                    onClick={() => {
                        appendHint({
                            content: "",
                            create_time: new Date(),
                            visible: false
                        })
                        
                    }}
                >
                    <PlusCircle />
                    添加Hint
                </Button>
            </div>
            { hintFields.length > 0 ? (
                 <div className="flex flex-col gap-4">
                    { hintFields.map((e, hintIndex) => (
                        <div className="w-full flex flex-col" key={e.id} >
                            <div className="flex gap-2 items-center mb-4 select-none">
                                <FormField
                                    control={control}
                                    name={`challenges.${index}.hints.${hintIndex}.visible`}
                                    render={({ field }) => (
                                        <FormItem className="flex">
                                            {/* <div className="flex items-center w- h-[20px]">
                                                <FormLabel>提示</FormLabel>
                                                <div className="flex-1" />
                                                <FormMessage className="text-[14px]" />
                                            </div> */}
                                            <FormControl>
                                                <Switch 
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange} 
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name={`challenges.${index}.hints.${hintIndex}.create_time`}
                                    render={({ field }) => (
                                        <FormItem className="flex">
                                            {/* <div className="flex items-center w- h-[20px]">
                                                <FormLabel>提示</FormLabel>
                                                <div className="flex-1" />
                                                <FormMessage className="text-[14px]" />
                                            </div> */}
                                            <FormControl>
                                                <div className="bg-foreground/[0.03] flex gap-2 items-center px-[9px] py-[5px] rounded-full">
                                                    <ClockArrowUp size={20} />
                                                    <span className="text-sm">{ field.value ? dayjs(field.value).format("YYYY-MM-DD HH:mm:ss") : "" }</span>
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <div className="flex-1" />
                                <Button variant="destructive" type="button" onClick={() => removeHint(hintIndex)}>
                                    删除提示
                                </Button>
                            </div>
                            <FormField
                                control={control}
                                name={`challenges.${index}.hints.${hintIndex}.content`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        {/* <div className="flex items-center w- h-[20px]">
                                            <FormLabel>提示</FormLabel>
                                            <div className="flex-1" />
                                            <FormMessage className="text-[14px]" />
                                        </div> */}
                                        <FormControl>
                                            <Textarea {...field} value={field.value ?? ""} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    )) }
                </div>
            ) : (
                <span className="text-sm mt-[-10px]">还没有提示哦</span>
            ) }
        </>
    )
}


const colorMap: { [key: string]: string } = challengeCategoryColorMap

const cateIcon: { [key: string]: any } = challengeCategoryIcons

interface GameChallengeFormProps {
    control: any;
    index: number;
    form: any;
    gameData: AdminDetailGameChallenge;
    onEditChallenge: (index: number) => void;
    removeGameChallenge: (index: number) => void;
}

export type ChallengeSearchResult = {
    ChallengeID: number,
    Category: string,
    Name: string,
    CreateTime: string,
    GameID: number
}

export function EditGameView({ game_info }: { game_info: AdminFullGameInfo }) {

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
        team_number_limit: z.coerce.number().min(1),
        container_number_limit: z.coerce.number().min(1),
        require_wp: z.boolean(),
        wp_expire_time: z.date().optional(),
        stages: z.array(
            z.object({
                stage_name: z.string().nonempty(),
                start_time: z.date(),
                end_time: z.date(),
            })
        ).optional(),
        visible: z.boolean(),
        challenges: z.array(
            z.object({
                challenge_id: z.number(),
                challenge_name: z.string(),
                category: z.enum(Object.keys(categories) as [string, ...string[]], {
                    errorMap: () => ({ message: "需要选择一个有效的题目类别" })
                }),
                total_score: z.coerce.number().min(1, "请输入一个有效的数字"),
                cur_score: z.number(),
                solve_count: z.number(),
                hints: z.array(z.object({
                    content: z.string(),
                    create_time: z.date(),
                    visible: z.boolean()
                })),
                visible: z.boolean(),
                belong_stage: z.string().nullable(),
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

    const { theme } = useTheme()

    const env_to_string = (data: { name: string, value: string }[]) => {
        console.log(data)
        let env = ""
        data.forEach((item) => {
            env += `${item.name}=${item.value},`
        })
        return env.substring(0, env.length - 1)
    }

    const string_to_env = (data: string): { name: string, value: string }[] => {
        const env: { name: string, value: string }[] = []

        data.split(",").forEach((item) => {
            const [name, value] = item.split("=")
            env.push({ name, value })
        })

        return env
    }

    console.log(game_info)

    const { clientConfig } = useGlobalVariableContext()

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
            stages: game_info.stages ? game_info.stages.map((stage) => ({
                stage_name: stage.stage_name,
                start_time: dayjs(stage.start_time).toDate(),
                end_time: dayjs(stage.end_time).toDate(),
            })) : [],
            challenges: game_info.challenges?.map((challenge) => ({
                challenge_id: challenge.challenge_id,
                challenge_name: challenge.challenge_name,
                category: challenge.category,
                total_score: challenge.total_score,
                cur_score: challenge.cur_score,
                solve_count: challenge.solve_count,
                hints: challenge.hints?.map((hint) => ({
                    content: hint.content,
                    create_time: dayjs(hint.create_time).toDate(),
                    visible: hint.visible
                })),
                visible: challenge.visible || false,
                belong_stage: challenge.belong_stage!,
                judge_config: {
                    judge_type: challenge.judge_config?.judge_type,
                    judge_script: challenge.judge_config?.judge_script || "",
                    flag_template: challenge.judge_config?.flag_template || "",
                }
            }))
        }
    })

    console.log('表单初始化后的 stages:', form.getValues("stages"));
    console.log('game_info.stages:', game_info.stages);

    const {
        fields: challengeFields,
        append: appendChallenge,
        remove: removeChallenge,
    } = useFieldArray({
        control: form.control,
        name: "challenges",
    });

    const GameChallengeForm = ({ control, index, form, removeGameChallenge, gameData, onEditChallenge }: GameChallengeFormProps) => {

        return (
            <div className="group bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-300 hover:scale-[1.02] hover:bg-card/80">
                {/* Challenge Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colorMap[gameData.category?.toLowerCase() || "misc"] || "from-muted/40 to-muted/20"} flex-shrink-0`}>
                            {cateIcon[gameData.category?.toLowerCase() || "misc"]}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-200">
                                {gameData.challenge_name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                    variant="outline" 
                                    className="text-xs font-medium border-muted-foreground/30"
                                >
                                    {gameData.category?.toUpperCase() || "MISC"}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    
                    {/* Visibility Toggle */}
                    <div className="flex-shrink-0 ml-3">
                        <FormField
                            control={control}
                            name={`challenges.${index}.visible`}
                            render={({ field }) => (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">可见</span>
                                    <Switch 
                                        checked={field.value}
                                        onCheckedChange={field.onChange} 
                                    />
                                </div>
                            )}
                        />
                    </div>
                </div>

                {/* Challenge Stats */}
                <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="p-1 rounded bg-blue-500/10">
                            <Layers2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium">{gameData.cur_score}</span>
                        <span className="text-xs">分数</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="p-1 rounded bg-green-500/10">
                            <FileUser className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-sm font-medium">{gameData.solve_count}</span>
                        <span className="text-xs">解决</span>
                    </div>
                </div>

                {/* Challenge Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/30">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 px-3 hover:bg-blue-500/10 hover:text-blue-600 transition-all duration-200"
                        onClick={() => onEditChallenge(index)}
                        title="编辑题目"
                        type="button"
                    >
                        <Pencil className="h-4 w-4 mr-1" />
                        编辑
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 px-3 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                        onClick={() => removeGameChallenge(index)}
                        title="删除题目"
                        type="button"
                    >
                        <Trash2 className="h-4 w-4 mr-1" />
                        删除
                    </Button>
                </div>
            </div>
        );
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
                                    }
                                })
                                toast.success("题目添加成功")
                            }).catch((err: AxiosError) => {
                                const errorMessage: ErrorMessage = err.response?.data as ErrorMessage
                                if (err.response?.status == 409) {
                                    toast.error("此题目已经添加到比赛中了")
                                } else {
                                    toast.error(errorMessage.message)
                                }
                            })
                        }}
                    >Select</Button>
                )
            },
        },
    ]

    const [showScript, setShowScript] = useState(false);

    const format_date = (dt: Date) => {
        return dt.toISOString();
    }

    function onSubmit(values: z.infer<typeof formSchema>) {
        const finalData = {
            game_id: game_info.game_id,
            name: values.name,
            summary: values.summary,
            description: values.description,
            // poster: values.poster,
            invite_code: values.invite_code,
            start_time: format_date(values.start_time ?? new Date()),
            end_time: format_date(values.end_time ?? new Date()),
            practice_mode: values.practice_mode,
            team_number_limit: values.team_number_limit,
            container_number_limit: values.container_number_limit,
            require_wp: values.require_wp,
            wp_expire_time: format_date(values.wp_expire_time ?? new Date()),
            stages: values.stages,
            visible: values.visible,
            challenges: values.challenges
        };

        api.admin.updateGame(game_info.game_id ,  finalData as any as AdminFullGameInfo).then((res) => {
            toast.success("比赛信息更新成功")
        }).catch((err: AxiosError) => {
            toast.error(err.response?.data as string)
        })
    }

    const [searchContent, setSearchContent] = useState("")
    const [curChoicedCategory, setCurChoicedCategory] = useState("all")

    const router = useNavigate()

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

    const [ isOpen, setIsOpen ] = useState(false)
    const [ curEditChallengeID, setCurEditChallengeID ] = useState(0)
    const [ isJudgeConfigOpen, setIsJudgeOpen ] = useState(false)

    const setInputState = (value: string) => {
        setAddChallengeInput(value)
        curKeyWord.current = value
        if (lastInputTime.current == 0) setLoadingHover(true)
        lastInputTime.current = dayjs().valueOf()
    }

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


    function handleDateSelect(date: Date | undefined, tm_type: "start_time" | "end_time" | "wp_expire_time") {
        if (date) {
            form.setValue(tm_type, date);
        }
    }

    function handleTimeChange(type: "hour" | "minute", value: string, tm_type: "start_time" | "end_time" | "wp_expire_time") {
        const field_name = tm_type;
        const currentDate = form.getValues(field_name) || new Date();
        const newDate = new Date(currentDate);

        if (type === "hour") {
            const hour = parseInt(value, 10);
            newDate.setHours(hour);
        } else if (type === "minute") {
            newDate.setMinutes(parseInt(value, 10));
        }

        form.setValue(field_name, newDate);
    }

    // 时间线编辑器相关函数
    const handleTimePointsChange = (timePoints: any[]) => {
        // 检查是否有时间段被删除
        const currentStages = form.getValues("stages") || [];
        const deletedStageNames = currentStages
            .filter(oldStage => !timePoints.find(newStage => newStage.name === oldStage.stage_name))
            .map(stage => stage.stage_name);
        
        // 将删除时间段的题目移回全局
        if (deletedStageNames.length > 0) {
            const currentChallenges = form.getValues("challenges") || [];
            currentChallenges.forEach((challenge, index) => {
                if (challenge.belong_stage && deletedStageNames.includes(challenge.belong_stage)) {
                    form.setValue(`challenges.${index}.belong_stage`, null);
                }
            });
        }
        
        const stages = timePoints.map(tp => ({
            stage_name: tp.name,
            start_time: tp.startTime,
            end_time: tp.endTime,
        }));
        console.log(stages)
        form.setValue("stages", stages);
    };

    const handleChallengeAssignmentChange = (challengeId: number, stageId: string | null) => {
        
        // 使用实时的 challenges 数据而不是静态的 challengeFields
        const currentChallenges = form.getValues("challenges") || [];
        const challengeIndex = currentChallenges.findIndex(c => c.challenge_id === challengeId);
        
        if (challengeIndex !== -1) {
            // 如果 stageId 是 null，则设置为全局
            if (stageId === null) {
                form.setValue(`challenges.${challengeIndex}.belong_stage`, null);
                return;
            }
            
            // 从当前的时间点数据中找到对应的stage_name
            const currentStages = form.getValues("stages") || [];
            const stageIndex = parseInt(stageId.replace('stage_', ''));
            
            if (stageIndex >= 0 && stageIndex < currentStages.length) {
                const stageName = currentStages[stageIndex].stage_name;
                form.setValue(`challenges.${challengeIndex}.belong_stage`, stageName);
            } else {
                console.error(`无效的时间段索引: ${stageIndex}`);
            }
        } else {
            console.error(`找不到题目 ID: ${challengeId}`);
        }
    };

    // 使用 useWatch 监听 stages 字段的变化，确保 timePoints 实时更新
    const watchedStages = useWatch({
        control: form.control,
        name: "stages"
    });

    // 使用 useWatch 监听 challenges 字段的变化，确保 challengeBlocks 实时更新
    const watchedChallenges = useWatch({
        control: form.control,
        name: "challenges"
    });

    // 转换数据格式给时间线编辑器
    const timePoints = (watchedStages || []).map((stage, index) => ({
        id: `stage_${index}`,
        name: stage.stage_name,
        startTime: stage.start_time,
        endTime: stage.end_time,
    }));

    const challengeBlocks = (watchedChallenges || []).map(challenge => {
        // 将belong_stage转换为对应的ID
        let belongStageId = null;
        if (challenge.belong_stage) {
            const stages = watchedStages || [];
            const stageIndex = stages.findIndex(stage => stage.stage_name === challenge.belong_stage);
            if (stageIndex !== -1) {
                belongStageId = `stage_${stageIndex}`;
            }
        }
        
        return {
            id: challenge.challenge_id || 0,
            name: challenge.challenge_name || "",
            category: challenge.category || "misc",
            score: challenge.total_score || 0,
            belongStage: belongStageId,
        };
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
            <Form {...form}>
                <MacScrollbar className="h-full w-full">
                    <div className="max-w-7xl mx-auto p-6 space-y-8">
                        {/* Header Section */}
                        <div className="sticky top-0 z-50 backdrop-blur-sm bg-background/80 border-b rounded-t-2xl p-6 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => router(`/admin/games`)}
                                        className="bg-background/50 backdrop-blur-sm"
                                    >
                                        <CircleArrowLeft className="h-4 w-4" />
                                        返回比赛列表
                                    </Button>
                                    <div className="h-8 w-px bg-border" />
                                    <div>
                                        <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                            编辑比赛
                                        </h1>
                                        <p className="text-muted-foreground">{game_info.name}</p>
                                    </div>
                                </div>
                                <Button 
                                    type="submit" 
                                    form="game-edit-form"
                                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200"
                                >
                                    <Save className="h-4 w-4" />
                                    保存设置
                                </Button>
                            </div>
                        </div>

                        <form id="game-edit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            {/* 基本信息 Section */}
                            <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                                        <FilePenLine className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold">基本信息</h2>
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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
                                                    <Input {...field} className="bg-background/50" />
                                                </FormControl>
                                                <FormDescription>
                                                    请填写比赛名称
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />

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
                                                                type="button"
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal bg-background/50",
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
                                                                                    type="button"
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
                                                                                    type="button"
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
                                                                type="button"
                                                                variant={"outline"}
                                                                className={cn(
                                                                    "w-full pl-3 text-left font-normal bg-background/50",
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
                                                                                    type="button"
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
                                                                                    type="button"
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

                                <div className="space-y-6">
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
                                                    <Textarea {...field} className="h-[100px] bg-background/50" />
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
                                                    <Textarea {...field} className="h-[300px] bg-background/50" />
                                                </FormControl>
                                                <FormDescription>
                                                    比赛详细信息 (支持Markdown)
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* 开关设置 */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
                                    <FormField
                                        control={form.control}
                                        name="practice_mode"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 p-4 shadow-sm bg-background/30">
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

                                    <FormField
                                        control={form.control}
                                        name="require_wp"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 p-4 shadow-sm bg-background/30">
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

                                    <FormField
                                        control={form.control}
                                        name="visible"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 p-4 shadow-sm bg-background/30">
                                                <div className="space-y-0.5">
                                                    <FormLabel>是否可见</FormLabel>
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

                            {/* 详细设置 Section */}
                            <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center">
                                        <Settings className="h-4 w-4 text-green-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold">详细设置</h2>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-6">
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
                                                        <Input {...field} className="bg-background/50" />
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
                                                                    type="button"
                                                                    variant={"outline"}
                                                                    className={cn(
                                                                        "w-full pl-3 text-left font-normal bg-background/50",
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
                                                                                        type="button"
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
                                                                                        type="button"
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
                                                        <Input {...field} className="bg-background/50" />
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
                                                        <Input {...field} className="bg-background/50" />
                                                    </FormControl>
                                                    <FormDescription>
                                                        队伍容器数量限制
                                                    </FormDescription>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* 海报上传区域 */}
                                    <div className="h-fit">
                                        <div className="aspect-[4/3] rounded-xl border border-border/50 shadow-md relative overflow-hidden bg-gradient-to-br from-muted/20 to-muted/10">
                                            <div className="absolute top-0 left-0 w-full h-full opacity-0 hover:bg-background hover:opacity-85 z-20 transition-all duration-300 flex items-center justify-center cursor-pointer group">
                                                <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:text-primary transition-colors duration-300">
                                                    <Upload size={40} />
                                                    <span className="text-lg font-medium">上传海报</span>
                                                    <span className="text-sm text-center">点击上传新的比赛海报</span>
                                                </div>
                                            </div>
                                            <div 
                                                className="absolute top-0 left-0 w-full h-full bg-cover bg-center"
                                                style={{ 
                                                    backgroundImage: `url(${form.getValues("poster") || clientConfig.DefaultBGImage})` 
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 比赛时间线和题目分配 */}
                            <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
                                        <CalendarIcon className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold">时间线与题目分配</h2>
                                </div>
                                <GameTimelineEditor
                                    gameStartTime={form.getValues("start_time") || new Date()}
                                    gameEndTime={form.getValues("end_time") || new Date()}
                                    timePoints={timePoints}
                                    challenges={challengeBlocks}
                                    onTimePointsChange={handleTimePointsChange}
                                    onChallengeAssignmentChange={handleChallengeAssignmentChange}
                                />
                            </div>

                            {/* 分组管理 */}
                            <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center">
                                        <Users className="h-4 w-4 text-orange-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold">分组管理</h2>
                                </div>
                                <GameGroupManager gameId={game_info.game_id} />
                            </div>

                            {/* 公告管理 */}
                            <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                                        <MessageSquareLock className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold">公告管理</h2>
                                </div>
                                <GameNoticeManager gameId={game_info.game_id} />
                            </div>

                            {/* 题目设置 */}
                            <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center">
                                            <Trophy className="h-4 w-4 text-red-600" />
                                        </div>
                                        <h2 className="text-xl font-semibold">题目设置</h2>
                                    </div>
                                    
                                    <Dialog open={isOpen} onOpenChange={(status) => {
                                        setIsOpen(status)
                                        if (status && searchResult.length == 0 && curKeyWord.current == "") {
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
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button
                                                type="button"
                                                variant={"outline"}
                                                size="sm"
                                                className="bg-background/50 backdrop-blur-sm"
                                            >
                                                <PlusCircle className="h-4 w-4" />
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
                                        <DialogContent className="sm:max-w-[825px] p-0" onInteractOutside={(e) => e.preventDefault()}>
                                            <DialogHeader className="select-none px-8 pt-8">
                                                <DialogTitle>覆盖题目评测</DialogTitle>
                                                <DialogDescription>
                                                    这里可以覆盖题目的评测设置, 编辑完成后直接关闭, 外面点保存即可
                                                </DialogDescription>
                                            </DialogHeader>
                                            <MacScrollbar className="w-full max-h-[84vh] overflow-y-auto"
                                                skin={theme ==  "light" ? "light" : "dark"}
                                                trackStyle={(horizontal) => ({ [horizontal ? "height" : "width"]: 0, borderWidth: 0})}
                                                thumbStyle={(horizontal) => ({ [horizontal ? "height" : "width"]: 6})}
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
                                </div>

                                <div className="mt-6">
                                    {/* Search Bar */}
                                    <div className="mb-6">
                                        <div className="relative max-w-md">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                value={searchContent} 
                                                onChange={(e) => setSearchContent(e.target.value)} 
                                                placeholder="搜索题目..."
                                                className="pl-10 bg-background/50 backdrop-blur-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-6">
                                        {/* Categories Sidebar */}
                                        <div className="w-64 flex-none bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl p-4">
                                            <h3 className="font-semibold text-lg mb-4 text-foreground/90">分类筛选</h3>
                                            <div className="space-y-1">
                                                {Object.keys(cateIcon).map((cat, index) => (
                                                    <Button 
                                                        key={index} 
                                                        className={`w-full justify-start gap-3 h-11 transition-all duration-200 border ${
                                                            curChoicedCategory === cat 
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
                                                            className={`h-6 px-2 text-xs font-semibold flex-shrink-0 ${
                                                                curChoicedCategory === cat ? "bg-primary/20 text-primary" : ""
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
                                                <MacScrollbar className="h-[700px]">
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
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </MacScrollbar>
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
                            </div>
                        </form>
                    </div>
                </MacScrollbar>
            </Form>
        </div>
    );
}