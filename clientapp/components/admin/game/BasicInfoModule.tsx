import React, { useRef } from 'react';

import { format } from 'date-fns';
import { Switch } from 'components/ui/switch';
import { cn } from 'lib/utils';

import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Textarea } from 'components/ui/textarea';
import {
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
    FormControl,
} from 'components/ui/form';
import { Popover, PopoverTrigger, PopoverContent } from 'components/ui/popover';
import { Calendar } from 'components/ui/calendar';
import { ScrollArea, ScrollBar } from 'components/ui/scroll-area';
import { CalendarIcon, FilePenLine, Upload } from 'lucide-react';
import ImageUploader from 'components/modules/ImageUploader';
import { api } from 'utils/ApiHelper';
import { SystemResourceType } from 'utils/A1API';
import { DateTimePicker24h } from 'components/ui/data-time-picker';
import { Editor } from '@monaco-editor/react';

interface BasicInfoModuleProps {
    form: any;
    handleDateSelect: (date: Date | undefined, tmType: 'start_time' | 'end_time') => void;
    handleTimeChange: (
        type: 'hour' | 'minute',
        value: string,
        tmType: 'start_time' | 'end_time'
    ) => void;
    gameID: number;
}

/**
 * 基本信息管理模块
 * 从 EditGameView.tsx 中抽离，提升主组件可读性
 */
export function BasicInfoModule({ form, handleDateSelect, handleTimeChange, gameID }: BasicInfoModuleProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (type: SystemResourceType) => {
        return (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) {
                api.system.uploadSystemFile({
                    file: file,
                    resource_type: type,
                    data: gameID.toString(),
                }).then((res) => {
                    if (res.status === 200) {
                        switch (type) {
                            case SystemResourceType.GameIconLight:
                                form.setValue("game_icon_light", `/api/file/download/${res.data.data.file_id}`);
                                break;
                            case SystemResourceType.GameIconDark:
                                form.setValue("game_icon_dark", `/api/file/download/${res.data.data.file_id}`);
                        }
                    }
                })
            }
        }
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                    <FilePenLine className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold">基本信息</h2>
            </div>

            {/* 比赛名称 / 开始结束时间 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* 名称 */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center">
                                <FormLabel>比赛名称</FormLabel>
                                <div className="flex-1" />
                                <FormMessage className="text-[14px]" />
                            </div>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormDescription>请填写比赛名称</FormDescription>
                        </FormItem>
                    )}
                />

                {/* 开始时间 */}
                <FormField
                    control={form.control}
                    name={`start_time`}
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>开始时间</FormLabel>
                            <DateTimePicker24h
                                date={field.value}
                                setDate={field.onChange}
                            />
                            <FormDescription>请选择比赛开始时间</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* 结束时间 */}
                <FormField
                    control={form.control}
                    name={`end_time`}
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>结束时间</FormLabel>
                            <DateTimePicker24h
                                date={field.value}
                                setDate={field.onChange}
                            />
                            <FormDescription>请选择比赛结束时间</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* 简介、描述 */}
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
                                <Textarea {...field} className="h-[100px]" />
                            </FormControl>
                            <FormDescription>比赛简介</FormDescription>
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
                                <div className="w-full h-[500px] pt-4 bg-[#1e1e1e] rounded-lg overflow-hidden">
                                    <Editor
                                        height="100%"
                                        width="100%"
                                        defaultLanguage="markdown"
                                        theme='vs-dark'
                                        defaultValue={field.value}
                                        onChange={(value) => {
                                            form.setValue("description", value)
                                        }}
                                    />
                                </div>
                            </FormControl>
                            <FormDescription>比赛详细信息 (支持Markdown)</FormDescription>
                        </FormItem>
                    )}
                />

                {/* <FormField
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
                                <Textarea {...field} className="h-[300px]" />
                            </FormControl>
                            <FormDescription>比赛详细信息 (支持Markdown)</FormDescription>
                        </FormItem>
                    )}
                /> */}
            </div>

            {/* 开关设置 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
                <FormField
                    control={form.control}
                    name="practice_mode"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 p-4">
                            <div className="space-y-0.5">
                                <FormLabel>练习模式</FormLabel>
                                <FormDescription>是否开启练习模式</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="require_wp"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 p-4">
                            <div className="space-y-0.5">
                                <FormLabel>WriteUP</FormLabel>
                                <FormDescription>是否需要提交 WriteUP</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="visible"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 p-4">
                            <div className="space-y-0.5">
                                <FormLabel>是否可见</FormLabel>
                                <FormDescription>比赛是否可见</FormDescription>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>

            {/* 比赛图标 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
                <FormField
                    control={form.control}
                    name="game_icon_dark"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>比赛图标(深色)</FormLabel>
                            <FormControl>
                                <ImageUploader
                                    src={field.value}
                                    backgroundTheme='dark'
                                    onChange={handleImageUpload(SystemResourceType.GameIconDark)}
                                />
                            </FormControl>
                            <FormDescription>比赛图标</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="game_icon_light"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>比赛图标(浅色)</FormLabel>
                            <FormControl>
                                <ImageUploader
                                    src={field.value}
                                    backgroundTheme='light'
                                    onChange={handleImageUpload(SystemResourceType.GameIconLight)}
                                />
                            </FormControl>
                            <FormDescription>比赛图标</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
} 