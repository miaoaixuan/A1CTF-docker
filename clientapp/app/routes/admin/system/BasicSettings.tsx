import React, { } from "react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import { Save, Upload } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form";
import { SystemSettingsValues } from "./AdminSettingsPage";
import { Switch } from "components/ui/switch";


export const BasicSettings = (
    { form, onSubmit }: {
        form: UseFormReturn<SystemSettingsValues>,
        onSubmit: (value: SystemSettingsValues) => Promise<void>
    }
) => {

    return (
        <>
            <span className="text-2xl font-bold mb-4">基本设置</span>

            <FormField
                control={form.control}
                name="systemName"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center h-[20px]">
                            <FormLabel>系统名称</FormLabel>
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

            <FormField
                control={form.control}
                name="systemSlogan"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center h-[20px]">
                            <FormLabel>系统标语</FormLabel>
                            <div className="flex-1" />
                            <FormMessage className="text-[14px]" />
                        </div>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormDescription>输入系统标语</FormDescription>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="systemFooter"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center h-[20px]">
                            <FormLabel>页脚内容</FormLabel>
                            <div className="flex-1" />
                            <FormMessage className="text-[14px]" />
                        </div>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormDescription>输入页脚内容</FormDescription>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="systemICP"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center h-[20px]">
                            <FormLabel>备案号</FormLabel>
                            <div className="flex-1" />
                            <FormMessage className="text-[14px]" />
                        </div>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormDescription>工信部备案号</FormDescription>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="systemOrganization"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center h-[20px]">
                            <FormLabel>组织名称</FormLabel>
                            <div className="flex-1" />
                            <FormMessage className="text-[14px]" />
                        </div>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormDescription>组织名称</FormDescription>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="systemOrganizationURL"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center h-[20px]">
                            <FormLabel>组织链接</FormLabel>
                            <div className="flex-1" />
                            <FormMessage className="text-[14px]" />
                        </div>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormDescription>组织链接, 支持跳转</FormDescription>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="svgAltData"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center h-[20px]">
                            <FormLabel>图标的AltData</FormLabel>
                            <div className="flex-1" />
                            <FormMessage className="text-[14px]" />
                        </div>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormDescription>长时间悬停在系统图标上显示的 Title</FormDescription>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="schoolUnionAuthText"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center h-[20px]">
                            <FormLabel>统一认证显示名称</FormLabel>
                            <div className="flex-1" />
                            <FormMessage className="text-[14px]" />
                        </div>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormDescription>登录页的统一认证按钮显示名称</FormDescription>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="systemSummary"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center h-[20px]">
                            <FormLabel>系统摘要</FormLabel>
                            <div className="flex-1" />
                            <FormMessage className="text-[14px]" />
                        </div>
                        <FormControl>
                            <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormDescription>系统摘要</FormDescription>
                    </FormItem>
                )}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <FormField
                    control={form.control}
                    name="bgAnimation"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5 mb-[-1px]">
                                <FormLabel>是否启用背景动画</FormLabel>
                                <FormDescription>
                                    背景动画资源占用有点高，可以选择性的关闭
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>
        </>
    );
};

export default BasicSettings; 