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

import { useFieldArray, Controller } from "react-hook-form";

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

import { CalendarIcon, FileCode, Github, PlusCircle, ScanBarcode } from "lucide-react"
import { Calendar } from "../ui/calendar";

import { format } from "date-fns"
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";

import CodeEditor from '@uiw/react-textarea-code-editor';

import { BadgeCent, Binary, Bot, Bug, FileSearch, GlobeLock, HardDrive, MessageSquareLock, Radar, Smartphone, SquareCode } from "lucide-react"
import { useEffect, useState } from "react";
import Link from "next/link";

interface ContainerFormProps {
    control: any;
    index: number;
    removeContainer: (index: number) => void;
}

function ContainerForm({ control, index, removeContainer }: ContainerFormProps) {
    // 在子组件中调用 useFieldArray 用于管理当前容器的 expose_ports
    const {
        fields: portFields,
        append: appendPort,
        remove: removePort,
    } = useFieldArray({
        control,
        name: `container_config.${index}.expose_ports`,
    });

    return (
        <div className="border p-4 mb-4 rounded">
            <div className="flex justify-between items-center mb-2">
                <h5 className="font-medium">容器 {index + 1}</h5>
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
                                <div className="flex-1"/>
                                <FormMessage className="text-[14px]"/>
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
                                <div className="flex-1"/>
                                <FormMessage className="text-[14px]"/>
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
                                <div className="flex-1"/>
                                <FormMessage className="text-[14px]"/>
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
                                <div className="flex-1"/>
                                <FormMessage className="text-[14px]"/>
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
                <div className="flex items-center mb-4">
                    <span className="text-lg font-semibold">端口暴露</span>
                    <div className="flex-1"/>
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
                <div className="h-4"/>
                {portFields.map((port, portIndex) => (
                    <div key={port.id} className="flex gap-2 items-end mb-2">
                        <FormField
                            control={control}
                            name={`container_config.${index}.expose_ports.${portIndex}.name`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <div className="flex items-center w- h-[20px]">
                                        <FormLabel>端口名称</FormLabel>
                                        <div className="flex-1"/>
                                        <FormMessage className="text-[14px]"/>
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
                                        <div className="flex-1"/>
                                        <FormMessage className="text-[14px]"/>
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

export function CreateChallengeView() {

    const formSchema = z.object({
        challenge_name: z.string().min(2, { message: "名字太短了" }),
        description: z.string(),
        category: z.string({
            required_error: "需要选择一个题目类别",
        }),
        judge_type: z.string({
            required_error: "请选择评测规则",
        }),
        judge_script: z.string().optional(),
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
                            z.number({ invalid_type_error: "请输入数字" })
                        ),
                    })
                ),
            })
        ),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            challenge_name: "",
            description: "",
            category: "",
            judge_type: "",
            judge_script: "",
            container_config: [
                // 可以预置一个空容器作为示例
                // {
                //     name: "",
                //     image: "",
                //     command: null,
                //     env: null,
                //     expose_ports: [
                //         {
                //             name: "",
                //             port: 0,
                //         },
                //     ],
                // },
            ],
        },
    })

    const {
        fields: containerFields,
        append: appendContainer,
        remove: removeContainer,
    } = useFieldArray({
        control: form.control,
        name: "container_config",
    });

    const [showScript, setShowScript] = useState(false);

    function onSubmit(values: z.infer<typeof formSchema>) {
        // const finalData = {
        //   attachments: [
        //     {
        //       attach_hash: null,
        //       attach_name: "flag",
        //       attach_type: "STATICFILE",
        //       attach_url: "flag{test}",
        //       generate_script: null,
        //     },
        //   ],
        //   category: values.category.toUpperCase(),
        //   challenge_id: 1,
        //   container_config: values.container_config,
        //   create_time: new Date().toISOString(),
        //   description: values.description,
        //   judge_config: {
        //     flag_template: "flag{TEST}",
        //     judge_script: values.judge_type === "SCRIPT" ? values.judge_script : null,
        //     judge_type: values.judge_type === "SCRIPT" ? "SCRIPT" : "STATIC",
        //   },
        //   name: values.challenge_name,
        //   type_: 0,
        // };
        console.log("最终生成的 JSON 数据：", values);
        // 可将 finalData 提交到后端接口
    }

    const categories: { [key: string]: any } = {
        "misc": <Radar size={23} />,
        "crypto": <MessageSquareLock size={23} />,
        "pwn": <Bug size={23} />,
        "web": <GlobeLock size={23} />,
        "reverse": <Binary size={23} />,
        "forensics": <FileSearch size={23} />,
        "hardware": <HardDrive size={23} />,
        "mobile": <Smartphone size={23} />,
        "ppc": <SquareCode size={23} />,
        "ai": <Bot size={23} />,
        "pentent": <BadgeCent size={23} />,
        "osint": <Github size={23} />
    };

    return (
        <div className="absolute w-screen h-screen bg-background items-center justify-center flex select-none overflow-x-hidden">
            <div className="w-[80%] h-[90%]">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-20">
                        <div className="flex gap-10 items-center">
                            <div className="w-1/3">
                                <FormField
                                    control={form.control}
                                    name="challenge_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center h-[20px]">
                                                <FormLabel>题目名称</FormLabel>
                                                <div className="flex-1"/>
                                                <FormMessage className="text-[14px]"/>
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
                                                <div className="flex-1"/>
                                                <FormMessage className="text-[14px]"/>
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
                                                                <span className="text-[15px] font-bold">{category.toUpperCase()}</span>
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
                                    name="judge_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center h-[20px]">
                                                <FormLabel>评测模式</FormLabel>
                                                <div className="flex-1"/>
                                                <FormMessage className="text-[14px]"/>
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
                                                    <SelectItem value="SCRIPT">
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
                                        <div className="flex-1"/>
                                        <FormMessage className="text-[14px]"/>
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
                        {showScript && (
                            <FormField
                                control={form.control}
                                name="judge_script"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center h-[20px]">
                                            <FormLabel>评测脚本</FormLabel>
                                            <div className="flex-1"/>
                                            <FormMessage className="text-[14px]"/>
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
                        )}

                        {/* 动态容器列表 */}
                        <div className="mt-6">
                            <div className="flex items-center mb-4">
                                <span className="text-lg font-semibold">容器列表</span>
                                <div className="flex-1"/>
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
                            {containerFields.map((container, index) => (
                                <ContainerForm
                                    key={container.id}
                                    control={form.control}
                                    index={index}
                                    removeContainer={removeContainer}
                                />
                            ))}
                        </div>

                        <Button type="submit">提交</Button>
                    </form>
                </Form>
            </div>
        </div>
    );
}