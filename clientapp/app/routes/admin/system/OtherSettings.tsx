import { Input } from "components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form";
import { SystemSettingsValues } from "./AdminSettingsPage";

export const OtherSettings = (
    { form } : {
        form: UseFormReturn<SystemSettingsValues>,
    }
) => {

    return (
        <>
            <span className="text-2xl font-bold">其他设置</span>
            <FormField
                control={form.control}
                name="defaultLanguage"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>默认语言</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="选择默认语言" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="zh-CN">简体中文</SelectItem>
                                <SelectItem value="en-US">English (US)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="timeZone"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>时区设置</FormLabel>
                        <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="选择时区" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Asia/Shanghai">中国标准时间 (UTC+8)</SelectItem>
                                <SelectItem value="UTC">协调世界时 (UTC)</SelectItem>
                                <SelectItem value="America/New_York">美国东部时间 (UTC-5/4)</SelectItem>
                                <SelectItem value="Europe/London">英国标准时间 (UTC+0/1)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="maxUploadSize"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>最大上传文件大小 (MB)</FormLabel>
                        <FormControl>
                            <Input
                                type="number"
                                value={field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </>
    );
};

export default OtherSettings; 