import React, {  } from "react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Switch } from "components/ui/switch";
import { Upload } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form";
import { SystemSettingsValues } from "./AdminSettingsPage";
import ImageUploader from "components/modules/ImageUploader";
import { SystemResourceType } from "utils/A1API";
import { api, createSkipGlobalErrorConfig } from "utils/ApiHelper";
import { toast } from 'react-toastify/unstyled';

export const ResourceSettings = (
    { 
        form
    } : {
        form: UseFormReturn<SystemSettingsValues>
    }
) => {

    interface ResourceItem {
        type: SystemResourceType,
        name: string,
        description?: string,
        darkBackground?: boolean,
        formValue: string
    }

    const resourceList: ResourceItem[] = [
        {
            type: SystemResourceType.FancyBackGroundIconBlack,
            name: "背景图标(浅色模式)",
            formValue: "fancyBackGroundIconBlack"
        },
        {
            type: SystemResourceType.FancyBackGroundIconWhite,
            name: "背景图标(深色模式)",
            formValue: "fancyBackGroundIconWhite",
            darkBackground: true,
        },
        {
            type: SystemResourceType.SvgIconDark,
            name: "系统图标(深色模式)",
            darkBackground: true,
            formValue: "svgIconDark"
        },
        {
            type: SystemResourceType.SvgIconLight,
            name: "系统图标(浅色模式)",
            formValue: "svgIconLight"
        },
        {
            type: SystemResourceType.TrophysGold,
            name: "一血金奖杯图标",
            description: "一血的时候展示在屏幕上的图标",
            formValue: "trophysGold"
        },
        {
            type: SystemResourceType.TrophysSilver,
            name: "二血银奖杯图标",
            description: "二血播报的时候展示在屏幕上的图标",
            formValue: "trophysSilver"
        },
        {
            type: SystemResourceType.TrophysBronze,
            name: "三血铜奖杯图标",
            description: "三血播报的时候展示在屏幕上的图标",
            formValue: "trophysBronze"
        },
        {
            type: SystemResourceType.SchoolLogo,
            name: "学校Logo(大)",
            description: "你的学校或者组织的大图标",
            formValue: "schoolLogo",
            darkBackground: true
        },
        {
            type: SystemResourceType.SchoolLogo,
            name: "学校Logo(小)",
            description: "你的学校或者组织的小图标",
            formValue: "schoolSmallIcon",
            darkBackground: true
        }
    ]

    const handleImageUpload = (resource: ResourceItem) => {
        return (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) {
                api.system.uploadSystemFile({
                    file: file,
                    resource_type: resource.type,
                }, createSkipGlobalErrorConfig()).then((res) => {
                    if (res.status === 200) {
                        form.setValue(resource.formValue as any, `/api/file/download/${res.data.data.file_id}`);
                        toast.success(`${resource.name} 上传成功`)
                    }
                }).catch((err) => {
                    toast.error(`${resource.name} 上传失败`)
                })
            }
        }
    };

    return (
        <>
            <span className="text-2xl font-bold mb-4">资源设置</span>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
                { resourceList.map((resource, idx) => (
                    <FormField
                        control={form.control}
                        key={idx}
                        name={resource.formValue as any}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{ resource.name }</FormLabel>
                                <FormControl>
                                    <ImageUploader 
                                        src={field.value ?? "#"}
                                        backgroundTheme={ resource.darkBackground ? "dark" : "light" }
                                        onChange={handleImageUpload(resource)}
                                        size={180}
                                        imageFit="object-contain"
                                    />
                                </FormControl>
                                { resource.description && (
                                    <FormDescription>{ resource.description }</FormDescription>
                                ) }
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )) }
            </div>
            
            <FormField
                control={form.control}
                name="fancyBackGroundIconWidth"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center h-[20px]">
                            <FormLabel>背景图标宽度</FormLabel>
                            <div className="flex-1" />
                            <FormMessage className="text-[14px]" />
                        </div>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormDescription>背景动画里每个图片的宽度, 请务必正确指定</FormDescription>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="fancyBackGroundIconHeight"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center h-[20px]">
                            <FormLabel>背景图标高度</FormLabel>
                            <div className="flex-1" />
                            <FormMessage className="text-[14px]" />
                        </div>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormDescription>背景动画里每个图片的高度, 请务必正确指定</FormDescription>
                    </FormItem>
                )}
            />
            
        </>
    );
};

export default ResourceSettings; 