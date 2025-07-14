import AvatarUsername from "components/modules/AvatarUsername";
import ToggleTheme from "components/ToggleTheme";
import { Button } from "components/ui/button";
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";
import { BowArrow, Cctv, DoorOpen, Info, Settings, ShieldCheck, UserSearch, WandSparkles, Wrench } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { useNavigate } from "react-router";
import { UserFullGameInfo, UserRole } from "utils/A1API";

export default function GameViewSidebar(
    { 
        curChoicedModule,
        gameID,
        gameInfo,
        gameStatus,

    }: { 
        curChoicedModule: string, 
        gameID: string,
        gameInfo: UserFullGameInfo | undefined,
        gameStatus: string,
    }
) {

    const { clientConfig, curProfile } = useGlobalVariableContext()

    type Module = {
        id: string,
        name: string,
        icon: React.ReactNode,
        onclick?: () => void,
        shouldDisable?: () => boolean
    }

    const modules: Module[] = [
        {
            id: "info",
            name: "比赛信息",
            icon: <Info className="h-4 w-4" />,
        },
        {
            id: 'challenges',
            name: '题目列表',
            icon: <BowArrow className="h-4 w-4" />,
            shouldDisable: () => {
                return gameStatus != "running" && gameStatus != "practiceMode"
            }
        },
        {
            id: 'scoreboard',
            name: '排行榜',
            icon: <Cctv className="h-4 w-4" />,
            shouldDisable: () => {
                return gameStatus != "running" && gameStatus != "practiceMode" && gameStatus != "ended" && gameStatus != "banned"
            }
        },
        {
            id: 'team',
            name: '队伍管理',
            icon: <UserSearch className="h-4 w-4" />,
        },
    ];

    if (curProfile.role == UserRole.ADMIN) {
        modules.push({
            id: 'admin',
            name: '管理后台',
            icon: <Wrench className="h-4 w-4" />,
            onclick: () => {
                navigate(`/admin/games/${gameID}/basic`)
            }
        })
    }

    const navigate = useNavigate()

    return (
        <div className="w-16 h-full border-r-[1px] z-[20] bg-background">
            <div className="flex flex-col w-full h-full gap-4 items-center py-4 pt-5">
                <img
                    className="dark:invert mb-4"
                    src={clientConfig.SVGIcon}
                    alt={clientConfig.SVGAltData}
                    width={36}
                    height={36}
                    data-tooltip-id="my-tooltip"
                    data-tooltip-html="A1CTF 2025"
                    data-tooltip-place="right"
                />
                {modules.map((module, i) => (
                    <Button key={i} 
                        className={`w-[45px] h-[45px] [&_svg]:size-6 cursor-pointer rounded-xl ${curChoicedModule != module.id ? "hover:bg-foreground/10" : ""}`}
                        variant={curChoicedModule === module.id ? "default" : "ghost"}
                        data-tooltip-id="my-tooltip"
                        data-tooltip-html={module.name}
                        data-tooltip-place="right"
                        onClick={() => {
                            if (module.onclick) {
                                module.onclick()
                            } else {
                                navigate(`/games/${gameID}/${module.id}`)
                            }
                        }}
                        disabled={module.shouldDisable ? module.shouldDisable() : false}
                    >
                        {module.icon}
                    </Button>
                ))}
                <div className="flex-1" />
                {/* <div className="w-[35px] h-[35px] flex-shrink-0">
                    <AvatarUsername avatar_url={gameInfo?.team_info?.team_avatar} username={gameInfo?.team_info?.team_name || ""} />
                </div> */}
                <ToggleTheme>
                    <Button 
                        className={`w-[45px] h-[45px] [&_svg]:size-6 cursor-pointer rounded-xl`}
                        variant="ghost"
                        data-tooltip-id="my-tooltip"
                        data-tooltip-html="切换主题"
                        data-tooltip-place="right"
                    >
                        <WandSparkles className="absolute h-[1.2rem] w-[1.2rem]" />
                    </Button>
                </ToggleTheme>
                <Button className="w-[45px] h-[45px] [&_svg]:size-6 cursor-pointer rounded-xl hover:bg-foreground/10" variant="ghost"
                    data-tooltip-id="my-tooltip"
                    data-tooltip-html="退出"
                    data-tooltip-place="right"
                    onClick={() => {
                        navigate("/games")
                    }}
                >
                    <DoorOpen />
                </Button>
            </div>
        </div>
    )
}