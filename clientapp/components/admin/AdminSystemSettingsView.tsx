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
import { Atom, Bird, Cat, Image, Loader2, Mail, Siren, Upload, UserLock } from "lucide-react";
import { toast } from "sonner";
import { MacScrollbar } from "mac-scrollbar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form";
import { useSearchParams } from "react-router";
import { AdminHeader } from "./AdminHeader";
import AboutPage from "./AboutPage";
import { useTheme } from "next-themes";
import SystemAboutSettings from "./SystemAboutSettings";

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
    turnstileSiteKey: string;
    turnstileSecretKey: string;
    turnstileEnabled: boolean;

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
    systemName: z.string().min(1, "系统名称不能为空"),
    systemLogo: z.string().optional(),
    systemSlogan: z.string().optional(),
    systemSummary: z.string().optional(),
    systemFooter: z.string().optional(),
    systemFavicon: z.string().optional(),
    systemICP: z.string().optional(),
    systemOrganization: z.string().optional(),
    systemOrganizationURL: z.string().optional(),
    // 主题设置
    themeColor: z.string(),
    darkModeDefault: z.boolean(),
    allowUserTheme: z.boolean(),

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
    bgAnimation: z.boolean(),

    // SMTP设置
    smtpHost: z.string().optional(),
    smtpPort: z.number().int().positive().optional(),
    smtpUsername: z.string().optional(),
    smtpPassword: z.string().optional(),
    smtpFrom: z.string().optional(),
    smtpEnabled: z.boolean(),

    // Cloudflare Turnstile设置
    turnstileSiteKey: z.string().optional(),
    turnstileSecretKey: z.string().optional(),
    turnstileEnabled: z.boolean(),

    // 账户激活策略
    accountActivationMethod: z.enum(["auto", "email", "admin"]),
    registrationEnabled: z.boolean(),

    // 其他系统设置
    defaultLanguage: z.string(),
    timeZone: z.string(),
    maxUploadSize: z.number().int().positive(),
});

type SystemSettingsValues = z.infer<typeof systemSettingsSchema>;

export const AdminSystemSettingsView = () => {
    const [isLoading, setIsLoading] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams()
    const [activeModule, setActiveModule] = useState(searchParams.get("module") ?? 'basic');

    useEffect(() => {
        setSearchParams({ module: activeModule })
    }, [activeModule])

    // 图片预览状态
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
    const [fancyWhitePreview, setFancyWhitePreview] = useState<string | null>(null);
    const [fancyBlackPreview, setFancyBlackPreview] = useState<string | null>(null);
    const [bgImagePreview, setBgImagePreview] = useState<string | null>(null);
    const [svgIconPreview, setSvgIconPreview] = useState<string | null>(null);
    const [goldTrophyPreview, setGoldTrophyPreview] = useState<string | null>(null);
    const [silverTrophyPreview, setSilverTrophyPreview] = useState<string | null>(null);
    const [bronzeTrophyPreview, setBronzeTrophyPreview] = useState<string | null>(null);
    const [schoolLogoPreview, setSchoolLogoPreview] = useState<string | null>(null);
    const [schoolSmallIconPreview, setSchoolSmallIconPreview] = useState<string | null>(null);

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
            turnstileSiteKey: "",
            turnstileSecretKey: "",
            turnstileEnabled: false,
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

                // 设置图片预览
                if (data.systemLogo) setLogoPreview(data.systemLogo);
                if (data.systemFavicon) setFaviconPreview(data.systemFavicon);
                if (data.fancyBackGroundIconWhite) setFancyWhitePreview(data.fancyBackGroundIconWhite);
                if (data.fancyBackGroundIconBlack) setFancyBlackPreview(data.fancyBackGroundIconBlack);
                if (data.defaultBGImage) setBgImagePreview(data.defaultBGImage);
                if (data.svgIcon) setSvgIconPreview(data.svgIcon);
                if (data.trophysGold) setGoldTrophyPreview(data.trophysGold);
                if (data.trophysSilver) setSilverTrophyPreview(data.trophysSilver);
                if (data.trophysBronze) setBronzeTrophyPreview(data.trophysBronze);
                if (data.schoolLogo) setSchoolLogoPreview(data.schoolLogo);
                if (data.schoolSmallIcon) setSchoolSmallIconPreview(data.schoolSmallIcon);
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

    // 处理图片上传
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            setIsLoading(true);
            const response = await axios.post("/api/admin/system/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data && response.data.code === 200) {
                const imageUrl = response.data.data.url;

                // 根据不同类型设置不同字段和预览
                switch (type) {
                    case "logo":
                        form.setValue("systemLogo", imageUrl);
                        setLogoPreview(imageUrl);
                        break;
                    case "favicon":
                        form.setValue("systemFavicon", imageUrl);
                        setFaviconPreview(imageUrl);
                        break;
                    case "fancyWhite":
                        form.setValue("fancyBackGroundIconWhite", imageUrl);
                        setFancyWhitePreview(imageUrl);
                        break;
                    case "fancyBlack":
                        form.setValue("fancyBackGroundIconBlack", imageUrl);
                        setFancyBlackPreview(imageUrl);
                        break;
                    case "bgImage":
                        form.setValue("defaultBGImage", imageUrl);
                        setBgImagePreview(imageUrl);
                        break;
                    case "svgIcon":
                        form.setValue("svgIcon", imageUrl);
                        setSvgIconPreview(imageUrl);
                        break;
                    case "goldTrophy":
                        form.setValue("trophysGold", imageUrl);
                        setGoldTrophyPreview(imageUrl);
                        break;
                    case "silverTrophy":
                        form.setValue("trophysSilver", imageUrl);
                        setSilverTrophyPreview(imageUrl);
                        break;
                    case "bronzeTrophy":
                        form.setValue("trophysBronze", imageUrl);
                        setBronzeTrophyPreview(imageUrl);
                        break;
                    case "schoolLogo":
                        form.setValue("schoolLogo", imageUrl);
                        setSchoolLogoPreview(imageUrl);
                        break;
                    case "schoolSmallIcon":
                        form.setValue("schoolSmallIcon", imageUrl);
                        setSchoolSmallIconPreview(imageUrl);
                        break;
                }

                toast.success("图片已成功上传");
            }
        } catch (error) {
            console.error("上传图片失败:", error);
            toast.error("无法上传图片，请稍后再试");
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
            id: 'smtp',
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

    useEffect(() => {
        console.log(activeModule)
    }, [activeModule])

    const { theme } = useTheme()

    return (
        <Form {...form}>
            <div className="w-full h-full overflow-hidden gap-2 flex">
                <div className="w-64 flex-none border-r-1 select-none h-full">
                    <div className="px-6 pt-6">
                        <h3 className="font-semibold text-lg mb-4 text-foreground/90">管理模块</h3>
                        <div className="space-y-2">
                            {modules.map((module) => (
                                <Button
                                    key={module.id}
                                    type="button"
                                    className='w-full h-10 flex justify-start gap-2'
                                    variant={activeModule === module.id ? "default" : "ghost"}
                                    onClick={() => setActiveModule(module.id)}
                                >
                                    {module.icon}
                                    <span className="font-medium">{module.name}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex flex-1 h-full overflow-hidden">
                    {activeModule != "aboutus" && (
                        <MacScrollbar className="w-full h-full overflow-hidden"
                            skin={theme == "light" ? "light" : "dark"}
                        >
                            <div className="p-10 flex flex-col gap-4">
                                {activeModule == "basic" && <>
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
                                </>}

                                {activeModule == "resource" && (
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
                                )}

                                {activeModule == "smtp" && (
                                    <>
                                        <span className="text-2xl font-bold">邮件设置</span>
                                        <FormField
                                            control={form.control}
                                            name="smtpEnabled"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between py-2">
                                                    <div>
                                                        <FormLabel>启用SMTP</FormLabel>
                                                        <FormDescription>是否启用系统邮件发送功能</FormDescription>
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

                                        <div className="grid gap-4">
                                            <FormField
                                                control={form.control}
                                                name="smtpHost"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>SMTP服务器</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="例如: smtp.example.com" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="smtpPort"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>SMTP端口</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                placeholder="例如: 587"
                                                                value={field.value}
                                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 587)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="smtpUsername"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>SMTP用户名</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="邮箱账号" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="smtpPassword"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>SMTP密码</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} type="password" placeholder="邮箱密码或授权码" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="smtpFrom"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>发件人地址</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="例如: noreply@example.com" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="pt-4">
                                            <Button type="button" variant="outline">测试邮件配置</Button>
                                        </div>
                                    </>
                                )}

                                {activeModule == "security" && (
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
                                )}

                                {activeModule == "account-policy" && (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="registrationEnabled"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between py-2">
                                                    <div>
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
                                                    <FormLabel>账户激活方式</FormLabel>
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
                                )}

                                {activeModule == "others" && (
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
                                )}
                            </div>
                        </MacScrollbar>
                    )}
                    {activeModule == "aboutus" && (
                        <div className="w-full h-full">
                            <AboutPage 
                                form={form}
                                onSubmit={onSubmit}
                            />
                        </div>
                    )}
                </div>
            </div>
        </Form>
    );
};

export default AdminSystemSettingsView; 