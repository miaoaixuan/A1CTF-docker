import { Switch } from "components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form";
import { SystemSettingsValues } from "./AdminSettingsPage";

export const UserPolicySettings = (
    { form }: {
        form: UseFormReturn<SystemSettingsValues>,
    }
) => {

    return (
        <>
            <span className="text-2xl font-bold mb-4">用户策略</span>

            <FormField
                control={form.control}
                name="registrationEnabled"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5 mb-[-1px]">
                            <FormLabel>开放注册</FormLabel>
                            <FormDescription>是否允许新用户注册</FormDescription>
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

            <FormField
                control={form.control}
                name="accountActivationMethod"
                render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center h-[20px]">
                            <FormLabel>账户激活方式</FormLabel>
                            <div className="flex-1" />
                            <FormMessage className="text-[14px]" />
                        </div>
                        <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                        >
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="选择账户激活方式" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="auto">自动激活（无需验证）</SelectItem>
                                <SelectItem value="email">邮箱验证激活</SelectItem>
                                <SelectItem value="admin">管理员审核激活</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </>
    );
};

export default UserPolicySettings; 