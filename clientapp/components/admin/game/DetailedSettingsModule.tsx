import React from 'react';

import { format } from 'date-fns';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
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
import { CalendarIcon, Settings, Upload } from 'lucide-react';
import { cn } from 'lib/utils';
import { useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { EditGameFormSchema } from '../EditGameView';
import * as z from 'zod';
import { api } from 'utils/ApiHelper';
import { AdminFullGameInfo } from 'utils/A1API';

interface DetailedSettingsModuleProps {
    form: UseFormReturn<z.infer<typeof EditGameFormSchema>>;
    game_info: AdminFullGameInfo;
    handleDateSelect: (date: Date | undefined, tmType: 'wp_expire_time') => void;
    handleTimeChange: (
        type: 'hour' | 'minute',
        value: string,
        tmType: 'wp_expire_time'
    ) => void;
    clientConfig: any;
}

export function DetailedSettingsModule({
    form,
    handleDateSelect,
    game_info,
    handleTimeChange,
    clientConfig,
}: DetailedSettingsModuleProps) {
    // 监听 poster 字段变化，用于实时预览
    const watchedPoster = useWatch({ control: form.control, name: 'poster' });


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

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center">
                    <Settings className="h-4 w-4 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold">详细设置</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 左侧表单 */}
                <div className="space-y-6">
                    {/* 邀请码 */}
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
                                <FormDescription>不需要请留空</FormDescription>
                            </FormItem>
                        )}
                    />

                    {/* WP 截止时间 */}
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
                                                    'w-full pl-3 text-left font-normal',
                                                    !field.value && 'text-muted-foreground'
                                                )}
                                            >
                                                {field.value ? format(field.value, 'MM/dd/yyyy HH:mm') : 'MM/DD/YYYY HH:mm'}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <div className="sm:flex">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={(date) => handleDateSelect(date, 'wp_expire_time')}
                                                initialFocus
                                            />
                                            <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                                                {/* 小时 */}
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
                                                                    onClick={() => handleTimeChange('hour', hour.toString(), 'wp_expire_time')}
                                                                >
                                                                    {hour}
                                                                </Button>
                                                            ))}
                                                    </div>
                                                    <ScrollBar orientation="horizontal" className="sm:hidden" />
                                                </ScrollArea>
                                                {/* 分钟 */}
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
                                                                onClick={() => handleTimeChange('minute', minute.toString(), 'wp_expire_time')}
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
                                <FormDescription>请选择WP截止时间</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* 队伍人数限制 */}
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
                                <FormDescription>队伍人数限制</FormDescription>
                            </FormItem>
                        )}
                    />

                    {/* 容器数量限制 */}
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
                                <FormDescription>队伍容器数量限制</FormDescription>
                            </FormItem>
                        )}
                    />
                </div>

                {/* 右侧海报上传 */}
                <div className="h-fit">
                    <div className="aspect-[4/3] rounded-xl border border-border/50 shadow-md relative overflow-hidden bg-gradient-to-br from-muted/20 to-muted/10 group">
                        <div
                            className="absolute top-0 left-0 w-full h-full bg-cover bg-center z-10"
                            style={{ backgroundImage: `url(${watchedPoster || clientConfig.DefaultBGImage})` }}
                        />
                        <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:bg-background group-hover:opacity-85 z-20 transition-all duration-300 flex items-center justify-center cursor-pointer">
                            <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:text-primary transition-colors duration-300 pointer-events-none">
                                <Upload size={40} />
                                <span className="text-lg font-medium">上传海报</span>
                                <span className="text-sm text-center">点击上传新的比赛海报</span>
                            </div>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-30"
                            onChange={handlePosterUpload}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
} 