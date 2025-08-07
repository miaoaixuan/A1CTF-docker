import { useGlobalVariableContext } from "contexts/GlobalVariableContext"
import { useEffect } from "react"
import { useNavigate } from "react-router"
import { toast } from "react-toastify/unstyled"

export default function () {

    const { clientConfig, checkLoginStatus } = useGlobalVariableContext()
    const navigate = useNavigate()

    const titleMap = {
        "/login": { title: "登录" },
        "/games/\\d+/info": { title: "比赛详情" },
        "/games/\\d+/challenges": { title: "比赛题目" },
        "/games/\\d+/scoreboard": { title: "排行榜" },
        "/games/\\d+/team": { title: "队伍管理" },
        "/games": { title: "比赛列表" },
        "/about": { title: "关于" },
        "/signup": { title: "注册" },
        "/version": { title: "版本信息" },
        "/forget-password": { title: "忘记密码" },
        "/reset-password": { title: "重置密码" },
        "/email-verify": { title: "邮箱验证" },
    }

    const unLoginAllowedPage = [
        "/",
        "/login",
        "/signup",
        "/games",
        "/about",
        "/version",
        "/games/\\d+/info",
        "/games/\\d+/scoreboard",
        "/email-verify",
        "/forget-password",
        "/reset-password"
    ]

    useEffect(() => {
        if (!checkLoginStatus()) {
            const curURL = window.location.pathname
            let matched = false;

            unLoginAllowedPage.forEach((key) => {
                const regex = new RegExp(`^${key}$`)
                if (regex.test(curURL)) {
                    matched = true
                    return
                }
            })

            if (!matched) {
                navigate("/login")
                toast.error("请先登录")
            }
        }
    }, [window.location.pathname])

    useEffect(() => {
        const suffix = clientConfig.systemName
        const curURL = window.location.pathname
        let matched = false;

        Object.keys(titleMap).forEach((key) => {
            const regex = new RegExp(`^${key}$`)
            if (regex.test(curURL)) {
                document.title = titleMap[key as (keyof typeof titleMap)].title + " - " + suffix
                matched = true
                return
            }
        })

        if (!matched) {
            document.title = suffix
        }
    }, [clientConfig, window.location.pathname])

    return <></>
}