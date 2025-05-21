import { Button } from "components/ui/button"
import ThemeSwitcher from "components/ToggleTheme"

import { ArrowUpToLine, ArrowDownToLine, UserRoundMinus, Settings, Wrench, User } from 'lucide-react'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "components/ui/dropdown-menu"

import { House, Flag, UsersRound, Info, NotebookText, KeyRound } from 'lucide-react'


import { useEffect, useState } from "react";

import { useCookies } from 'react-cookie';
import SafeComponent from "./SafeComponent";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";
import { Skeleton } from "./ui/skeleton";
import { DropdownMenuLabel } from "@radix-ui/react-dropdown-menu";
import { useTransitionContext } from "contexts/TransitionContext";
import { api, Role } from "utils/GZApi";
import { toast } from "sonner";
import { Link, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { UserRole } from "utils/A1API"

const PageHeader = ({ lng } : { lng: string }) => {
    
    const { t } = useTranslation()

    const [isOpen, setIsOpen] = useState(false);

    const curPath = useLocation().pathname;

    const [cookies, setCookie, removeCookie] = useCookies(["uid"])
    const { curProfile, updateProfile } = useGlobalVariableContext()

    let path = (useLocation().pathname || "/zh").slice(lng.length + 2);

    if (path == "") { path = "home"; }

    const whetherSelected = (name: string) => {
        return (path == name) ? "default" : "ghost";
    }

    const { startTransition } = useTransitionContext();

    const navigate = useNavigate();

    const { clientConfig } = useGlobalVariableContext()

    return (
        <div className="sticky top-0 h-16 select-none z-1">
            <SafeComponent animation={false}>
                <div className="flex w-full h-full items-center justify-center">
                    <div className="container h-16 items-center hidden md:flex">
                        <div className="md:flex items-center">
                            <Link to={`/${lng}`} className="flex-shrink-0">
                                <img
                                    className="dark:invert"
                                    src={clientConfig.SVGIcon}
                                    alt={clientConfig.SVGAltData}
                                    width={40}
                                    height={40}
                                />
                            </Link>
                            <nav className="flex items-center pl-6 gap-1 text-sm xl:gap-2">
                                <Button variant={whetherSelected("home")} onClick={() => {
                                    if (curPath != `/${lng}` ) navigate(`/${lng}`)
                                }}>
                                    <House />
                                    <span className="font-bold text-base ml-[-2px]">{t("home")}</span>
                                </Button>
                                <Button variant={whetherSelected("games")} onClick={() => {
                                    if (curPath != `/${lng}/games` ) navigate(`/${lng}/games`)
                                }}>
                                    <Flag />
                                    <span className="font-bold text-base ml-[-2px]">{t("race")}</span>
                                </Button>
                                <Button variant={whetherSelected("about")} onClick={() => {
                                    if (curPath != `/${lng}/about` ) navigate(`/${lng}/about`)
                                }}>
                                    <Info />
                                    <span className="font-bold text-base ml-[-2px]">{t("about")}</span>
                                </Button>

                                <Button variant={whetherSelected("wp")} onClick={() => {
                                        window.open("https://wp.a1natas.com")
                                }}>
                                    <NotebookText />
                                    <span className="font-bold text-base ml-[-2px]">{t("wp")}</span>
                                </Button>
                            </nav>
                        </div>
                        <div className="flex flex-1 items-center justify-between gap-3 md:justify-end">
                            { ((curProfile.role == UserRole.ADMIN || curProfile.role == UserRole.MONITOR) && cookies.uid) && (
                                <Button variant={"outline"} onClick={() => {
                                    navigate(`/${lng}/admin/`)
                                }}><Wrench />Admin</Button>
                            ) }
                            <ThemeSwitcher lng={lng} />
                            { cookies.uid ? (
                                <>
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger>
                                        <Avatar className="select-none">
                                            { curProfile.avatar ? (
                                                <>
                                                    <AvatarImage src={curProfile.avatar || "#"} alt="@shadcn"
                                                        className={`rounded-2xl`}
                                                    />
                                                    <AvatarFallback><Skeleton className="h-full w-full rounded-full" /></AvatarFallback>
                                                </>
                                            ) : ( 
                                                <div className='w-full h-full bg-foreground/80 flex items-center justify-center rounded-2xl'>
                                                    <span className='text-background text-md'> { curProfile.username?.substring(0, 2) } </span>
                                                </div>
                                            ) }
                                        </Avatar>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="mt-2">
                                            <DropdownMenuItem onClick={() => startTransition(() => {
                                                navigate(`/${lng}/profile`)
                                            })}>
                                                <Settings />
                                                <span>{ t("settings") }</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => startTransition(() => {
                                                navigate(`/${lng}/teams`)
                                            })}>
                                                <UsersRound />
                                                <span>{ t("team") }</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => startTransition(() => {
                                                navigate(`/${lng}/profile/password`)
                                            })}>
                                                <KeyRound />
                                                <span>{ t("change_password_header") }</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {
                                                api.account.accountLogOut().then(() => {
                                                    updateProfile(() => {
                                                        navigate(`/${lng}/`)
                                                        toast.success(t("login_out_success"))
                                                    })
                                                })
                                            }}>
                                                <UserRoundMinus />
                                                <span>{ t("login_out") }</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </>
                            ) : (
                                <>
                                    <Button asChild>
                                        <Link to={`/${lng}/signup`}>{t("signup")}</Link>
                                    </Button>
                                    <Button asChild variant="outline">
                                        <Link to={`/${lng}/login`}>{t("login")}</Link>
                                    </Button>
                                </>
                            ) }
                        </div>
                    </div>
                    <div className="flex md:hidden items-center h-full">
                        <div className="flex w-full justify-start ml-4">
                            <Link to={`/${lng}`} className="flex items-center">
                                <img
                                    className="dark:invert"
                                    src={clientConfig.SVGIcon}
                                    alt={clientConfig.SVGAltData}
                                    width={34}
                                    height={34}
                                />
                                <span className="font-bold ml-2">A1CTF</span>
                            </Link>
                        </div>
                        <div className="flex justify-end w-full">
                            <ThemeSwitcher lng={lng} />
                            <div className="mr-2"></div>
                            <DropdownMenu onOpenChange={(open) => setIsOpen(open)}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="mr-4" size="icon">
                                    <div
                                        className={`transition-transform duration-300 ${
                                            isOpen ? "rotate-180" : "rotate-0"
                                        }`}
                                    >
                                        {isOpen ? <ArrowUpToLine /> : <ArrowUpToLine />}
                                    </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-54 mr-4 mt-2">
                                    <div className="grid gap-[2px] p-[0.5px]">
                                    <Button variant={whetherSelected("home")} onClick={() => {
                                        if (curPath != `/${lng}` ) navigate(`/${lng}`)
                                    }}>
                                        <House />
                                        <span className="font-bold text-base ml-[-2px]">{t("home")}</span>
                                    </Button>
                                    <Button variant={whetherSelected("games")} onClick={() => {
                                        if (curPath != `/${lng}/games` ) navigate(`/${lng}/games`)
                                    }}>
                                        <Flag />
                                        <span className="font-bold text-base ml-[-2px]">{t("race")}</span>
                                    </Button>
                                    <Button variant={whetherSelected("about")} onClick={() => {
                                        if (curPath != `/${lng}/about` ) navigate(`/${lng}/about`)
                                    }}>
                                        <Info />
                                        <span className="font-bold text-base ml-[-2px]">{t("about")}</span>
                                    </Button>

                                    <Button variant={whetherSelected("wp")} onClick={() => {
                                        window.open("https://wp.a1natas.com")
                                    }}>
                                        <NotebookText />
                                        <span className="font-bold text-base ml-[-2px]">{t("wp")}</span>
                                    </Button>
                                        
                                        <DropdownMenuSeparator />

                                        { cookies.uid ? (
                                            <>
                                                <DropdownMenu modal={false}>
                                                    <DropdownMenuTrigger>
                                                        <div className="flex w-full h-full items-center justify-center gap-2 pl-2 pr-2 pb-1">
                                                            <Avatar className="select-none">
                                                                { curProfile.avatar ? (
                                                                    <>
                                                                        <AvatarImage src={curProfile.avatar || "#"} alt="@shadcn"
                                                                            className={`rounded-2xl`}
                                                                        />
                                                                        <AvatarFallback><Skeleton className="h-full w-full rounded-full" /></AvatarFallback>
                                                                    </>
                                                                ) : ( 
                                                                    <div className='w-full h-full bg-foreground/80 flex items-center justify-center rounded-2xl'>
                                                                        <span className='text-background text-md'> { curProfile.username?.substring(0, 2) } </span>
                                                                    </div>
                                                                ) }
                                                            </Avatar>
                                                            <span className="text-md"> { curProfile.username } </span>
                                                        </div>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="mt-2">
                                                        <DropdownMenuItem onClick={() => startTransition(() => {
                                                            navigate(`/${lng}/profile`)
                                                        })}>
                                                            <Settings />
                                                            <span>{ t("settings") }</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => startTransition(() => {
                                                            navigate(`/${lng}/teams`)
                                                        })}>
                                                            <UsersRound />
                                                            <span>{ t("team") }</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => startTransition(() => {
                                                            navigate(`/${lng}/profile/password`)
                                                        })}>
                                                            <KeyRound />
                                                            <span>{ t("change_password_header") }</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => {
                                                            api.account.accountLogOut().then(() => {
                                                                updateProfile(() => {
                                                                    navigate(`/${lng}/`)
                                                                    toast.success(t("login_out_success"))
                                                                })
                                                            })
                                                        }}>
                                                            <UserRoundMinus />
                                                            <span>{ t("login_out") }</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </>
                                        ) : (
                                            <>
                                                <Button asChild variant="ghost" className="mt-[0.5px]">
                                                    <Link to={`/${lng}/login`}>
                                                        <KeyRound /><span className="font-bold">{t("login")}</span>
                                                    </Link>
                                                </Button>
                                                <Button asChild variant="ghost" className="mt-[0.5px] [&_svg]:size-[18px]">
                                                    <Link to={`/${lng}/signup`}>
                                                        <User /><span className="font-bold">{t("signup")}</span>
                                                    </Link>
                                                </Button>
                                            </>
                                        ) }
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </SafeComponent>
        </div>
    )
}

export default PageHeader