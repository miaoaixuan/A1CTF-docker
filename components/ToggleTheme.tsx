"use client";

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import { Sun, Moon, WandSparkles, MonitorCog } from 'lucide-react'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import SkyBackground from './SkyBackground'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

import Link from "next/link";
import { usePathname, useSearchParams } from 'next/navigation'

import { useTranslation } from '@/app/i18n/client';

const ThemeSwitcher = ({ lng } : { lng: string }) => {
    const [mounted, setMounted] = useState(false)
    const { theme, setTheme } = useTheme()
    const { t } = useTranslation(lng);

    const asPath = usePathname() + ( useSearchParams().size ? "?" + useSearchParams() : ""); // 获取当前路径

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button variant="outline" size="icon">
                {/* <WandSparkles className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" /> */}
                <WandSparkles className="absolute h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Toggle theme</span>
            </Button>
        )
    }

    const toggleTheme = () => {
        // console.log("added!")
        const body = document.querySelector("body");
        body?.classList.add("transition-colors-custom");
        setTheme(theme === 'light' ? 'dark' : 'light')
    }
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    {/* <WandSparkles className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" /> */}
                    <WandSparkles className="absolute h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='p-6 bg-transparent mt-[-10px] w-50 grid gap-[5px] shadow-none mr-4 md:mr-0'
                style={{ border: 'none' }}
            >
                <motion.div className="flex justify-left items-center w-full"
                    whileHover={{
                        scale: 1.05
                    }}
                    whileTap={{
                        scale: 1.05
                    }}
                    transition={{
                        type: "spring", // 使用弹性动画
                        stiffness: 400, // 动画弹性
                        duration: 100,
                        damping: 20, // 动画阻尼
                    }}
                >
                    <motion.div className='flex-col justify-center shadow-md w-44 h-[46px] border-[1.5px] rounded-[12px] overflow-hidden'
                        style={{ "backgroundColor": "hsl(var(--background))" }}
                    >
                        <motion.button
                            className="transition-all ease-in-out duration-400 relative w-44 h-11 rounded-[10px] hover:rounded-[0px] bg-gray-300 dark:bg-gray-600 flex items-center justify-center focus:outline-none overflow-hidden"
                            onClick={toggleTheme}
                            // animate={{ backgroundColor: theme === 'light' ? '#D1D5DB' : '#4B5563' }}
                        >
                            <SkyBackground theme={theme || 'light'} />
                            <motion.div
                                className="absolute w-8 h-8 rounded-[10px] bg-white shadow-md flex items-center justify-center z-10 opacity-80"
                                initial={{
                                    x: theme === 'light' ? -64 : 64, // 固定在左侧或右侧
                                    rotate: theme === 'light' ? 0 : 360
                                }}
                                animate={{
                                    x: theme === 'light' ? -64 : 64,
                                    rotate: theme === 'light' ? 0 : 360,
                                }}
                                transition={{ type: 'spring', stiffness: 450, damping: 90 }}
                            >
                                {theme === 'light' ? (
                                    <Sun className="w-6 h-6 text-yellow-500" />
                                ) : (
                                    <Moon className="w-6 h-6 text-blue-500" />
                                )}
                            </motion.div>
                        </motion.button>
                        <div className='w-full justify-center p-1 hidden lg:flex mt-[0.5px]'>
                            <Button variant="ghost" className="w-full p-2 rounded-[10px]" >
                                <div className='flex justify-between w-full '>
                                    <Label className='font-bold'>{t("system_color")}</Label>
                                    <MonitorCog />
                                </div>
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
                <motion.div className='flex border-[1.5px] rounded-[10px] w-44 shadow-md'
                    style={{ "backgroundColor": "hsl(var(--background))" }}
                    whileHover={{
                        scale: 1.05
                    }}
                    whileTap={{
                        scale: 1.05
                    }}
                    transition={{
                        type: "spring", // 使用弹性动画
                        stiffness: 400, // 动画弹性
                        duration: 100,
                        damping: 20, // 动画阻尼
                    }}
                >
                    <div className='flex justify-center w-full gap-1 py-1'>
                        <Button asChild variant="ghost" size="icon">
                            <Link href={`/zh${asPath.slice(lng.length + 1)}`}><Label className='font-bold'>简</Label></Link>
                        </Button>
                        <Button asChild variant="ghost" size="icon">
                            <Label className='font-bold'>繁</Label>
                        </Button>
                        <Button asChild variant="ghost" size="icon">
                            <Link href={`/en${asPath.slice(lng.length + 1)}`}><Label className='font-bold'>En</Label></Link>
                        </Button>
                        <Button asChild variant="ghost" size="icon">
                            <Label className='font-bold'>日</Label>
                        </Button>
                    </div>
                </motion.div>
                <motion.div className='flex border-[1.5px] rounded-[10px] w-44 p-1 shadow-md'
                    style={{ "backgroundColor": "hsl(var(--background))" }}
                    whileHover={{
                        scale: 1.05
                    }}
                    whileTap={{
                        scale: 1.05
                    }}
                    transition={{
                        type: "spring", // 使用弹性动画
                        stiffness: 400, // 动画弹性
                        duration: 100,
                        damping: 20, // 动画阻尼
                    }}
                >
                    <Button variant="ghost" className="w-full p-2" >
                        <div className='flex justify-between w-full '>
                            <Label className='font-bold'>{t("system_color")}</Label>
                            <MonitorCog />
                        </div>
                    </Button>
                </motion.div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default ThemeSwitcher

