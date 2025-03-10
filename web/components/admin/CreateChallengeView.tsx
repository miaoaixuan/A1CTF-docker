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

import { CalendarIcon, FileCode, Github, ScanBarcode } from "lucide-react"
import { Calendar } from "../ui/calendar";

import { format } from "date-fns"
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";

import CodeEditor from '@uiw/react-textarea-code-editor';

import { BadgeCent, Binary, Bot, Bug, FileSearch, GlobeLock, HardDrive, MessageSquareLock, Radar, Smartphone, SquareCode } from "lucide-react"
import { useEffect, useState } from "react";

export function CreateChallengeView() {

    const formSchema = z.object({
        challenge_name: z.string().min(2, {
            message: "名字太短了"
        }),
        description: z.string(),
        category: z.string({
            required_error: "需要选择一个题目类别",
        }),
        judge_type: z.string({
            required_error: "请选择评判规则",
        }),
        judge_script: z.string({
            required_error: "请提供评测脚本",
        }),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            challenge_name: ""
        },
    })

    const [showScript, setShowScript] = useState(false);


    function onSubmit(values: z.infer<typeof formSchema>) {

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
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="flex gap-10 items-center">
                            <div className="w-1/3">
                                <FormField
                                    control={form.control}
                                    name="challenge_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>题目名称</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                请填写题目名称
                                            </FormDescription>
                                            <FormMessage />
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
                                            <FormLabel>题目类型</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="选择一个题目类别" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="w-full flex">
                                                    { Object.keys(categories).map((category) => (
                                                        <SelectItem key={category} value={ category }>
                                                            <div className="w-full flex gap-2 items-center h-[30px]">
                                                                { categories[category] }
                                                                <span className="text-[15px] font-bold">{ category.toUpperCase() }</span>
                                                            </div>
                                                        </SelectItem>
                                                    )) }
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                请选择一个评测模式
                                            </FormDescription>
                                            <FormMessage />
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
                                            <FormLabel>评测模式</FormLabel>
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
                                                        <div className="w-full flex gap-2 items-center h-[30px]">
                                                            <ScanBarcode />
                                                            <span className="text-[15px] font-bold">文字匹配</span>
                                                        </div>
                                                    </SelectItem>
                                                    <SelectItem value="SCRIPT">
                                                        <div className="w-full flex gap-2 items-center h-[30px]">
                                                            <FileCode />
                                                            <span className="text-[15px] font-bold">脚本匹配</span>
                                                        </div>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>
                                                请选择一个类别
                                            </FormDescription>
                                            <FormMessage />
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
                                    <FormLabel>题目简介</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        题目简介
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        { showScript && (
                            <FormField
                                control={form.control}
                                name="judge_script"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>评测脚本</FormLabel>
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
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </form>
                </Form>
            </div>
        </div>
    );
}