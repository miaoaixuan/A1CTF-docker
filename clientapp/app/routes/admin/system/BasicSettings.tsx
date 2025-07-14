import React, {  } from "react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import { Upload } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form";
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
                        <FormLabel>系统名称</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="systemSlogan"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>系统标语</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="systemFooter"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>页脚内容</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="systemICP"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>备案号</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="systemOrganization"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>组织名称</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="systemOrganizationURL"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>组织链接</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="systemSummary"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>系统摘要</FormLabel>
                        <FormControl>
                            <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="space-y-2">
                <Label htmlFor="logoUpload">系统Logo</Label>
                <div className="flex items-center gap-4">
                    {logoPreview && (
                        <div className="relative w-24 h-24 border rounded">
                            <img
                                src={logoPreview}
                                alt="Logo预览"
                                className="object-contain p-2 w-full h-full"
                            />
                        </div>
                    )}
                    <Button variant="outline" className="flex gap-2" asChild>
                        <label htmlFor="logoUpload">
                            <Upload size={16} />
                            上传Logo
                            <input
                                id="logoUpload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, "logo")}
                            />
                        </label>
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="faviconUpload">网站图标</Label>
                <div className="flex items-center gap-4">
                    {faviconPreview && (
                        <div className="relative w-12 h-12 border rounded">
                            <img
                                src={faviconPreview}
                                alt="Favicon预览"
                                className="object-contain p-1 w-full h-full"
                            />
                        </div>
                    )}
                    <Button variant="outline" className="flex gap-2" asChild>
                        <label htmlFor="faviconUpload">
                            <Upload size={16} />
                            上传图标
                            <input
                                id="faviconUpload"
                                type="file"
                                accept="image/x-icon,image/png,image/svg+xml"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, "favicon")}
                            />
                        </label>
                    </Button>
                </div>
            </div>
        </>
    );
};

export default BasicSettings; 