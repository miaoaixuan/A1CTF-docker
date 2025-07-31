import { useNavigateFrom } from "hooks/NavigateFrom";
import { Api } from "./A1API";
import { toast } from "sonner";

// 导航函数类型
type NavigateFunction = (path: string) => void;

// 全局导航函数，需要在应用初始化时设置
let globalNavigate: NavigateFunction | null = null;

// 错误提示防抖管理器
class ErrorToastDebouncer {
    private lastToastTime: { [key: number]: number } = {};
    private debounceDelay = 3000; // 3秒内不重复显示相同错误码的提示

    canShowToast(errorCode: number): boolean {
        const now = Date.now();
        const lastTime = this.lastToastTime[errorCode];
        
        if (!lastTime || now - lastTime > this.debounceDelay) {
            this.lastToastTime[errorCode] = now;
            return true;
        }
        
        return false;
    }

    // 重置特定错误码的防抖状态
    reset(errorCode?: number) {
        if (errorCode !== undefined) {
            delete this.lastToastTime[errorCode];
        } else {
            this.lastToastTime = {};
        }
    }
}

// 创建全局错误提示防抖实例
const errorToastDebouncer = new ErrorToastDebouncer();

// 设置全局导航函数
export const setGlobalNavigate = (navigate: NavigateFunction) => {
    globalNavigate = navigate;
};

// 获取导航函数，如果没有设置则回退到window.location.href
const getNavigate = (): NavigateFunction => {
    return globalNavigate || ((path: string) => {
        window.location.href = path;
    });
};

// 创建 API 实例并配置拦截器
export const api = new Api({
    baseURL: "/",
    withCredentials: true,
});

export const sAPI = new Api({
    baseURL: "https://www.a1natas.com",
    withCredentials: true
});

// 全局错误处理函数
const handleGlobalError = (error: any, config?: any) => {

    // 检查错误是否已被手动处理，避免双重处理
    if (error._isHandled || (config && config._skipGlobalErrorHandler)) {
        return Promise.reject(error);
    }

    // 获取错误信息
    let errorMessage = "发生未知错误";
    let errorCode = 0;

    if (error.response) {
        // 服务器返回了错误状态码
        const { status, data } = error.response;
        errorCode = status;

        if (data && typeof data === 'object') {
            if (data.message) {
                errorMessage = data.message;
            } else if (data.error) {
                errorMessage = data.error;
            } else if (data.detail) {
                errorMessage = data.detail;
            }
        } else if (typeof data === 'string') {
            errorMessage = data;
        } else {
            // 根据状态码提供默认错误信息
            switch (status) {
                case 400:
                    errorMessage = "请求参数错误";
                    break;
                case 401:
                    errorMessage = "未授权，请重新登录";
                    break;
                case 403:
                    errorMessage = "没有权限访问";
                    break;
                case 404:
                    errorMessage = "请求的资源不存在";
                    break;
                case 500:
                    errorMessage = "服务器内部错误";
                    break;
                case 502:
                    errorMessage = "网关错误";
                    break;
                case 503:
                    errorMessage = "服务暂时不可用";
                    break;
                case 504:
                    errorMessage = "网关超时";
                    break;
                default:
                    errorMessage = `服务器错误 (${status})`;
            }
        }
    } else if (error.request) {
        // 网络错误
        errorMessage = "网络连接失败，请检查网络";
        errorCode = -1;
    } else {
        // 其他错误
        errorMessage = error.message || "发生未知错误";
        errorCode = -2;
    }

    // 使用 sonner 显示错误提示

    const goto = function (path: string) {
        let from = window.location.pathname
        if (window.location.search) {
            from += `?${window.location.search}`
        }
        from = btoa(from)
        getNavigate()(`${path}?from=${from}`)
    }

    // 如果是 401 错误，可以自动重定向到登录页面
    if (errorCode === 401) {
        // 使用防抖机制，避免短时间内重复处理401错误
        if (errorToastDebouncer.canShowToast(401)) {
            document.cookie = "a1token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            goto("/login")
        }
    } else if (errorCode == 421) {
        // 使用防抖机制，避免短时间内重复显示421错误提示
        if (errorToastDebouncer.canShowToast(421)) {
            toast.error("请先验证邮箱")
            getNavigate()("/profile/email")
        }
    } else {
        toast.error(errorMessage, {
            duration: 4000,
        });
    }

    return Promise.reject(error);
};

// 为 api 实例添加响应拦截器
api.instance.interceptors.response.use(
    (response) => {
        // 请求成功时直接返回响应
        return response;
    },
    (error) => {
        // 请求失败时处理错误
        return handleGlobalError(error, error.config);
    }
);

// 为 sAPI 实例添加响应拦截器
sAPI.instance.interceptors.response.use(
    (response) => {
        // 请求成功时直接返回响应
        return response;
    },
    (error) => {
        // 请求失败时处理错误
        return handleGlobalError(error, error.config);
    }
);

export interface ErrorMessage {
    code: number;
    message: string;
}

// 标记错误为已处理，防止全局错误处理器重复处理
export const markErrorAsHandled = (error: any) => {
    if (error && typeof error === 'object') {
        console.log("Marked!")
        error._isHandled = true;
    }
    return error;
};

// 创建一个已标记为处理的错误
export const createHandledError = (error: any) => {
    return markErrorAsHandled(error);
};

// 创建跳过全局错误处理的API请求配置
export const createSkipGlobalErrorConfig = (config: any = {}) => {
    return {
        ...config,
        _skipGlobalErrorHandler: true
    };
};

// 导出一个手动触发错误提示的函数
export const showErrorToast = (message: string, code?: number) => {
    toast.error(message, {
        description: code ? `错误代码: ${code}` : undefined,
        duration: 4000,
    });
};

// 导出一个成功提示的函数
export const showSuccessToast = (message: string) => {
    toast.success(message, {
        duration: 3000,
    });
};

// 导出一个信息提示的函数
export const showInfoToast = (message: string) => {
    toast.info(message, {
        duration: 3000,
    });
};

// 导出重置错误提示防抖状态的函数
export const resetErrorToastDebounce = (errorCode?: number) => {
    errorToastDebouncer.reset(errorCode);
};

// 导出检查是否可以显示错误提示的函数（用于调试或特殊情况）
export const canShowErrorToast = (errorCode: number): boolean => {
    return errorToastDebouncer.canShowToast(errorCode);
};
