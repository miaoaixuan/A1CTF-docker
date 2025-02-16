"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button"
import ThemeSwitcher from "@/components/ToggleTheme"
import Link from "next/link";

import { ArrowUpToLine, ArrowDownToLine, UserRoundMinus, Settings, Wrench } from 'lucide-react'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"

import { House, Flag, UsersRound, Info, NotebookText, KeyRound } from 'lucide-react'

import { useTranslations, useLocale } from 'next-intl';
import { TransitionLink } from "./TransitionLink";

// import { cookies } from "next/headers";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useCookies } from 'react-cookie';
import SafeComponent from "./SafeComponent";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useGlobalVariableContext } from "@/contexts/GlobalVariableContext";
import { Skeleton } from "./ui/skeleton";
import { DropdownMenuLabel } from "@radix-ui/react-dropdown-menu";
import { useTransitionContext } from "@/contexts/TransitionContext";
import api, { Role } from "@/utils/GZApi";
import { toast } from "sonner";

const PageHeader = () => {

    const lng = useLocale();

    const t = useTranslations();
    const [isOpen, setIsOpen] = useState(false);

    const curPath = usePathname();

    const [cookies, setCookie, removeCookie] = useCookies(["uid"])
    const { curProfile, updateProfile } = useGlobalVariableContext()

    let path = (usePathname() || "/zh").slice(lng.length + 2);

    if (path == "") { path = "home"; }

    const whetherSelected = (name: string) => {
        return (path == name) ? "secondary" : "ghost";
    }

    const { startTransition } = useTransitionContext();
    const router = useRouter()

    useEffect(() => {

    }, [])

    return (
        <header className="sticky top-0 h-16 backdrop-blur-sm select-none">
            <SafeComponent animation={false}>
                <div className="container-wrapper h-full">
                    <div className="container h-16 items-center header-theme hidden md:flex">
                        <div className="md:flex items-center">
                            <TransitionLink href={`/${lng}`} className="flex-shrink-0">
                                <Image
                                    className="dark:invert"
                                    src="/images/A1natas.svg"
                                    alt="A1natas"
                                    width={40}
                                    height={40}
                                    priority
                                />
                            </TransitionLink>
                            <nav className="flex items-center pl-6 gap-1 text-sm xl:gap-2">
                                <Button variant={whetherSelected("home")} onClick={() => {
                                    if (curPath != `/${lng}` ) router.push(`/${lng}`)
                                }}>
                                    <House />
                                    <span className="font-bold text-base ml-[-2px]">{t("home")}</span>
                                </Button>
                                <Button variant={whetherSelected("games")} onClick={() => {
                                    if (curPath != `/${lng}/games` ) router.push(`/${lng}/games`)
                                }}>
                                    <Flag />
                                    <span className="font-bold text-base ml-[-2px]">{t("race")}</span>
                                </Button>
                                <Button variant={whetherSelected("teams")} onClick={() => {
                                    if (curPath != `/${lng}/teams` ) router.push(`/${lng}/teams`)
                                }}>
                                    <UsersRound />
                                    <span className="font-bold text-base ml-[-2px]">{t("team")}</span>
                                </Button>
                                <Button variant={whetherSelected("about")} onClick={() => {
                                    if (curPath != `/${lng}/about` ) router.push(`/${lng}/about`)
                                }}>
                                    <Info />
                                    <span className="font-bold text-base ml-[-2px]">{t("about")}</span>
                                </Button>

                                <Button variant={whetherSelected("wp")}>
                                    <NotebookText />
                                    <span className="font-bold text-base ml-[-2px]">{t("wp")}</span>
                                </Button>
                            </nav>
                        </div>
                        <div className="flex flex-1 items-center justify-between gap-3 md:justify-end">
                            { (curProfile.role == Role.Admin || curProfile.role == Role.Monitor) && (
                                <Button variant={"outline"} onClick={() => {
                                    router.push("/admin/games")
                                }}><Wrench />Admin</Button>
                            ) }
                            <ThemeSwitcher />
                            { cookies.uid ? (
                                <>
                                    <DropdownMenu>
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
                                                    <span className='text-background text-md'> { curProfile.userName?.substring(0, 2) } </span>
                                                </div>
                                            ) }
                                        </Avatar>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="mt-2">
                                            <DropdownMenuItem onClick={() => startTransition(() => {
                                                router.push(`/${lng}/profile`)
                                            })}>
                                                <Settings />
                                                <span>{ t("settings") }</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => startTransition(() => {
                                                router.push(`/${lng}/profile/password`)
                                            })}>
                                                <KeyRound />
                                                <span>{ t("change_password_header") }</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {
                                                api.account.accountLogOut().then(() => {
                                                    updateProfile(() => {
                                                        router.push(`/${lng}/`)
                                                        toast.success(t("login_out_success"), { position: "top-center" })
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
                                    <TransitionLink href={`/${lng}/signup`}>{t("signup")}</TransitionLink>
                                </Button>
                                <Button asChild variant="outline">
                                    <TransitionLink href={`/${lng}/login`}>{t("login")}</TransitionLink>
                                </Button>
                                </>
                            ) }
                        </div>
                    </div>
                    <div className="flex md:hidden items-center h-full">
                        <div className="flex w-full justify-start ml-4">
                            <TransitionLink href={`/${lng}`} className="flex items-center">
                                <Image
                                    className="dark:invert"
                                    src="/images/A1natas.svg"
                                    alt="A1natas"
                                    width={34}
                                    height={34}
                                    priority
                                />
                                <span className="font-bold ml-2">A1CTF</span>
                            </TransitionLink>
                        </div>
                        <div className="flex justify-end w-full">
                            <ThemeSwitcher />
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
                                        if (curPath != `/${lng}` ) router.push(`/${lng}`)
                                    }}>
                                        <House />
                                        <span className="font-bold text-base ml-[-2px]">{t("home")}</span>
                                    </Button>
                                    <Button variant={whetherSelected("games")} onClick={() => {
                                        if (curPath != `/${lng}/games` ) router.push(`/${lng}/games`)
                                    }}>
                                        <Flag />
                                        <span className="font-bold text-base ml-[-2px]">{t("race")}</span>
                                    </Button>
                                    <Button variant={whetherSelected("teams")} onClick={() => {
                                        if (curPath != `/${lng}/teams` ) router.push(`/${lng}/teams`)
                                    }}>
                                        <UsersRound />
                                        <span className="font-bold text-base ml-[-2px]">{t("team")}</span>
                                    </Button>
                                    <Button variant={whetherSelected("about")} onClick={() => {
                                        if (curPath != `/${lng}/about` ) router.push(`/${lng}/about`)
                                    }}>
                                        <Info />
                                        <span className="font-bold text-base ml-[-2px]">{t("about")}</span>
                                    </Button>

                                    <Button variant={whetherSelected("wp")}>
                                        <NotebookText />
                                        <span className="font-bold text-base ml-[-2px]">{t("wp")}</span>
                                    </Button>
                                        
                                        <DropdownMenuSeparator />

                                        <Button asChild variant="ghost" className="mt-[0.5px]">
                                            <TransitionLink href={`/${lng}/login`}>
                                                <KeyRound /><span className="font-bold">{t("login")}</span>
                                            </TransitionLink>
                                        </Button>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </SafeComponent>
        </header>
    )
}

export default PageHeader