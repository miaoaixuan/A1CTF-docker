import React from 'react';

import { Input } from 'components/ui/input';
import {
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
    FormControl,
} from 'components/ui/form';
import { Settings, Upload } from 'lucide-react';
import { useWatch } from 'react-hook-form';
import { toast } from 'react-toastify/unstyled';
import { UseFormReturn } from 'react-hook-form';
import { EditGameFormSchema } from './EditGameSchema';
import * as z from 'zod';
import { api } from 'utils/ApiHelper';
import { AdminFullGameInfo } from 'utils/A1API';
import { Slider } from 'components/ui/slider';
import { DateTimePicker24h } from 'components/ui/data-time-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select';

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
    handleDateSelect: _handleDateSelect,
    game_info,
    handleTimeChange: _handleTimeChange,
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

        const formData = new FormData();
        formData.append('poster', file);

        api.admin.uploadGamePoster(game_info.game_id, { poster: file }).then((res) => {
            // 更新表单中的poster字段
            form.setValue('poster', res.data.poster_url);
            toast.success('海报上传成功');
        })

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

                    {/* 队伍策略 */}
                    <FormField
                        control={form.control}
                        name="team_policy"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center h-[20px]">
                                    <FormLabel>队伍策略</FormLabel>
                                    <div className="flex-1" />
                                    <FormMessage className="text-[14px]" />
                                </div>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="选择队伍策略" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="w-full flex">
                                        <SelectItem key="Manual" value="Manual">
                                            管理员手动审核
                                        </SelectItem>
                                        <SelectItem key="Auto" value="Auto">
                                            自动审核
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    请选择一个队伍策略
                                </FormDescription>
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
                                <DateTimePicker24h
                                    date={field.value}
                                    setDate={field.onChange}
                                />
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
                                    <div className='flex items-center gap-2'>
                                        <Slider
                                            min={1}
                                            max={100}
                                            step={1}
                                            value={[field.value]}
                                            onValueChange={field.onChange}
                                        />
                                        <div className='flex-1' />
                                        <span className='w-10'>{field.value}</span>
                                    </div>
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
                                    <div className='flex items-center gap-2'>
                                        <Slider
                                            min={1}
                                            max={10}
                                            step={1}
                                            value={[field.value]}
                                            onValueChange={field.onChange}
                                        />
                                        <div className='flex-1' />
                                        <span className='w-10'>{field.value}</span>
                                    </div>
                                </FormControl>
                                <FormDescription>队伍容器数量限制</FormDescription>
                            </FormItem>
                        )}
                    />

                    {/* 一血加分比例 */}
                    <FormField
                        control={form.control}
                        name="first_blood_reward"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center h-[20px]">
                                    <FormLabel>一血加分比例</FormLabel>
                                    <div className="flex-1" />
                                    <FormMessage className="text-[14px]" />
                                </div>
                                <FormControl>
                                    <div className='flex items-center gap-2'>
                                        <Slider
                                            min={0}
                                            max={100}
                                            step={1}
                                            value={[field.value]}
                                            onValueChange={field.onChange}
                                        />
                                        <div className='flex-1' />
                                        <span className='w-10'>{field.value}%</span>
                                    </div>
                                </FormControl>
                                <FormDescription>0%即为关闭</FormDescription>
                            </FormItem>
                        )}
                    />

                    {/* 二血加分比例 */}
                    <FormField
                        control={form.control}
                        name="second_blood_reward"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center h-[20px]">
                                    <FormLabel>二血加分比例</FormLabel>
                                    <div className="flex-1" />
                                    <FormMessage className="text-[14px]" />
                                </div>
                                <FormControl>
                                    <div className='flex items-center gap-2'>
                                        <Slider
                                            min={0}
                                            max={100}
                                            step={1}
                                            value={[field.value]}
                                            onValueChange={field.onChange}
                                        />
                                        <div className='flex-1' />
                                        <span className='w-10'>{field.value}%</span>
                                    </div>
                                </FormControl>
                                <FormDescription>0%即为关闭</FormDescription>
                            </FormItem>
                        )}
                    />

                    {/* 三血加分比例 */}
                    <FormField
                        control={form.control}
                        name="third_blood_reward"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center h-[20px]">
                                    <FormLabel>三血加分比例</FormLabel>
                                    <div className="flex-1" />
                                    <FormMessage className="text-[14px]" />
                                </div>
                                <FormControl>
                                    <div className='flex items-center gap-2'>
                                        <Slider
                                            min={0}
                                            max={100}
                                            step={1}
                                            value={[field.value]}
                                            onValueChange={field.onChange}
                                        />
                                        <div className='flex-1' />
                                        <span className='w-10'>{field.value}%</span>
                                    </div>
                                </FormControl>
                                <FormDescription>0%即为关闭</FormDescription>
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