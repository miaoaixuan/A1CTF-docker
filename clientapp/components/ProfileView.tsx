

import { Button } from "./ui/button";
import { MacScrollbar } from "mac-scrollbar";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { Accessibility, Eclipse, Ellipsis, KeyRound, Mail, Plus, Save, UserRoundPen } from "lucide-react";
import UserBaiscInfo from "./user/profile/UserBaiscInfo";
import { PasswordView } from "./user/profile/PasswordView";
import EmailSettings from "./user/profile/EmailSettings";
import DeleteAccount from "./user/profile/DeleteAccount";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "components/ui/dropdown-menu"

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
            <MacScrollbar className="w-full h-full select-none flex flex-col items-center"
                skin={theme == "light" ? "light" : "dark"}
            >
                <div className="flex container h-full">
                    {/* 左侧模块导航 */}
                    <div className="w-64 flex-none border-r-1 select-none hidden md:block sticky top-0">
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
                    {/* 移动端右下角按钮 */}
                    <div className="absolute bottom-8 right-8 md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-10"
                                >
                                    <div className="flex gap-2 items-center">
                                        <Ellipsis />
                                        <span className="text-sm">{modules.filter((e) => e.id == activeModule)[0].name}</span>
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="start">
                                <DropdownMenuLabel>资料设置</DropdownMenuLabel>
                                {modules.map((e) => (
                                    <DropdownMenuItem
                                        onClick={() => {
                                            navigate(`/profile/${e.id}`)
                                        }}
                                    >
                                        <div className="flex gap-2 items-center">
                                            {e.icon}
                                            {e.name}
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    主页
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="flex-1">
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
                    </div>
                </div>
            </MacScrollbar>
        </div>
    )
}