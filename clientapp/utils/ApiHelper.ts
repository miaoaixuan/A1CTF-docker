import { Api } from "./A1API";
import { toast } from "sonner";

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
const handleGlobalError = (error: any) => {
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
    toast.error(errorMessage, {
        description: errorCode > 0 ? `错误代码: ${errorCode}` : undefined,
        duration: 4000,
        action: errorCode === 401 ? {
            label: "重新登录",
            onClick: () => {
                // 清除可能的认证信息
                document.cookie = "a1token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                // 重定向到登录页面
                window.location.href = "/login";
            }
        } : undefined
    });

    // 如果是 401 错误，可以自动重定向到登录页面
    if (errorCode === 401) {
        setTimeout(() => {
            document.cookie = "a1token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.href = "/login";
        }, 2000);
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
        return handleGlobalError(error);
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
        return handleGlobalError(error);
    }
);

export interface ErrorMessage {
    code: number;
    message: string;
}

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
