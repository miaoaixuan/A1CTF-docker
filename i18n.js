import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    en: {
        translation: {
            home: "Home",
            race: "Competitions",
            team: "Teams",
            about: "About",
            wp: "WritesUP",
            signup: "Signup",
            login: "Login"
        },
    },
    cn: {
        translation: {
            home: "主页",
            race: "比赛",
            team: "队伍",
            about: "关于",
            wp: "WritesUP",
            signup: "注册",
            login: "登录"
        },
    },
};


// i18next 初始化配置
i18n
    .use(LanguageDetector) // 检测用户语言
    .use(initReactI18next) // 初始化 react-i18next
    .init({
        resources,
        fallbackLng: 'en', // 默认语言
        supportedLngs: ['en', 'cn'], // 支持的语言
        react: {
            useSuspense: false,  // 关闭 Suspense 以避免闪烁问题
        },
        detection: {
            order: ['querystring', 'cookie', 'localStorage', 'navigator'], // 检测顺序
            caches: ['cookie'], // 缓存语言偏好
        },
        interpolation: {
            escapeValue: false, // 防止 XSS，React 已经自动处理
        },
    });

export default i18n;
