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

import { CalendarIcon, CircleArrowLeft, Cloud, FileCode, Github, PlusCircle, Save, ScanBarcode, TableProperties } from "lucide-react"
import { Textarea } from "../ui/textarea";

import CodeEditor from '@uiw/react-textarea-code-editor';

import { BadgeCent, Binary, Bot, Bug, FileSearch, GlobeLock, HardDrive, MessageSquareLock, Radar, Smartphone, SquareCode } from "lucide-react"
import { useEffect, useState } from "react";
import Link from "next/link";
import { MacScrollbar } from "mac-scrollbar";
import { ChallengeConfig } from "@/utils/A1API";
import { api, ErrorMessage } from "@/utils/ApiHelper";
import dayjs from "dayjs";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";

interface ContainerFormProps {
    control: any;
    index: number;
    removeContainer: (index: number) => void;
}

interface AttachmentFormProps {
    control: any;
    index: number;
    form: any;
    removeAttachment: (index: number) => void;
}

function ContainerForm({ control, index, removeContainer }: ContainerFormProps) {
    const {
        fields: portFields,
        append: appendPort,
        remove: removePort,
    } = useFieldArray({
        control,
        name: `container_config.${index}.expose_ports`,
    });

    return (
        <div className="border p-6 mb-4 rounded-lg hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center mb-2">
                <span className="font-md font-semibold">容器 {index + 1}</span>
                <Button variant="destructive" type="button" onClick={() => removeContainer(index)}>
                    删除容器
                </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={control}
                    name={`container_config.${index}.name`}
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center h-[20px]">
                                <FormLabel>容器名称</FormLabel>
                                <div className="flex-1" />
                                <FormMessage className="text-[14px]" />
                            </div>
                            <FormControl>
                                <Input {...field} value={field.value ?? ""} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name={`container_config.${index}.image`}
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center h-[20px]">
                                <FormLabel>镜像名称</FormLabel>
                                <div className="flex-1" />
                                <FormMessage className="text-[14px]" />
                            </div>
                            <FormControl>
                                <Input {...field} value={field.value ?? ""} />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
                <FormField
                    control={control}
                    name={`container_config.${index}.command`}
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center h-[20px]">
                                <FormLabel>启动命令</FormLabel>
                                <div className="flex-1" />
                                <FormMessage className="text-[14px]" />
                            </div>
                            <FormControl>
                                <Input {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormDescription>
                                默认请留空
                            </FormDescription>
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name={`container_config.${index}.env`}
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center h-[20px]">
                                <FormLabel>环境变量</FormLabel>
                                <div className="flex-1" />
                                <FormMessage className="text-[14px]" />
                            </div>
                            <FormControl>
                                <Input {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormDescription>
                                键值对的形式, 用逗号隔开, 如: KEY=VALUE,KEY2=VALUE2, 支持<a className="hover:underline hover:cursor-pointer underline-offset-2 text-red-400">模板变量</a>
                            </FormDescription>
                        </FormItem>
                    )}
                />
            </div>
            <div className="mt-4">
                <div className="flex items-center mb-3">
                    <span className="text-md font-semibold">端口暴露</span>
                    <div className="flex-1" />
                    <Button
                        type="button"
                        variant={"outline"}
                        className="[&_svg]:size-5"
                        onClick={() => appendPort({ name: "", port: 0 })}
                    >
                        <PlusCircle />
                        添加端口
                    </Button>
                </div>
                <span className="text-sm text-foreground/50">端口名称是你需要映射出来的端口的名称, 这会显示给选手, 端口号是容器内服务的端口, A1CTF会自动映射随机端口到宿主机上, 注意！一道题的不同容器不能同时暴露相同的端口! 比如: 容器1和容器2同时要求暴露80端口, 这会导致映射出问题! 请你在制作docker的时候选择不同的监听端口</span>
                <div className="h-4" />
                {portFields.map((port, portIndex) => (
                    <div key={port.id} className="flex gap-2 items-end mb-2">
                        <FormField
                            control={control}
                            name={`container_config.${index}.expose_ports.${portIndex}.name`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <div className="flex items-center w- h-[20px]">
                                        <FormLabel>端口名称</FormLabel>
                                        <div className="flex-1" />
                                        <FormMessage className="text-[14px]" />
                                    </div>
                                    <FormControl>
                                        <Input {...field} value={field.value ?? ""} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name={`container_config.${index}.expose_ports.${portIndex}.port`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <div className="flex items-center w- h-[20px]">
                                        <FormLabel>端口号</FormLabel>
                                        <div className="flex-1" />
                                        <FormMessage className="text-[14px]" />
                                    </div>
                                    <FormControl>
                                        <Input type="number" {...field} value={field.value ?? 0} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <Button variant="destructive" type="button" onClick={() => removePort(portIndex)}>
                            删除端口
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AttachmentForm({ control, index, form, removeAttachment }: AttachmentFormProps) {

    const attachType = useWatch({
        control,
        name: `attachments.${index}.attach_type`, // Watch the specific field
    });

    return (
        <div className="border p-6 mb-4 rounded-lg hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center mb-2">
                <span className="font-md font-semibold">附件 {index + 1}</span>
                <Button variant="destructive" type="button" onClick={() => removeAttachment(index)}>
                    删除附件
                </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={control}
                    name={`attachments.${index}.attach_name`}
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center h-[20px]">
                                <FormLabel>附件名称</FormLabel>
                                <div className="flex-1" />
                                <FormMessage className="text-[14px]" />
                            </div>
                            <FormControl>
                                <Input {...field} value={field.value ?? ""} />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name={`attachments.${index}.attach_type`}
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center h-[20px]">
                                <FormLabel>附件类型</FormLabel>
                                <div className="flex-1" />
                                <FormMessage className="text-[14px]" />
                            </div>
                            <Select onValueChange={(e) => {
                                field.onChange(e)

                            }} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择附件类型" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="w-full flex">
                                    <SelectContent className="w-full flex">
                                        <SelectItem value="STATICFILE">
                                            <div className="w-full flex gap-2 items-center h-[25px]">
                                                <ScanBarcode />
                                                <span className="text-[12px] font-bold">静态附件</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="DYNAMICFILE" disabled>
                                            <div className="w-full flex gap-2 items-center h-[25px]">
                                                <FileCode />
                                                <span className="text-[12px] font-bold">动态附件</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="REMOTEFILE">
                                            <div className="w-full flex gap-2 items-center h-[25px]">
                                                <Cloud />
                                                <span className="text-[12px] font-bold">远程附件</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="ATTACHMENTPOOR" disabled>
                                            <div className="w-full flex gap-2 items-center h-[25px]">
                                                <TableProperties />
                                                <span className="text-[12px] font-bold">附件池(随机)</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </SelectContent>
                            </Select>
                            <FormDescription>
                                请选择一个类别
                            </FormDescription>
                        </FormItem>
                    )}
                />
            </div>
            {attachType == "REMOTEFILE" && (
                <FormField
                    control={control}
                    name={`attachments.${index}.attach_url`}
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center h-[20px]">
                                <FormLabel>附件下载地址</FormLabel>
                                <div className="flex-1" />
                                <FormMessage className="text-[14px]" />
                            </div>
                            <FormControl>
                                <Input {...field} value={field.value ?? ""} />
                            </FormControl>
                        </FormItem>
                    )}
                />
            )}

            {attachType == "STATICFILE" && (
                <div className="grid grid-cols-8 gap-4 items-end">
                    <div className="col-span-7">
                        <FormField
                            control={control}
                            name={`attachments.${index}.attach_hash`}
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center h-[20px]">
                                        <FormLabel>附件哈希</FormLabel>
                                        <div className="flex-1" />
                                        <FormMessage className="text-[14px]" />
                                    </div>
                                    <FormControl>
                                        <Input {...field} value={field.value ?? ""} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button>
                        上传附件
                    </Button>
                </div>
            )}
        </div>
    );
}

export function EditChallengeView({ challenge_info, lng } : { challenge_info: ChallengeConfig, lng: string }) {

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
        description: z.string(),
        create_time: z.date().optional(),
        challenge_id: z.number().optional(),
        category: z.enum(Object.keys(categories) as [string, ...string[]], {
            errorMap: () => ({ message: "需要选择一个有效的题目类别" })
        }),
        judge_config: z.object({
            judge_type: z.enum(["DYNAMIC", "SCRIPT"], {
                errorMap: () => ({ message: "需要选择一个有效的题目类别" })
            }),
            judge_script: z.string().optional(),
            flag_template: z.string().optional(),
        }),
        // 新增 container_config 部分
        container_config: z.array(
            z.object({
                name: z.string().min(1, { message: "请输入容器名称" }),
                image: z.string().min(1, { message: "请输入镜像地址" }),
                command: z.string().nullable(),
                env: z.string().nullable(),
                expose_ports: z.array(
                    z.object({
                        name: z.string().min(1, { message: "请输入端口名称" }),
                        port: z.preprocess(
                            (a) => parseInt(a as string, 10),
                            z.number({ invalid_type_error: "请输入数字" }).min(1, { message: "端口号不能小于 1" }).max(65535, { message: "端口号不能大于 65535" })
                        ),
                    })
                ),
            })
        ),
        attachments: z.array(
            z.object({
                attach_hash: z.string().nullable(),
                attach_name: z.string().min(2, { message: "附件名称最少2个字符" }),
                attach_type: z.enum(["STATICFILE", "DYNAMICFILE", "REMOTEFILE", "ATTACHMENTPOOR"], {
                    errorMap: () => ({ message: "需要选择一个有效的附件类型" })
                }),
                attach_url: z.string().nullable(),
                download_hash: z.string().nullable(),
                generate_script: z.string().nullable(),
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
            name: challenge_info.name,
            description: challenge_info.description,
            category: challenge_info.category,
            challenge_id: 0,
            judge_config: {
                judge_type: challenge_info.judge_config.judge_type,
                judge_script: challenge_info.judge_config.judge_script || "",
                flag_template: challenge_info.judge_config.flag_template
            },
            container_config: challenge_info.container_config.map((e) => ({
                name: e.name,
                image: e.image,
                command: e.command,
                env: e.env ? env_to_string(e.env) : "",
                expose_ports: e.expose_ports.map((e2) => (
                    {
                        name: e2.name,
                        port: e2.port,
                    }
                )),
            })) || [],
            attachments: challenge_info.attachments?.map((e) => ({
                attach_hash: e.attach_hash || "",
                attach_name: e.attach_name || "",
                attach_type: e.attach_type || "",
                download_hash: "",
                attach_url: e.attach_url || "",
                generate_script: e.generate_script || ""
            })) || []
        }
    })

    const {
        fields: containerFields,
        append: appendContainer,
        remove: removeContainer,
    } = useFieldArray({
        control: form.control,
        name: "container_config",
    });

    const {
        fields: attachmentsFields,
        append: appendAttachment,
        remove: removeAttachment,
    } = useFieldArray({
        control: form.control,
        name: "attachments",
    });

    const [showScript, setShowScript] = useState(false);

    function onSubmit(values: z.infer<typeof formSchema>) {
        const finalData = {
            attachments: values.attachments,
            category: values.category.toUpperCase(),
            challenge_id: challenge_info.challenge_id,
            container_config: values.container_config.map((e) => ({
                name: e.name,
                image: e.image,
                command: e.command != "" ? e.command : null,
                env: e.env != "" ? string_to_env(e.env || "") : [],
                expose_ports: e.expose_ports,
            })),
            create_time: challenge_info.create_time,
            description: values.description,
            judge_config: values.judge_config,
            name: values.name,
            type_: challenge_info.type_,
        };
        api.admin.updateChallenge(finalData as ChallengeConfig).then((res) => {
            toast.success("更新成功", { position: "top-center" })
        }).catch((error: AxiosError) => {
            if (error.response?.status) {
                const errorMessage: ErrorMessage = error.response.data as ErrorMessage
                toast.error(errorMessage.message, { position: "top-center" })
            } else {
                toast.error("Unknow Error", { position: "top-center" })
            }
        })
    }

    const router = useRouter()

    useEffect(() => {
        // form.reset(challenge_info as any);
        // form.setValue("category", "MISC")
    }, [])

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
                                Back to challenges
                            </Button>
                        </div>
                        <span className="text-3xl font-bold">Edit - { challenge_info.name }</span>
                        <span className="text-lg font-semibold">基本信息</span>
                        <div className="flex gap-10 items-center">
                            <div className="w-1/3">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center h-[20px]">
                                                <FormLabel>题目名称</FormLabel>
                                                <div className="flex-1" />
                                                <FormMessage className="text-[14px]" />
                                            </div>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                请填写题目名称
                                            </FormDescription>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="w-1/3">
                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center h-[20px]">
                                                <FormLabel>题目类型</FormLabel>
                                                <div className="flex-1" />
                                                <FormMessage className="text-[14px]" />
                                            </div>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="选择一个题目类别" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="w-full flex">
                                                    {Object.keys(categories).map((category) => (
                                                        <SelectItem key={category} value={category}>
                                                            <div className="w-full flex gap-2 items-center h-[30px]">
                                                                {categories[category]}
                                                                <span className="text-[14px] font-bold">{category.toUpperCase()}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                请选择一个评测模式
                                            </FormDescription>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="w-1/3">
                                <FormField
                                    control={form.control}
                                    name="judge_config.judge_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center h-[20px]">
                                                <FormLabel>评测模式</FormLabel>
                                                <div className="flex-1" />
                                                <FormMessage className="text-[14px]" />
                                            </div>
                                            <Select onValueChange={(e) => {
                                                field.onChange(e)
                                                if (e === "SCRIPT") {
                                                    setShowScript(true);
                                                } else {
                                                    setShowScript(false);
                                                }
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
                            </div>
                        </div>
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center h-[20px]">
                                        <FormLabel>题目简介</FormLabel>
                                        <div className="flex-1" />
                                        <FormMessage className="text-[14px]" />
                                    </div>
                                    <FormControl>
                                        <Textarea {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        题目简介
                                    </FormDescription>
                                </FormItem>
                            )}
                        />
                        {showScript ? (
                            <FormField
                                control={form.control}
                                name="judge_config.judge_script"
                                render={({ field }) => (
                                    <FormItem>
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
                                name="judge_config.flag_template"
                                render={({ field }) => (
                                    <FormItem>
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

                        {/* 动态容器列表 */}
                        <div className="mt-6">
                            <div className="flex items-center mb-4">
                                <span className="text-lg font-semibold">容器列表</span>
                                <div className="flex-1" />
                                <Button
                                    type="button"
                                    variant={"outline"}
                                    className="[&_svg]:size-5"
                                    onClick={() =>
                                        appendContainer({
                                            name: "",
                                            image: "",
                                            command: null,
                                            env: null,
                                            expose_ports: [],
                                        })
                                    }
                                >
                                    <PlusCircle />
                                    添加容器
                                </Button>
                            </div>
                            {containerFields.length > 0 ? containerFields.map((container, index) => (
                                <ContainerForm
                                    key={container.id}
                                    control={form.control}
                                    index={index}
                                    removeContainer={removeContainer}
                                />
                            )) : (
                                <span className="text-sm text-foreground/70">还没有容器哦</span>
                            )}
                        </div>

                        <div className="mt-6">
                            <div className="flex items-center mb-4">
                                <span className="text-lg font-semibold">附件列表</span>
                                <div className="flex-1" />
                                <Button
                                    type="button"
                                    variant={"outline"}
                                    className="[&_svg]:size-5"
                                    onClick={() =>
                                        appendAttachment({
                                            attach_hash: null,
                                            attach_name: "",
                                            attach_type: "STATICFILE",
                                            attach_url: "",
                                            download_hash: "",
                                            generate_script: ""
                                        })
                                    }
                                >
                                    <PlusCircle />
                                    添加附件
                                </Button>
                            </div>
                            {attachmentsFields.length > 0 ? attachmentsFields.map((attachment, index) => (
                                <AttachmentForm
                                    key={index}
                                    control={form.control}
                                    index={index}
                                    form={form}
                                    removeAttachment={removeAttachment}
                                />
                            )) : (
                                <span className="text-sm text-foreground/70">还没有附件哦</span>
                            )}
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