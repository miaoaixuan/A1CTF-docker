"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button"
import ThemeSwitcher from "@/components/ToggleTheme"
import { Label } from "@radix-ui/react-dropdown-menu";
import Link from "next/link";

import { ArrowUpToLine, ArrowDownToLine } from 'lucide-react'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"

import { House, Flag, UsersRound, Info, NotebookText, KeyRound } from 'lucide-react'

import {useTranslations} from 'next-intl';
import { TransitionLink } from "./TransitionLink";

// import { cookies } from "next/headers";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

const PageHeader = ({ lng } : { lng: string }) => {

    const t = useTranslations();
    const [isOpen, setIsOpen] = useState(false);

    let path = (usePathname() || "/zh").slice(lng.length + 2);

    if (path == "") { path = "home"; }

    const whetherSelected = (name: string) => {
        return (path == name) ? "secondary" : "ghost";
    }

    return (
        <header className="sticky top-0 h-16 backdrop-blur-sm">
            <div className="container-wrapper h-full">
                <div className="container h-16 items-center header-theme hidden md:flex">
                    <div className="md:flex items-center">
                        <TransitionLink href={`/${lng}`}>
                            <Image
                                className="dark:invert"
                                src="/images/A1natas.svg"
                                alt="A1natas"
                                width={40}
                                height={30}
                                priority
                            />
                        </TransitionLink>
                        <nav className="flex items-center pl-6 gap-1 text-sm xl:gap-2">
                            <Button asChild variant={whetherSelected("home")}>
                                <TransitionLink className="transition-colors hover:text-foreground/80 text-foreground/80" href={`/${lng}`}>
                                    <House />
                                    <Label className="font-bold text-base ml-[-2px]">{t("home")}</Label>
                                </TransitionLink>
                            </Button>
                            <Button asChild variant={whetherSelected("games")}>
                                <TransitionLink className="transition-colors hover:text-foreground/80 text-foreground/80" href={`/${lng}/games`}>
                                    <Flag />
                                    <Label className="font-bold text-base ml-[-2px]">{t("race")}</Label>
                                </TransitionLink>
                            </Button>
                            <Button asChild variant={whetherSelected("teams")}>
                                <TransitionLink className="transition-colors hover:text-foreground/80 text-foreground/80" href={`/${lng}/teams`}>
                                    <UsersRound />
                                    <Label className="font-bold text-base ml-[-2px]">{t("team")}</Label>
                                </TransitionLink>
                            </Button>
                            <Button asChild variant={whetherSelected("about")}>
                                <TransitionLink className="transition-colors hover:text-foreground/80 text-foreground/80" href={`/${lng}/about`}>
                                    <Info />
                                    <Label className="font-bold text-base ml-[-2px]">{t("about")}</Label>
                                </TransitionLink>
                            </Button>

                            <Button asChild variant={whetherSelected("wp")}>
                                <TransitionLink className="transition-colors hover:text-foreground/80 text-foreground/80" href={`/${lng}/wp`}>
                                    <NotebookText />
                                    <Label className="font-bold text-base ml-[-2px]">{t("wp")}</Label>
                                </TransitionLink>
                            </Button>
                        </nav>
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-2 md:justify-end">
                        <ThemeSwitcher lng={lng} />
                        <Button asChild>
                            <TransitionLink href={`/${lng}/signup`}>{t("signup")}</TransitionLink>
                        </Button>
                        <Button asChild variant="outline">
                            <TransitionLink href={`/${lng}/login`}>{t("login")}</TransitionLink>
                        </Button>
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
                                height={30}
                                priority
                            />
                            <Label className="font-bold ml-2">A1CTF</Label>
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
                                    <Button asChild variant={whetherSelected("home")}>
                                        <TransitionLink className="transition-colors hover:text-foreground/80 text-foreground/80" href={`/${lng}`}>
                                            <House />
                                            <Label className="font-bold text-base ml-[-2px]">{t("home")}</Label>
                                        </TransitionLink>
                                    </Button>
                                    <Button asChild variant={whetherSelected("games")}>
                                        <TransitionLink className="transition-colors hover:text-foreground/80 text-foreground/80" href={`/${lng}/games`}>
                                            <Flag />
                                            <Label className="font-bold text-base ml-[-2px]">{t("race")}</Label>
                                        </TransitionLink>
                                    </Button>
                                    <Button asChild variant={whetherSelected("teams")}>
                                        <TransitionLink className="transition-colors hover:text-foreground/80 text-foreground/80" href={`/${lng}/teams`}>
                                            <UsersRound />
                                            <Label className="font-bold text-base ml-[-2px]">{t("team")}</Label>
                                        </TransitionLink>
                                    </Button>
                                    <Button asChild variant={whetherSelected("about")}>
                                        <TransitionLink className="transition-colors hover:text-foreground/80 text-foreground/80" href={`/${lng}/about`}>
                                            <Info />
                                            <Label className="font-bold text-base ml-[-2px]">{t("about")}</Label>
                                        </TransitionLink>
                                    </Button>

                                    <Button asChild variant={whetherSelected("wp")}>
                                        <TransitionLink className="transition-colors hover:text-foreground/80 text-foreground/80" href={`/${lng}/wp`}>
                                            <NotebookText />
                                            <Label className="font-bold text-base ml-[-2px]">{t("wp")}</Label>
                                        </TransitionLink>
                                    </Button>
                                    
                                    <DropdownMenuSeparator />

                                    <Button asChild variant="ghost" className="mt-[0.5px]">
                                        <TransitionLink href={`/${lng}/login`}>
                                            <KeyRound /><Label className="font-bold">{t("login")}</Label>
                                        </TransitionLink>
                                    </Button>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default PageHeader