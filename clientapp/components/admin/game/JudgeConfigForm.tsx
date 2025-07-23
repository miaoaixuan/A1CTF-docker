import React from 'react';

import { Input } from 'components/ui/input';
import { Textarea } from 'components/ui/textarea';
import {
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormControl,
    FormDescription,
} from 'components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select';
import { Switch } from 'components/ui/switch';
import { useFieldArray, useWatch } from 'react-hook-form';
import CodeEditor from '@uiw/react-textarea-code-editor';
import dayjs from 'dayjs';
import { ScanBarcode, FileCode, ClockArrowUp, PlusCircle } from 'lucide-react';
import { Button } from 'components/ui/button';

interface JudgeConfigFormProps {
    /** react-hook-form control 对象 */
    control: any;
    /** 当前题目的索引 */
    index: number;
    /** 传入整个 form 实例, 用于校验 */
    form: any;
}

/**
 * 比赛题目评测配置表单
 * 从 EditGameView.tsx 中抽离出的子模块, 使主文件更简洁
 */
export function JudgeConfigForm({ control, index, form }: JudgeConfigFormProps) {
    // 根据评测类型动态渲染 flag / script 输入框
    const attachType = useWatch({
        control,
        name: `challenges.${index}.judge_config.judge_type`,
    });

    // Hints 动态字段
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
            {/* 评测模式选择 */}
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
                        <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                        >
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
                        <FormDescription>请选择一个类别</FormDescription>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="challenges.${index}.enable_blood_reward"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/50 p-4">
                        <div className="space-y-0.5">
                            <FormLabel>三血加分</FormLabel>
                            <FormDescription>是否开启三血加分</FormDescription>
                        </div>
                        <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                )}
            />

            {/* 根据评测模式渲染不同输入 */}
            {attachType === 'SCRIPT' ? (
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
                                        minHeight: 200,
                                        borderRadius: 5,
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

            {/* 所属阶段 */}
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
                        {/* 这里的 Select 由父组件传入 stages 值, 不在此展开 */}
                    </FormItem>
                )}
            />

            {/* 题目总分 */}
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
                            <Input {...field} value={field.value ?? ''} />
                        </FormControl>
                        <div className="flex flex-col text-[12px] text-foreground/60">
                            <span>这里是题目的最大分数</span>
                            <span>在开启动态积分的情况下，积分会自动衰减</span>
                        </div>
                    </FormItem>
                )}
            />

            {/* Hints */}
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

            {hintFields.length > 0 ? (
                <div className="flex flex-col gap-4">
                    {hintFields.map((e, hintIndex) => (
                        <div className="w-full flex flex-col" key={e.id}>
                            <div className="flex gap-2 items-center mb-4 select-none">
                                <FormField
                                    control={control}
                                    name={`challenges.${index}.hints.${hintIndex}.visible`}
                                    render={({ field }) => (
                                        <FormItem className="flex">
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={(v) => {
                                                    field.onChange(v)
                                                    form.setValue(`challenges.${index}.hints.${hintIndex}.create_time`, new Date())
                                                }} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name={`challenges.${index}.hints.${hintIndex}.create_time`}
                                    render={({ field }) => (
                                        <FormItem className="flex">
                                            <FormControl>
                                                <div className="bg-foreground/[0.03] flex gap-2 items-center px-[9px] py-[5px] rounded-full">
                                                    <ClockArrowUp size={20} />
                                                    <span className="text-sm">
                                                        {field.value ? dayjs(field.value).format('YYYY-MM-DD HH:mm:ss') : ''}
                                                    </span>
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
                                        <FormControl>
                                            <Textarea value={field.value ?? ''} onChange={(v) => {
                                                field.onChange(v)
                                                form.setValue(`challenges.${index}.hints.${hintIndex}.create_time`, new Date())
                                            }} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <span className="text-sm mt-[-10px]">还没有提示哦</span>
            )}
        </>
    );
} 