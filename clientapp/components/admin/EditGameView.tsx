import React, { useState } from 'react';
import { Button } from 'components/ui/button';
import { Form } from 'components/ui/form';
import { MacScrollbar } from 'mac-scrollbar';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useGlobalVariableContext } from 'contexts/GlobalVariableContext';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dayjs from 'dayjs';
import { CalendarIcon, CircleArrowLeft, Save, Radar, MessageSquareLock, Bug, GlobeLock, Binary, FileSearch, HardDrive, Smartphone, SquareCode, Bot, BadgeCent, Github, FilePenLine, Settings, Trophy, Users } from 'lucide-react';
import { AxiosError } from 'axios';
import { api } from 'utils/ApiHelper';

import { GameTimelineEditor } from './GameTimelineEditor';
import { GameGroupManager } from './GameGroupManager';
import { GameNoticeManager } from './GameNoticeManager';
import { BasicInfoModule } from './game/BasicInfoModule';
import { DetailedSettingsModule } from './game/DetailedSettingsModule';
import EditGameChallengesModule from './game/EditGameChallengesModule';
import { AdminFullGameInfo } from 'utils/A1API';

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

export const EditGameFormSchema = z.object({
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

export function EditGameView({ game_info }: { game_info: AdminFullGameInfo }) {

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

    const { clientConfig } = useGlobalVariableContext()

    const form = useForm<z.infer<typeof EditGameFormSchema>>({
        resolver: zodResolver(EditGameFormSchema),
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


    const [showScript, setShowScript] = useState(false);

    const format_date = (dt: Date) => {
        return dt.toISOString();
    }

    function onSubmit(values: z.infer<typeof EditGameFormSchema>) {
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

    const router = useNavigate()

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
            {/* Header Section */}
            <div className="absolute top-0 z-50 backdrop-blur-sm bg-background/20 border-b px-6 w-full h-20 flex flex-col justify-center">
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
                            <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                编辑比赛
                            </span>
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

            <div className="flex gap-6 w-full h-full overflow-hidden">
                {/* 左侧模块导航 */}
                <div className="w-64 flex-none border-r-1">
                    <div className="px-6 pt-28">
                        <h3 className="font-semibold text-lg mb-4 text-foreground/90">管理模块</h3>
                        <div className="space-y-2">
                            {modules.map((module) => (
                                <Button
                                    key={module.id}
                                    type="button"
                                    className='w-full h-10 flex justify-start gap-2'
                                    variant={activeModule === module.id ? "default" : "ghost"}
                                    onClick={() => setActiveModule(module.id)}
                                >
                                    {module.icon}
                                    <span className="font-medium">{module.name}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 右侧内容区域 */}
                <div className="flex-1 overflow-hidden">
                    <MacScrollbar className="h-full">
                        <div className="px-6 pt-32">
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
                                        game_info={game_info}
                                        handleDateSelect={(date) => handleDateSelect(date, "wp_expire_time")}
                                        handleTimeChange={(type, val) => handleTimeChange(type as any, val, "wp_expire_time")}
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
                                            game_info={game_info}
                                            form={form}
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
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center">
                                                <Trophy className="h-4 w-4 text-red-600" />
                                            </div>
                                            <h2 className="text-xl font-semibold">题目设置</h2>
                                        </div>
                                        <EditGameChallengesModule
                                            form={form}
                                            game_info={game_info}
                                        />
                                    </div>
                                )}
                            </form>
                        </div>
                    </MacScrollbar>
                </div>
            </div>
        </Form>
    );
}