"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button"
import ThemeSwitcher from "@/components/ToggleTheme"
import Link from "next/link";

import { ArrowUpToLine, ArrowDownToLine, UserRoundMinus, Settings } from 'lucide-react'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"

import { House, Flag, UsersRound, Info, NotebookText, KeyRound } from 'lucide-react'

import {useTranslations} from 'next-intl';
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

const PageHeader = ({ lng } : { lng: string }) => {

    const t = useTranslations();
    const [isOpen, setIsOpen] = useState(false);

    const [cookies, setCookie, removeCookie] = useCookies(["uid"])
    const { curProfile } = useGlobalVariableContext()

    let path = (usePathname() || "/zh").slice(lng.length + 2);

    if (path == "") { path = "home"; }

    const whetherSelected = (name: string) => {
        return (path == name) ? "secondary" : "ghost";
    }

    useEffect(() => {

    }, [])

    return (
        <header className="sticky top-0 h-16 backdrop-blur-sm select-none">
            <SafeComponent animation={false}>
                <div className="container-wrapper h-full">
                    <div className="container h-16 items-center header-theme hidden md:flex">
                        <div className="md:flex items-center">
                            <TransitionLink href={`/${lng}`}>
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
                                <Button variant={whetherSelected("home")}>
                                    <TransitionLink className="transition-colors flex items-center gap-2  hover:text-foreground/80 text-foreground/80" href={`/${lng}`}>
                                        <House />
                                        <span className="font-bold text-base ml-[-2px]">{t("home")}</span>
                                    </TransitionLink>
                                </Button>
                                <Button variant={whetherSelected("games")}>
                                    <TransitionLink className="transition-colors flex items-center gap-2 hover:text-foreground/80 text-foreground/80" href={`/${lng}/games`}>
                                        <Flag />
                                        <span className="font-bold text-base ml-[-2px]">{t("race")}</span>
                                    </TransitionLink>
                                </Button>
                                <Button variant={whetherSelected("teams")}>
                                    <TransitionLink className="transition-colors flex items-center gap-2 hover:text-foreground/80 text-foreground/80" href={`/${lng}/teams`}>
                                        <UsersRound />
                                        <span className="font-bold text-base ml-[-2px]">{t("team")}</span>
                                    </TransitionLink>
                                </Button>
                                <Button variant={whetherSelected("about")}>
                                    <TransitionLink className="transition-colors flex items-center gap-2 hover:text-foreground/80 text-foreground/80" href={`/${lng}/about`}>
                                        <Info />
                                        <span className="font-bold text-base ml-[-2px]">{t("about")}</span>
                                    </TransitionLink>
                                </Button>

                                <Button variant={whetherSelected("wp")} disabled>
                                    <TransitionLink className="transition-colors flex items-center gap-2 hover:text-foreground/80 text-foreground/80" href={`/${lng}/wp`}>
                                        <NotebookText />
                                        <span className="font-bold text-base ml-[-2px]">{t("wp")}</span>
                                    </TransitionLink>
                                </Button>
                            </nav>
                        </div>
                        <div className="flex flex-1 items-center justify-between gap-3 md:justify-end">
                            <ThemeSwitcher lng={lng} />
                            { cookies.uid ? (
                                <>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger>
                                            <Avatar className="select-none">
                                                <AvatarImage src={curProfile.avatar || "#"} alt="@shadcn" />
                                                <AvatarFallback><Skeleton className="h-12 w-12 rounded-full" /></AvatarFallback>
                                            </Avatar>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="mt-2">
                                            <DropdownMenuItem>
                                                <Settings />
                                                <span>Settings</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <UserRoundMinus />
                                                <span>LoginOut</span>
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
                                        <Button variant={whetherSelected("home")}>
                                            <TransitionLink className="transition-colors flex items-center gap-2 hover:text-foreground/80 text-foreground/80" href={`/${lng}`}>
                                                <House />
                                                <span className="font-bold text-base ml-[-2px]">{t("home")}</span>
                                            </TransitionLink>
                                        </Button>
                                        <Button variant={whetherSelected("games")}>
                                            <TransitionLink className="transition-colors flex items-center gap-2 hover:text-foreground/80 text-foreground/80" href={`/${lng}/games`}>
                                                <Flag />
                                                <span className="font-bold text-base ml-[-2px]">{t("race")}</span>
                                            </TransitionLink>
                                        </Button>
                                        <Button variant={whetherSelected("teams")}>
                                            <TransitionLink className="transition-colors flex items-center gap-2 hover:text-foreground/80 text-foreground/80" href={`/${lng}/teams`}>
                                                <UsersRound />
                                                <span className="font-bold text-base ml-[-2px]">{t("team")}</span>
                                            </TransitionLink>
                                        </Button>
                                        <Button variant={whetherSelected("about")}>
                                            <TransitionLink className="transition-colors flex items-center gap-2 hover:text-foreground/80 text-foreground/80" href={`/${lng}/about`}>
                                                <Info />
                                                <span className="font-bold text-base ml-[-2px]">{t("about")}</span>
                                            </TransitionLink>
                                        </Button>

                                        <Button variant={whetherSelected("wp")} disabled>
                                            <TransitionLink className="transition-colors flex items-center gap-2 hover:text-foreground/80 text-foreground/80" href={`/${lng}/wp`}>
                                                <NotebookText />
                                                <span className="font-bold text-base ml-[-2px]">{t("wp")}</span>
                                            </TransitionLink>
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