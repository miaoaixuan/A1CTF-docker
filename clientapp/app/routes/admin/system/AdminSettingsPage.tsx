import React, { useState, useEffect } from "react";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import { Switch } from "components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { Atom, Bird, Cat, Image, Loader2, Mail, Save, Siren, Upload, UserLock } from "lucide-react";
import { toast } from "sonner";
import { MacScrollbar } from "mac-scrollbar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { AdminHeader } from "components/admin/AdminHeader";
import AboutPage from "components/admin/AboutPage";
import BasicSettings from "./BasicSettings";
import ResourceSettings from "./ResourceSettings";
import MailSettings from "./MailSettings";
import SecurityPolicySettings from "./SecurityPolicy";
import OtherSettings from "./OtherSettings";
import UserPolicySettings from "./UserPolicy";
import { api } from "utils/ApiHelper";

interface SystemSettings {
    // 基本信息
    systemName: string;
    systemLogo: string;
    systemSlogan: string;
    systemSummary: string;
    systemFooter: string;
    systemFavicon: string;

    // 主题设置
    themeColor: string;
    darkModeDefault: boolean;
    allowUserTheme: boolean;

    // 品牌资源
    fancyBackGroundIconWhite: string;
    fancyBackGroundIconBlack: string;
    defaultBGImage: string;
    svgIcon: string;
    svgAltData: string;
    trophysGold: string;
    trophysSilver: string;
    trophysBronze: string;
    schoolLogo: string;
    schoolSmallIcon: string;
    schoolUnionAuthText: string;
    bgAnimation: boolean;

    // SMTP设置
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    smtpFrom: string;
    smtpEnabled: boolean;

    // Cloudflare Turnstile设置
    captchaEnabled: boolean;

    // 账户激活策略
    accountActivationMethod: "auto" | "email" | "admin";
    registrationEnabled: boolean;

    // 其他系统设置
    defaultLanguage: string;
    timeZone: string;
    maxUploadSize: number;
}

// 使用Zod定义表单验证模式
const systemSettingsSchema = z.object({
    // 基本信息
    systemName: z.string().optional(),
    systemLogo: z.string().optional(),
    systemSlogan: z.string().optional(),
    systemSummary: z.string().optional(),
    systemFooter: z.string().optional(),
    systemFavicon: z.string().optional(),
    systemICP: z.string().optional(),
    systemOrganization: z.string().optional(),
    systemOrganizationURL: z.string().optional(),
    // 主题设置
    themeColor: z.string().optional(),
    darkModeDefault: z.boolean().optional(),
    allowUserTheme: z.boolean().optional(),

    // 品牌资源
    fancyBackGroundIconWhite: z.string().optional(),
    fancyBackGroundIconBlack: z.string().optional(),
    defaultBGImage: z.string().optional(),
    svgIcon: z.string().optional(),
    svgAltData: z.string().optional(),
    trophysGold: z.string().optional(),
    trophysSilver: z.string().optional(),
    trophysBronze: z.string().optional(),
    schoolLogo: z.string().optional(),
    schoolSmallIcon: z.string().optional(),
    schoolUnionAuthText: z.string().optional(),
    bgAnimation: z.boolean().optional(),

    // SMTP设置
    smtpHost: z.string().optional(),
    smtpPort: z.number().int().positive().optional(),
    smtpUsername: z.string().optional(),
    smtpPassword: z.string().optional(),
    smtpFrom: z.string().optional(),
    smtpEnabled: z.boolean().optional(),
    emailTemplate: z.string().optional(),

    // 验证码
    captchaEnabled: z.boolean().optional(),

    aboutus: z.string().optional(),

    // 账户激活策略
    accountActivationMethod: z.enum(["auto", "email", "admin"]).optional(),
    registrationEnabled: z.boolean().optional(),

    // 其他系统设置
    defaultLanguage: z.string().optional(),
    timeZone: z.string().optional(),
    maxUploadSize: z.number().int().positive(),
});

export type SystemSettingsValues = z.infer<typeof systemSettingsSchema>;

export const AdminSettingsPage = () => {
    const [isLoading, setIsLoading] = useState(false);

    const { action } = useParams();
    const [activeModule, setActiveModule] = useState(action);

    useEffect(() => {
        if (!modules.filter(m => m.id == action).length) {
            navigate("/404")
            return
        }
        setActiveModule(action)
    }, [action])

    const navigate = useNavigate()

    // 创建表单
    const form = useForm<SystemSettingsValues>({
        resolver: zodResolver(systemSettingsSchema),
        defaultValues: {
            systemName: "A1CTF",
            systemLogo: "",
            systemSlogan: "A Modern CTF Platform",
            systemSummary: "",
            systemICP: "",
            systemOrganization: "浙江师范大学",
            systemOrganizationURL: "https://www.zjnu.edu.cn",
            systemFooter: "© 2023 A1CTF Team",
            systemFavicon: "",
            themeColor: "blue",
            darkModeDefault: true,
            allowUserTheme: true,

            // 品牌资源
            fancyBackGroundIconWhite: "/images/ctf_white.png",
            fancyBackGroundIconBlack: "/images/ctf_black.png",
            defaultBGImage: "/images/defaultbg.jpg",
            svgIcon: "/images/A1natas.svg",
            svgAltData: "A1natas",
            trophysGold: "/images/trophys/gold_trophy.png",
            trophysSilver: "/images/trophys/silver_trophy.png",
            trophysBronze: "/images/trophys/copper_trophy.png",
            schoolLogo: "/images/zjnu_logo.png",
            schoolSmallIcon: "/images/zjnu_small_logo.png",
            schoolUnionAuthText: "ZJNU Union Authserver",
            bgAnimation: false,

            smtpHost: "",
            smtpPort: 587,
            smtpUsername: "",
            smtpPassword: "",
            smtpFrom: "",
            smtpEnabled: false,
            emailTemplate: "",

            aboutus: "",

            captchaEnabled: false,
            accountActivationMethod: "email",
            registrationEnabled: true,
            defaultLanguage: "zh-CN",
            timeZone: "Asia/Shanghai",
            maxUploadSize: 10,
        }
    });

    // 获取系统设置
    useEffect(() => {
        fetchSystemSettings();
    }, []);

    const fetchSystemSettings = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get("/api/admin/system/settings");
            if (response.data && response.data.code === 200) {
                const data = response.data.data;

                // 更新表单值
                form.reset(data);
            }
        } catch (error) {
            console.error("获取系统设置失败:", error);
            toast.error("获取系统设置失败，请稍后再试");
        } finally {
            setIsLoading(false);
        }
    };

    // 保存系统设置
    const onSubmit = async (values: SystemSettingsValues) => {
        try {
            setIsLoading(true);
            const response = await axios.post("/api/admin/system/settings", values);
            if (response.data && response.data.code === 200) {
                toast.success("系统设置已成功更新");
            }
        } catch (error) {
            console.error("保存系统设置失败:", error);
            toast.error("无法保存系统设置，请稍后再试");
        } finally {
            setIsLoading(false);
        }
    };


    const modules = [
        {
            id: "basic",
            name: "基本设置",
            icon: <Atom className="h-4 w-4" />
        },
        {
            id: 'resource',
            name: '资源设置',
            icon: <Image className="h-4 w-4" />
        },
        {
            id: 'mail',
            name: '邮件设置',
            icon: <Mail className="h-4 w-4" />
        },
        {
            id: 'security',
            name: '安全策略',
            icon: <Siren className="h-4 w-4" />
        },
        {
            id: 'account-policy',
            name: '账户策略',
            icon: <UserLock className="h-4 w-4" />
        },
        {
            id: 'others',
            name: '其他设置',
            icon: <Cat className="h-4 w-4" />
        },
        {
            id: "aboutus",
            name: "关于设置",
            icon: <Bird className="h-4 w-4" />
        },
    ];

    return (
        <div className="w-screen h-screen flex flex-col">
            <AdminHeader />
            <Form {...form}>
                <div className="w-full h-full overflow-hidden gap-2 flex">
                    <div className="w-64 flex-none border-r-1 select-none h-full">
                        <div className="px-6 pt-10">
                            <h3 className="font-semibold text-lg mb-4 text-foreground/90">管理模块</h3>
                            <div className="space-y-2">
                                {modules.map((module) => (
                                    <Button
                                        key={module.id}
                                        type="button"
                                        className='w-full h-10 flex justify-start gap-2 cursor-pointer'
                                        variant={activeModule === module.id ? "default" : "ghost"}
                                        onClick={() => navigate(`/admin/system/${module.id}`)}
                                    >
                                        {module.icon}
                                        <span className="font-medium">{module.name}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-1 h-full overflow-hidden">
                        {activeModule == "aboutus" ? (
                            <div className="w-full h-full">
                                <AboutPage 
                                    form={form}
                                    onSubmit={onSubmit}
                                />
                            </div>
                        ) : (
                            <MacScrollbar className="w-full h-full overflow-hidden select-none">
                                <div className="p-10 flex flex-col gap-4">
                                    {activeModule == "basic" && (
                                        <BasicSettings
                                            form={form}
                                            onSubmit={onSubmit}
                                        />
                                    )}

                                    {activeModule == "resource" && (
                                        <ResourceSettings
                                            form={form}
                                        />
                                    )}

                                    {activeModule == "mail" && (
                                        <MailSettings
                                            form={form}
                                        />
                                    )}

                                    {activeModule == "security" && (
                                        <SecurityPolicySettings
                                            form={form}
                                        />
                                    )}

                                    {activeModule == "account-policy" && (
                                        <UserPolicySettings
                                            form={form}
                                        />
                                    )}

                                    {activeModule == "others" && (
                                        <OtherSettings
                                            form={form}
                                        />
                                    )}

                                    {activeModule != "resource" && (
                                        <div className="w-full mt-4">
                                            <Button
                                                type="button"
                                                onClick={form.handleSubmit(onSubmit)}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save />}
                                                {isLoading ? '保存中...' : '保存设置'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </MacScrollbar>
                        )}
                    </div>
                </div>
            </Form>
        </div>
    );
};

export default AdminSettingsPage; 