import LetterGlitch from "./reactbits/LetterGlitch/LetterGlitch";
import PixelCard from "./reactbits/PixelCard/PixelCard";
import SplitText from "./reactbits/SplitText/SplitText";
import { useSprings, animated, easings } from '@react-spring/web';
import SafeComponent from "./SafeComponent";
import { Bone, DoorOpen, Flag, GitPullRequestArrow, Info, Key, KeyRound, Settings, UserRound, UserRoundMinus, UsersRound, Wrench, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import Dock from "./reactbits/Dock/Dock";
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "components/ui/dropdown-menu"
import { api, BasicGameInfoModel, DetailedGameInfoModel, GameDetailModel, Role } from "utils/GZApi";
import { toast } from 'react-toastify/unstyled';
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";
import { useCookies } from "react-cookie";
import GameSwitchHover from "./GameSwitchHover";
import { useGameSwitchContext } from "contexts/GameSwitchContext";
import Counter from "./reactbits/Counter/Counter";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { isMobile } from 'react-device-detect';
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

export function ActivityPage({ lng, gameDetailModel } : { lng: string, gameDetailModel: DetailedGameInfoModel }) {
    
    const { t } = useTranslation("activity_page");
    const { curProfile, updateProfile, clientConfig } = useGlobalVariableContext()

    const [cookies, setCookie, removeCookie] = useCookies(["uid"])
    const router = useNavigate()

    const [curGame, setCurGame] = useState<BasicGameInfoModel>();
    const [unit, setUnit] = useState("second");
    const [leftTime, setLeftTime] = useState(0);
    const [countColor, setCountColor] = useState("white");
    const [title, setTitle] = useState("ZJNU CTF 2025 IS COMING")

    const { setIsChangingGame, setCurSwitchingGame, setPosterData } = useGameSwitchContext();

    const items = [
        { icon: <UsersRound size={22} />, label: t("team"), onClick: () => { router(`/${lng}/teams`) } },
        { icon: <Flag size={22} />, label: t("race"), onClick: () => { router(`/${lng}/games`) } },
        { icon: <Info size={22} />, label: t("about"), onClick: () => { router(`/${lng}/about`) } },
        { icon: <GitPullRequestArrow size={22} />, label: t("version"), onClick: () => { router(`/${lng}/version`) } }
    ];

    const targetGameID = 50;

    const handleChangeGame = () => {
        if (curGame) {
            // 预下载海报，防闪
            fetch(curGame.poster || clientConfig.DefaultBGImage).then(res => res.blob())
            .then(blob => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            }).then(dataURL => {
                setPosterData(dataURL as string)
                // FIXME 这里要修复
                // setCurSwitchingGame(curGame)
                setIsChangingGame(true)

                // 动画时间
                setTimeout(() => {
                    router(`/games/${curGame.id}`);
                }, 1800)
            })
        }
    }

    let LeftTimeInter: NodeJS.Timeout;

    useEffect(() => {
        const curGame = gameDetailModel as BasicGameInfoModel;
        setCurGame(curGame);

        // curGame.end = dayjs().add(10, "seconds").valueOf()

        LeftTimeInter = setInterval(() => {
            const diffDays = dayjs(curGame.start).diff(dayjs(), "day");
            if (diffDays >= 2) {
                setUnit("days")
                setLeftTime(diffDays)
                return
            }

            const diffHours = dayjs(curGame.start).diff(dayjs(), "hour");

            if (diffHours <= 10) {
                setCountColor("red")
            }

            if (diffHours > 0) {
                setUnit("hours")
                setLeftTime(diffHours)
                return
            }

            const diffMinutes = dayjs(curGame.start).diff(dayjs(), "minute");

            if (diffMinutes > 0) {
                setUnit("minutes")
                setLeftTime(diffMinutes)
                return
            }

            const diffSeconds = dayjs(curGame.start).diff(dayjs(), "second");
            if (diffSeconds >= 0) {
                setUnit("seconds")
                setLeftTime(diffSeconds)
                return
            } else {
                clearInterval(LeftTimeInter)
                setTitle("ZJNU CTF 2025 IS STARTED")
            }

        }, 100)

        return () => {
            if (LeftTimeInter)
                clearInterval(LeftTimeInter)
        }
    }, [gameDetailModel])

    return (
        <>
            <GameSwitchHover animation={true} />
            <motion.div className="absolute top-0 left-0 w-screen h-screen bg-black">

            </motion.div>
            <motion.div className="absolute flex w-screen h-screen justify-center items-center"
                initial={{
                    opacity: 0
                }}
                animate={{
                    opacity: 1
                }}
                transition={{
                    duration: 1.5
                }}
            >
                <LetterGlitch
                    glitchSpeed={100}
                    glitchColors={['#CC9117', '#61dca3', '#61b3dc']}
                    centerVignette={true}
                    outerVignette={true}
                    smooth={true}
                />
            </motion.div>
            <motion.div className={`absolute flex w-screen h-screen justify-center items-center backdrop-blur-[3px] select-none flex-col gap-10 text-white ${ isMobile ? "p-5" : "" }`}>
                <SplitText
                    text={title}
                    className={`font-semibold text-center transition-all duration-300 [text-shadow:_#ffffff_1px_1px_10px] hover:[text-shadow:_#ffffff_5px_5px_15px] text-white ${ isMobile ? "text-[3em]" : "text-[5em]" }`}
                    delay={50}
                    animationFrom={{ opacity: 0, filter: "blur(10px)", transform: 'translate3d(0,50px,0)' }}
                    animationTo={{ opacity: 1, filter: "blur(0px)", transform: 'translate3d(0,0,0)'}}
                    easing={ easings.easeInOutCubic }
                    threshold={0.2}
                    rootMargin="-50px"
                    onLetterAnimationComplete={() => {}}
                />
                <motion.div className="overflow-hidden"
                    initial={{
                        height: 0,
                        opacity: 0
                    }}
                    animate={{
                        height: "auto",
                        opacity: 1
                    }}
                    transition={{
                        duration: 0.3,
                        delay: 1.5,
                        easings: "linear"
                    }}
                >
                    <PixelCard variant="pink" className={`h-[60px] rounded-2xl ${ isMobile ? "scale-[0.85]" : "" }`}>
                        <div className="absolute top-0 left-0 w-full h-full items-center justify-center flex gap-2 opacity-40 hover:opacity-100 duration-300 transition-opacity" onClick={() => {
                            handleChangeGame()
                        }}>
                            <div className="flex gap-3 items-center">
                                <DoorOpen />
                                <span className="text-2xl">Join Now</span>
                            </div>
                        </div>
                    </PixelCard>
                </motion.div>
            </motion.div>
            <motion.div className="absolute flex top-8 w-full pl-8 pr-4 items-center justify-center gap-2 text-white select-none">
                <div className={`flex items-center ${ isMobile ? "gap-0" : "gap-2" }`}>
                    <span className={`font-bold ${ isMobile ? "text-sm" : "text-2xl" }`}>Left</span>
                    <Counter
                        value={leftTime}
                        places={[100, 10, 1]}
                        fontSize={isMobile ? 20 : 30}
                        padding={5}
                        gap={isMobile ? 2 : 10}
                        textColor={countColor}
                        fontWeight={900}
                    />
                    <span className={`font-bold ${ isMobile ? "text-sm" : "text-2xl" }`}>{ unit }</span>
                </div>
                <div className="flex-1" />
                { ((curProfile.role == Role.Admin || curProfile.role == Role.Monitor) && cookies.uid) && (
                    <Button variant={"ghost"} onClick={() => {
                        router("/admin/games")
                    }}><Wrench />Admin</Button>
                ) }
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
                            <DropdownMenuContent className="mt-2 mr-3">
                                <DropdownMenuItem onClick={() => router(`/${lng}/profile`)}>
                                    <Settings />
                                    <span>{ t("settings") }</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router(`/${lng}/teams`)}>
                                    <UsersRound />
                                    <span>{ t("team") }</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router(`/${lng}/profile/password`)}>
                                    <KeyRound />
                                    <span>{ t("change_password_header") }</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                    api.account.accountLogOut().then(() => {
                                        updateProfile(() => {
                                            router(`/${lng}/`)
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
                        <Button variant="ghost" className='[&_svg]:size-5 text-white' onClick={() => {
                            router(`/${lng}/signup`)
                        }} >
                            <Bone />
                            <span>{t("signup")}</span>
                        </Button>
                        <Button variant="ghost" className='[&_svg]:size-5 text-white' onClick={() => {
                            router(`/${lng}/login`)
                        }} >
                            <Key />
                            <span>{t("login")}</span>
                        </Button>
                    </>
                ) }
            </motion.div>
            <motion.div className="absolute bottom-3 w-full flex justify-end items-center text-white"
                initial={{
                    opacity: 0
                }}
                animate={{
                    opacity: 1
                }}
                transition={{
                    duration: 1.5,
                    easings: "linear"
                }}
            >
                <Dock 
                    items={items}
                    panelHeight={66}
                    baseItemSize={45}
                    magnification={70}
                />
            </motion.div>
        </>
    )
}