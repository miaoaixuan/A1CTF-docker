import React, {  } from "react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import { Upload } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form";
import { SystemSettingsValues } from "./AdminSettingsPage";


export const BasicSettings = (
    { form, logoPreview, faviconPreview, handleImageUpload } : {
        form: UseFormReturn<SystemSettingsValues>,
        logoPreview: string | null,
        faviconPreview: string | null,
        handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>, type: string) => Promise<void>
    }
) => {

    return (
        <>
            <span className="text-2xl font-bold">基本设置</span>
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
        </>
    );
};

export default BasicSettings; 