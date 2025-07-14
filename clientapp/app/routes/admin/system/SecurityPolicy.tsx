import { Input } from "components/ui/input";
import { Switch } from "components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form";
import { SystemSettingsValues } from "./AdminSettingsPage";

export const SecurityPolicySettings = (
    { form } : {
        form: UseFormReturn<SystemSettingsValues>,
    }
) => {

    return (
        <>
            <span className="text-2xl font-bold">安全设置</span>
            <div>
                <h3 className="text-lg font-medium">Cloudflare Turnstile 人机验证</h3>
                <p className="text-sm text-gray-500 mb-4">配置Cloudflare Turnstile验证码以防止自动化攻击</p>

                <FormField
                    control={form.control}
                    name="turnstileEnabled"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between py-2">
                            <div>
                                <FormLabel>启用验证码</FormLabel>
                                <FormDescription>在登录、注册等页面显示验证码</FormDescription>
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

                <div className="grid gap-4 mt-4">
                    <FormField
                        control={form.control}
                        name="turnstileSiteKey"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>站点密钥 (Site Key)</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Cloudflare Turnstile站点密钥" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="turnstileSecretKey"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>密钥 (Secret Key)</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Cloudflare Turnstile密钥" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        </>
    );
};

export default SecurityPolicySettings; 