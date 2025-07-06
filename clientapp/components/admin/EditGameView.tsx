import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Textarea } from 'components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from 'components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from 'components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from 'components/ui/alert-dialog';
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
import { JudgeConfigForm } from './game/JudgeConfigForm';
import { GameChallengeForm } from './game/GameChallengeForm';
import { BasicInfoModule } from './game/BasicInfoModule';
import { DetailedSettingsModule } from './game/DetailedSettingsModule';

const cateIcon: { [key: string]: any } = challengeCategoryIcons;

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
                solve_count: challenge.solve_count || 0,
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

    const {
        fields: challengeFields,
        append: appendChallenge,
        remove: removeChallenge,
    } = useFieldArray({
        control: form.control,
        name: "challenges",
    });

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
            poster: values.poster,
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

        api.admin.updateGame(game_info.game_id, finalData as any as AdminFullGameInfo).then((res) => {
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

    const [isOpen, setIsOpen] = useState(false)
    const [curEditChallengeID, setCurEditChallengeID] = useState(0)
    const [isJudgeConfigOpen, setIsJudgeOpen] = useState(false)

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

    // 海报上传处理函数
    const handlePosterUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            toast.error('请选择图片文件');
            return;
        }

        // 检查文件大小 (限制为10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('图片大小不能超过10MB');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('poster', file);

            const response = await api.admin.uploadGamePoster(game_info.game_id, { poster: file });

            if (response.status === 200) {
                // 更新表单中的poster字段
                form.setValue('poster', response.data.poster_url);
                toast.success('海报上传成功');
            }
        } catch (error: any) {
            console.error('海报上传失败:', error);
            if (error.response?.data?.message) {
                toast.error(`上传失败: ${error.response.data.message}`);
            } else {
                toast.error('海报上传失败，请重试');
            }
        }

        // 清空文件输入，允许重新选择相同文件
        event.target.value = '';
    };

    // 添加状态来管理当前选中的模块
    const [activeModule, setActiveModule] = useState('basic');

    // 定义模块配置
    const modules = [
        {
            id: 'basic',
            name: '基本信息',
            icon: <FilePenLine className="h-4 w-4" />,
            description: '比赛基本设置'
        },
        {
            id: 'settings',
            name: '详细设置',
            icon: <Settings className="h-4 w-4" />,
            description: '高级配置选项'
        },
        {
            id: 'timeline',
            name: '时间线',
            icon: <CalendarIcon className="h-4 w-4" />,
            description: '时间线与题目分配'
        },
        {
            id: 'groups',
            name: '分组管理',
            icon: <Users className="h-4 w-4" />,
            description: '队伍分组设置'
        },
        {
            id: 'notices',
            name: '公告管理',
            icon: <MessageSquareLock className="h-4 w-4" />,
            description: '比赛公告发布'
        },
        {
            id: 'challenges',
            name: '题目设置',
            icon: <Trophy className="h-4 w-4" />,
            description: '题目管理配置'
        }
    ];

    return (
        <Form {...form}>
            <div className="max-w-[90%] mx-auto p-6">
                {/* Header Section */}
                <div className="sticky top-0 z-50 backdrop-blur-sm bg-background/80 border-b rounded-t-2xl p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router(`/admin/games`)}
                                className=""
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

                <div className="flex gap-6">
                    {/* 左侧模块导航 */}
                    <div className="w-64 flex-none">
                        <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-4 shadow-lg sticky top-32">
                            <h3 className="font-semibold text-lg mb-4 text-foreground/90">管理模块</h3>
                            <div className="space-y-2">
                                {modules.map((module) => (
                                    <Button
                                        key={module.id}
                                        type="button"
                                        variant="ghost"
                                        className={`w-full justify-start gap-3 h-auto p-3 transition-all duration-200 border ${activeModule === module.id
                                            ? "bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30 text-primary shadow-sm"
                                            : "hover:bg-muted/60 hover:shadow-sm border-transparent"
                                            }`}
                                        onClick={() => setActiveModule(module.id)}
                                    >
                                        <div className={`p-1.5 rounded-lg flex-shrink-0 ${activeModule === module.id ? "bg-primary/20" : "bg-muted/40"
                                            }`}>
                                            {module.icon}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="font-medium">{module.name}</div>
                                            <div className="text-xs text-muted-foreground">{module.description}</div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 右侧内容区域 */}
                    <div className="flex-1 overflow-hidden">
                        <div className="container mx-auto px-4 py-4">
                            <form id="game-edit-form" onSubmit={form.handleSubmit(onSubmit)}>
                                {/* 基本信息 Section */}
                                {activeModule === 'basic' && (
                                    <BasicInfoModule
                                        form={form}
                                        handleDateSelect={handleDateSelect}
                                        handleTimeChange={handleTimeChange}
                                    />
                                )}

                                {/* 详细设置 Section */}
                                {activeModule === 'settings' && (
                                    <DetailedSettingsModule
                                        form={form}
                                        handleDateSelect={(date) => handleDateSelect(date, "wp_expire_time")}
                                        handleTimeChange={(type, val) => handleTimeChange(type as any, val, "wp_expire_time")}
                                        handlePosterUpload={handlePosterUpload}
                                        clientConfig={clientConfig}
                                    />
                                )}

                                {/* 比赛时间线和题目分配 */}
                                {activeModule === 'timeline' && (
                                    <div>
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
                                )}

                                {/* 分组管理 */}
                                {activeModule === 'groups' && (
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center">
                                                <Users className="h-4 w-4 text-orange-600" />
                                            </div>
                                            <h2 className="text-xl font-semibold">分组管理</h2>
                                        </div>
                                        <GameGroupManager gameId={game_info.game_id} />
                                    </div>
                                )}

                                {/* 公告管理 */}
                                {activeModule === 'notices' && (
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                                                <MessageSquareLock className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <h2 className="text-xl font-semibold">公告管理</h2>
                                        </div>
                                        <GameNoticeManager gameId={game_info.game_id} />
                                    </div>
                                )}

                                {/* 题目设置 */}
                                {activeModule === 'challenges' && (
                                    <div>
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
                                                        className=""
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
                                                        className="pl-10"
                                                    />
                                                </div>
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
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Form>
    );
}