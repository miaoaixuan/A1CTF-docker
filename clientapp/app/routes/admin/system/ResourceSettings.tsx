import React, {  } from "react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Switch } from "components/ui/switch";
import { Upload } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form";
import { SystemSettingsValues } from "./AdminSettingsPage";

export const ResourceSettings = (
    { 
        form, 
        fancyWhitePreview, 
        fancyBlackPreview, 
        bgImagePreview, 
        svgIconPreview, 
        goldTrophyPreview, 
        silverTrophyPreview, 
        handleImageUpload,
        bronzeTrophyPreview,
        schoolLogoPreview,
        schoolSmallIconPreview
    } : {
        form: UseFormReturn<SystemSettingsValues>,
        fancyWhitePreview: string | null,
        fancyBlackPreview: string | null,
        bgImagePreview: string | null,
        svgIconPreview: string | null,
        goldTrophyPreview: string | null,
        silverTrophyPreview: string | null,
        handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>, type: string) => Promise<void>,
        bronzeTrophyPreview: string | null,
        schoolLogoPreview: string | null,
        schoolSmallIconPreview: string | null
    }
) => {

    return (
        <>
            <span className="text-2xl font-bold">资源设置</span>
            <div className="grid gap-6 md:grid-cols-2">
                {/* 背景图标白色 */}
                <div className="space-y-2">
                    <Label htmlFor="fancyWhiteUpload">背景图标(白色)</Label>
                    <div className="flex items-center gap-4">
                        {fancyWhitePreview && (
                            <div className="relative w-20 h-20 border rounded bg-gray-700">
                                <img
                                    src={fancyWhitePreview}
                                    alt="白色图标预览"
                                    className="object-contain p-2 w-full h-full"
                                />
                            </div>
                        )}
                        <Button variant="outline" className="flex gap-2" asChild>
                            <label htmlFor="fancyWhiteUpload">
                                <Upload size={16} />
                                上传图标
                                <input
                                    id="fancyWhiteUpload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(e, "fancyWhite")}
                                />
                            </label>
                        </Button>
                    </div>
                </div>

                {/* 背景图标黑色 */}
                <div className="space-y-2">
                    <Label htmlFor="fancyBlackUpload">背景图标(黑色)</Label>
                    <div className="flex items-center gap-4">
                        {fancyBlackPreview && (
                            <div className="relative w-20 h-20 border rounded">
                                <img
                                    src={fancyBlackPreview}
                                    alt="黑色图标预览"
                                    className="object-contain p-2 w-full h-full"
                                />
                            </div>
                        )}
                        <Button variant="outline" className="flex gap-2" asChild>
                            <label htmlFor="fancyBlackUpload">
                                <Upload size={16} />
                                上传图标
                                <input
                                    id="fancyBlackUpload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(e, "fancyBlack")}
                                />
                            </label>
                        </Button>
                    </div>
                </div>

                {/* 默认背景图 */}
                <div className="space-y-2">
                    <Label htmlFor="bgImageUpload">默认背景图</Label>
                    <div className="flex items-center gap-4">
                        {bgImagePreview && (
                            <div className="relative w-24 h-16 border rounded">
                                <img
                                    src={bgImagePreview}
                                    alt="背景图预览"
                                    className="object-cover p-1 w-full h-full"
                                />
                            </div>
                        )}
                        <Button variant="outline" className="flex gap-2" asChild>
                            <label htmlFor="bgImageUpload">
                                <Upload size={16} />
                                上传背景
                                <input
                                    id="bgImageUpload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(e, "bgImage")}
                                />
                            </label>
                        </Button>
                    </div>
                </div>

                {/* SVG图标 */}
                <div className="space-y-2">
                    <Label htmlFor="svgIconUpload">SVG图标</Label>
                    <div className="flex items-center gap-4">
                        {svgIconPreview && (
                            <div className="relative w-20 h-20 border rounded">
                                <img
                                    src={svgIconPreview}
                                    alt="SVG图标预览"
                                    className="object-contain p-2 w-full h-full"
                                />
                            </div>
                        )}
                        <Button variant="outline" className="flex gap-2" asChild>
                            <label htmlFor="svgIconUpload">
                                <Upload size={16} />
                                上传SVG
                                <input
                                    id="svgIconUpload"
                                    type="file"
                                    accept="image/svg+xml"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(e, "svgIcon")}
                                />
                            </label>
                        </Button>
                    </div>
                </div>

                {/* SVG Alt文本 */}
                <FormField
                    control={form.control}
                    name="svgAltData"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>SVG Alt文本</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="SVG图标的替代文本" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* 金奖杯 */}
                <div className="space-y-2">
                    <Label htmlFor="goldTrophyUpload">金奖杯图标</Label>
                    <div className="flex items-center gap-4">
                        {goldTrophyPreview && (
                            <div className="relative w-16 h-16 border rounded">
                                <img
                                    src={goldTrophyPreview}
                                    alt="金奖杯预览"
                                    className="object-contain p-2 w-full h-full"
                                />
                            </div>
                        )}
                        <Button variant="outline" className="flex gap-2" asChild>
                            <label htmlFor="goldTrophyUpload">
                                <Upload size={16} />
                                上传图标
                                <input
                                    id="goldTrophyUpload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(e, "goldTrophy")}
                                />
                            </label>
                        </Button>
                    </div>
                </div>

                {/* 银奖杯 */}
                <div className="space-y-2">
                    <Label htmlFor="silverTrophyUpload">银奖杯图标</Label>
                    <div className="flex items-center gap-4">
                        {silverTrophyPreview && (
                            <div className="relative w-16 h-16 border rounded">
                                <img
                                    src={silverTrophyPreview}
                                    alt="银奖杯预览"
                                    className="object-contain p-2 w-full h-full"
                                />
                            </div>
                        )}
                        <Button variant="outline" className="flex gap-2" asChild>
                            <label htmlFor="silverTrophyUpload">
                                <Upload size={16} />
                                上传图标
                                <input
                                    id="silverTrophyUpload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(e, "silverTrophy")}
                                />
                            </label>
                        </Button>
                    </div>
                </div>

                {/* 铜奖杯 */}
                <div className="space-y-2">
                    <Label htmlFor="bronzeTrophyUpload">铜奖杯图标</Label>
                    <div className="flex items-center gap-4">
                        {bronzeTrophyPreview && (
                            <div className="relative w-16 h-16 border rounded">
                                <img
                                    src={bronzeTrophyPreview}
                                    alt="铜奖杯预览"
                                    className="object-contain p-2 w-full h-full"
                                />
                            </div>
                        )}
                        <Button variant="outline" className="flex gap-2" asChild>
                            <label htmlFor="bronzeTrophyUpload">
                                <Upload size={16} />
                                上传图标
                                <input
                                    id="bronzeTrophyUpload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(e, "bronzeTrophy")}
                                />
                            </label>
                        </Button>
                    </div>
                </div>

                {/* 学校Logo */}
                <div className="space-y-2">
                    <Label htmlFor="schoolLogoUpload">学校Logo</Label>
                    <div className="flex items-center gap-4">
                        {schoolLogoPreview && (
                            <div className="relative w-24 h-24 border rounded">
                                <img
                                    src={schoolLogoPreview}
                                    alt="学校Logo预览"
                                    className="object-contain p-2 w-full h-full"
                                />
                            </div>
                        )}
                        <Button variant="outline" className="flex gap-2" asChild>
                            <label htmlFor="schoolLogoUpload">
                                <Upload size={16} />
                                上传Logo
                                <input
                                    id="schoolLogoUpload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(e, "schoolLogo")}
                                />
                            </label>
                        </Button>
                    </div>
                </div>

                {/* 学校小图标 */}
                <div className="space-y-2">
                    <Label htmlFor="schoolSmallIconUpload">学校小图标</Label>
                    <div className="flex items-center gap-4">
                        {schoolSmallIconPreview && (
                            <div className="relative w-16 h-16 border rounded">
                                <img
                                    src={schoolSmallIconPreview}
                                    alt="学校小图标预览"
                                    className="object-contain p-2 w-full h-full"
                                />
                            </div>
                        )}
                        <Button variant="outline" className="flex gap-2" asChild>
                            <label htmlFor="schoolSmallIconUpload">
                                <Upload size={16} />
                                上传图标
                                <input
                                    id="schoolSmallIconUpload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(e, "schoolSmallIcon")}
                                />
                            </label>
                        </Button>
                    </div>
                </div>

                {/* 学校认证文本 */}
                <FormField
                    control={form.control}
                    name="schoolUnionAuthText"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>学校认证文本</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="学校认证文本" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* 背景动画 */}
                <FormField
                    control={form.control}
                    name="bgAnimation"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between py-2">
                            <div>
                                <FormLabel>启用背景动画</FormLabel>
                                <FormDescription>是否启用平台背景动画效果</FormDescription>
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

export default ResourceSettings; 