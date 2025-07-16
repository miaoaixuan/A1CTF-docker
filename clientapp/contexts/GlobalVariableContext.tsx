import { AxiosError } from "axios";
import React, { createContext, Dispatch, SetStateAction, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useCookies } from "react-cookie";
import { browserName } from "react-device-detect";
import { UserProfile } from "utils/A1API";
import { api } from "utils/ApiHelper";
import axios from 'axios';
import { useTheme } from "next-themes";

interface ClientConfig {
    FancyBackGroundIconWhite: string;
    FancyBackGroundIconBlack: string;
    DefaultBGImage: string;
    SVGIcon: string;
    SVGAltData: string;
    TrophysGold: string;
    TrophysSilver: string;
    TrophysBronze: string;
    SchoolLogo: string;
    SchoolSmallIcon: string;
    SchoolUnionAuthText: string;
    BGAnimation: boolean;
    // AboutUS: string;
    systemName: string;
    systemLogo: string;
    systemFavicon: string;
    systemSlogan: string;
    systemFooter: string;
    systemICP: string;
    systemOrganization: string;
    systemOrganizationURL: string;
    themeColor: string;
    darkModeDefault: boolean;
    allowUserTheme: boolean;
    defaultLanguage: string;
    captchaEnabled: boolean;
    updateVersion: string;

    // 全局比赛模式
    gameActivityMode: string | undefined;
}

interface GlobalVariableContextType {
    curProfile: UserProfile;
    updateProfile: (callback?: () => void) => void;
    serialOptions: React.MutableRefObject<echarts.SeriesOption[]>;
    clientConfig: ClientConfig;
    updateClientConfg: (key: keyof ClientConfig, value: any) => void;
    isDarkMode: boolean;
    setIsDarkMode: (isDark: boolean) => void;
    refreshClientConfig: () => Promise<void>;
}

const globalVariableContext = createContext<GlobalVariableContextType | undefined>(undefined);

export const useGlobalVariableContext = () => {
    const context = useContext(globalVariableContext);
    if (!context) {
        throw new Error("useGlobalVariableContext must be used within a GlobalVariableContextProvider");
    }
    return context;
};

export const GlobalVariableProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

    const [cookies, setCookie, removeCookie] = useCookies(["uid", "clientConfig"])
    const [curProfile, setCurProfile] = useState<UserProfile>({} as UserProfile)

    const { theme, systemTheme, setTheme } = useTheme()

    const defaultClientConfig: ClientConfig = {
        FancyBackGroundIconWhite: "/images/ctf_white.png",
        FancyBackGroundIconBlack: "/images/ctf_black.png",
        DefaultBGImage: "/images/defaultbg.jpg",
        SVGIcon: "/images/A1natas.svg",
        SVGAltData: "A1natas",
        TrophysGold: "/images/trophys/gold_trophy.png",
        TrophysSilver: "/images/trophys/silver_trophy.png",
        TrophysBronze: "/images/trophys/copper_trophy.png",
        SchoolLogo: "/images/zjnu_logo.png",
        SchoolSmallIcon: "/images/zjnu_small_logo.png",
        SchoolUnionAuthText: "ZJNU Union Authserver",
        BGAnimation: false,
        systemName: 'A1CTF',
        systemLogo: '',
        systemFavicon: '',
        systemSlogan: 'A Modern CTF Platform',
        systemFooter: '© 2025 A1CTF Team',
        systemICP: '',
        systemOrganization: '浙江师范大学',
        systemOrganizationURL: 'https://www.zjnu.edu.cn',
        themeColor: 'blue',
        darkModeDefault: true,
        allowUserTheme: true,
        defaultLanguage: 'zh-CN',
        // AboutUS: "A1CTF Platform",
        captchaEnabled: false,
        updateVersion: '',

        gameActivityMode: undefined,
    }

    const [clientConfig, setClientConfig] = useState<ClientConfig>({} as ClientConfig)
    const [isDarkMode, setIsDarkMode] = useState<boolean>(defaultClientConfig.darkModeDefault);

    const updateClientConfg = (key: keyof ClientConfig, value: any) => {
        setClientConfig((prevConfig) => ({
            ...prevConfig,
            [key]: value
        }))
        setCookie("clientConfig", { ...clientConfig, [key]: value }, { path: "/" })
    }

    const serialOptions = useRef<echarts.SeriesOption[]>([])

    const updateProfile = (callback?: () => void) => {
        api.user.getUserProfile().then((res) => {
            setCurProfile(res.data.data)
            setCookie("uid", res.data.data.user_id, { path: "/" })
        }).catch((error: AxiosError) => {
            removeCookie("uid")
        }).finally(() => {
            if (callback) callback()
        })
    }
    
    useEffect(() => {
        if (!curProfile.user_id && cookies.uid) {
            api.user.getUserProfile().then((res) => {
                setCurProfile(res.data.data)
                setCookie("uid", res.data.data.user_id, { path: "/" })
            }).catch((error: AxiosError) => {
                removeCookie("uid")
            })
        }

        if (cookies.clientConfig) {
            setClientConfig(cookies.clientConfig)
        }

        refreshClientConfig()
    }, [])

    // 获取客户端配置
    const fetchClientConfig = async () => {
        try {
            const response = await axios.get('/api/client-config');
            if (response.data && response.data.code === 200) {

                // 初始化没有客户端配置的情况
                if (!cookies.clientConfig) {
                    if (response.data.data.BGAnimation && browserName.includes("Chrome")) {
                        response.data.data.BGAnimation = true
                    } else {
                        response.data.data.BGAnimation = false
                    }
                    setClientConfig(response.data.data);
                    setCookie("clientConfig", response.data.data, { path: "/" })
                    return
                }

                if (response.data.data.updateVersion && response.data.data.updateVersion == cookies.clientConfig.updateVersion) {
                    return
                }

                if (browserName.includes("Chrome")) {
                    response.data.data.BGAnimation = true
                }

                response.data.data.BGAnimation = cookies.clientConfig.BGAnimation

                setClientConfig(response.data.data);
                setCookie("clientConfig", response.data.data, { path: "/" })
                
                // 如果用户未手动设置主题，则使用配置的默认主题
                if (!localStorage.getItem('theme-preference')) {
                    setIsDarkMode(response.data.data.darkModeDefault);
                }
            }
        } catch (error) {
            console.error('获取客户端配置失败:', error);
        }
    };
    
    // 刷新客户端配置
    const refreshClientConfig = async () => {
        await fetchClientConfig();
    };
    
    // 更新主题
    const updateTheme = (isDark: boolean) => {
        setIsDarkMode(isDark);
        localStorage.setItem('theme-preference', isDark ? 'dark' : 'light');
        
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };
    
    // 设置主题
    const handleSetIsDarkMode = (isDark: boolean) => {
        if (clientConfig.allowUserTheme) {
            updateTheme(isDark);
        }
    };
    
    // 组件挂载时获取配置
    useEffect(() => {
        // 检查用户偏好
        const savedTheme = localStorage.getItem('theme-preference');
        if (savedTheme) {
            setIsDarkMode(savedTheme === 'dark');
        }

        if (theme == "system") {
            setTheme(systemTheme as "dark" | "light")
        }
        
    }, []);
    
    // 监听暗色模式变化
    useEffect(() => {
        updateTheme(isDarkMode);
    }, [isDarkMode]);

    return (
        <globalVariableContext.Provider value={{ curProfile, updateProfile, serialOptions, clientConfig, updateClientConfg, isDarkMode, setIsDarkMode, refreshClientConfig }}>
            {children}
        </globalVariableContext.Provider>
    );
};

export default globalVariableContext;
