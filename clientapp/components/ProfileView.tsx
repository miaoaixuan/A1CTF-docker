

import { Button } from "./ui/button";
import { MacScrollbar } from "mac-scrollbar";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { Accessibility, KeyRound, Mail, Save, UserRoundPen } from "lucide-react";
import UserBaiscInfo from "./user/profile/UserBaiscInfo";
import { PasswordView } from "./user/profile/PasswordView";
import EmailSettings from "./user/profile/EmailSettings";
import DeleteAccount from "./user/profile/DeleteAccount";

export function ProfileView() {

    const navigate = useNavigate()
    const { action } = useParams();

    const { t } = useTranslation("profile_settings")

    const modules = [
        {
            id: "basic",
            name: "基本信息",
            icon: <UserRoundPen className="h-4 w-4" />
        },
        {
            id: "password",
            name: "修改密码",
            icon: <KeyRound className="h-4 w-4" />
        },
        {
            id: "email",
            name: "邮箱设置",
            icon: <Mail className="h-4 w-4" />
        },
        {
            id: "mambaout",
            name: "删号跑路",
            icon: <Accessibility className="h-4 w-4" />
        },
    ];

    const [activeModule, setActiveModule] = useState(action || 'events');

    useEffect(() => {
        if (!modules.filter(m => m.id == action).length) {
            navigate("/404")
            return
        }
        setActiveModule(action || "events")
    }, [action])

    const { theme } = useTheme()

    return (

        <div className="w-full flex justify-center h-full">
            <div className="flex container h-full overflow-hidden">
                {/* 左侧模块导航 */}
                <div className="w-64 flex-none border-r-1 select-none">
                    <div className="px-6 pt-5">
                        <h3 className="font-bold text-lg mb-4 text-foreground/90">个人资料</h3>
                        <div className="space-y-2">
                            {modules.map((module) => (
                                <Button
                                    key={module.id}
                                    type="button"
                                    className='w-full h-10 flex justify-start gap-2'
                                    variant={activeModule === module.id ? "default" : "ghost"}
                                    onClick={() => {
                                        navigate(`/profile/${module.id}`)
                                    }}
                                >
                                    {module.icon}
                                    <span className="font-medium">{module.name}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <MacScrollbar className="w-full h-full overflow-hidden select-none"
                        skin={theme == "light" ? "light" : "dark"}
                    >
                        <div className="w-full h-full px-10 pt-10">
                            {activeModule == "basic" && (
                                <UserBaiscInfo />
                            )}

                            {activeModule == "password" && (
                                <PasswordView />
                            )}

                            {activeModule == "email" && (
                                <EmailSettings />
                            )}

                            {activeModule == "mambaout" && (
                                <DeleteAccount />
                            )}
                        </div>
                    </MacScrollbar>
                </div>
            </div>
        </div>
    )
}