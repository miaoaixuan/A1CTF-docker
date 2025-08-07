import { Switch } from "components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from "components/ui/form";
import { SystemSettingsValues } from "./AdminSettingsPage";

export const SecurityPolicySettings = (
    { form }: {
        form: UseFormReturn<SystemSettingsValues>,
    }
) => {

    return (
        <>
            <span className="text-2xl font-bold mb-4">安全设置</span>

            <FormField
                control={form.control}
                name="captchaEnabled"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5 mb-[-1px]">
                            <FormLabel>启用验证码</FormLabel>
                            <FormDescription>
                                在登录、注册等页面显示验证码
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
        </>
    );
};

export default SecurityPolicySettings; 