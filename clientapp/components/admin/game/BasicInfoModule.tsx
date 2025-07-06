import React from 'react';

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
import { CalendarIcon, FilePenLine } from 'lucide-react';

interface BasicInfoModuleProps {
    form: any;
    handleDateSelect: (date: Date | undefined, tmType: 'start_time' | 'end_time') => void;
    handleTimeChange: (
        type: 'hour' | 'minute',
        value: string,
        tmType: 'start_time' | 'end_time'
    ) => void;
}

/**
 * 基本信息管理模块
 * 从 EditGameView.tsx 中抽离，提升主组件可读性
 */
export function BasicInfoModule({ form, handleDateSelect, handleTimeChange }: BasicInfoModuleProps) {
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
                            <div className="flex items-center h-[20px]">
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
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            type="button"
                                            className={cn(
                                                'w-full pl-3 text-left font-normal',
                                                !field.value && 'text-muted-foreground'
                                            )}
                                        >
                                            {field.value ? format(field.value, 'MM/dd/yyyy HH:mm') : <span>MM/DD/YYYY HH:mm</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <div className="sm:flex">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={(date) => handleDateSelect(date, 'start_time')}
                                            initialFocus
                                        />
                                        <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                                            {/* 小时选择 */}
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
                                                                    field.value && field.value.getHours() === hour ? 'default' : 'ghost'
                                                                }
                                                                className="sm:w-full shrink-0 aspect-square"
                                                                onClick={() => handleTimeChange('hour', hour.toString(), 'start_time')}
                                                            >
                                                                {hour}
                                                            </Button>
                                                        ))}
                                                </div>
                                                <ScrollBar orientation="horizontal" className="sm:hidden" />
                                            </ScrollArea>
                                            {/* 分钟选择 */}
                                            <ScrollArea className="w-64 sm:w-auto">
                                                <div className="flex sm:flex-col p-2">
                                                    {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                                                        <Button
                                                            type="button"
                                                            key={minute}
                                                            size="icon"
                                                            variant={
                                                                field.value && field.value.getMinutes() === minute ? 'default' : 'ghost'
                                                            }
                                                            className="sm:w-full shrink-0 aspect-square"
                                                            onClick={() => handleTimeChange('minute', minute.toString(), 'start_time')}
                                                        >
                                                            {minute.toString().padStart(2, '0')}
                                                        </Button>
                                                    ))}
                                                </div>
                                                <ScrollBar orientation="horizontal" className="sm:hidden" />
                                            </ScrollArea>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
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
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            type="button"
                                            variant={"outline"}
                                            className={cn(
                                                'w-full pl-3 text-left font-normal',
                                                !field.value && 'text-muted-foreground'
                                            )}
                                        >
                                            {field.value ? format(field.value, 'MM/dd/yyyy HH:mm') : <span>MM/DD/YYYY HH:mm</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <div className="sm:flex">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={(date) => handleDateSelect(date, 'end_time')}
                                            initialFocus
                                        />
                                        <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                                            {/* 小时选择 */}
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
                                                                    field.value && field.value.getHours() === hour ? 'default' : 'ghost'
                                                                }
                                                                className="sm:w-full shrink-0 aspect-square"
                                                                onClick={() => handleTimeChange('hour', hour.toString(), 'end_time')}
                                                            >
                                                                {hour}
                                                            </Button>
                                                        ))}
                                                </div>
                                                <ScrollBar orientation="horizontal" className="sm:hidden" />
                                            </ScrollArea>
                                            {/* 分钟选择 */}
                                            <ScrollArea className="w-64 sm:w-auto">
                                                <div className="flex sm:flex-col p-2">
                                                    {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                                                        <Button
                                                            type="button"
                                                            key={minute}
                                                            size="icon"
                                                            variant={
                                                                field.value && field.value.getMinutes() === minute ? 'default' : 'ghost'
                                                            }
                                                            className="sm:w-full shrink-0 aspect-square"
                                                            onClick={() => handleTimeChange('minute', minute.toString(), 'end_time')}
                                                        >
                                                            {minute.toString().padStart(2, '0')}
                                                        </Button>
                                                    ))}
                                                </div>
                                                <ScrollBar orientation="horizontal" className="sm:hidden" />
                                            </ScrollArea>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
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
                                <Textarea {...field} className="h-[300px]" />
                            </FormControl>
                            <FormDescription>比赛详细信息 (支持Markdown)</FormDescription>
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
        </div>
    );
} 