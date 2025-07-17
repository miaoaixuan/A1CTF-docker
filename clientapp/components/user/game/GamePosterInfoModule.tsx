import { CreateTeamDialog } from "components/dialogs/CreateTeamDialog";
import { JoinTeamDialog } from "components/dialogs/JoinTeamDialog";
import ImageLoader from "components/modules/ImageLoader";
import TimerDisplay from "components/modules/TimerDisplay";
import { Button } from "components/ui/button";
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";
import dayjs from "dayjs";
import { useNavigateFrom } from "hooks/NavigateFrom";
import { Album, CirclePlay, ClockAlert, Hourglass, IdCard, Key, Lock, Package, PencilLine, Pickaxe, ScanFace, ScanText, Users, UsersRound } from "lucide-react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router";
import { UserFullGameInfo } from "utils/A1API";

export default function GamePosterInfoModule(
    {
        gameInfo,
        gameStatus,
    }: {
        gameInfo: UserFullGameInfo | undefined,
        gameStatus: string,
    }
) {

    const { clientConfig } = useGlobalVariableContext()
    const { theme } = useTheme()

    const getGameIcon = () => {
        if (theme === "dark") {
            return gameInfo?.game_icon_dark ?? clientConfig.SVGIcon
        } else {
            return gameInfo?.game_icon_light ?? clientConfig.SVGIcon
        }
    }

    const [ navigateFrom, getNavigateFrom ] = useNavigateFrom()

    const gameStatusElement = {
        "unLogin": (
            <div className="flex gap-6 flex-col items-center">
                <div className="flex gap-4">
                    <Key size={36} />
                    <span className="text-2xl font-bold">请先登录</span>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="pointer-events-auto [&_svg]:size-[22px] gap-2"
                        onClick={() => {
                            navigateFrom("/login")
                        }}
                    >
                        <ScanFace />
                        <span className="text-[16px] font-bold">登录</span>
                    </Button>
                    <Button variant="outline" className="pointer-events-auto [&_svg]:size-[22px] gap-2"
                        onClick={() => {
                            navigateFrom("/signup")
                        }}
                    >
                        <IdCard />
                        <span className="text-[16px] font-bold">注册</span>
                    </Button>
                </div>
            </div>
        ),
        "ended": (
            <div className="flex gap-4 items-center">
                <ClockAlert size={36} />
                <span className="text-2xl font-bold">比赛已结束</span>
            </div>
        ),
        "waitForProcess": (
            <div className="flex gap-4 items-center">
                <ScanText size={36} />
                <span className="text-2xl font-bold">你的队伍正在审核中哦，请耐心等待</span>
            </div>
        ),
        "running": (
            <div className="flex flex-col gap-4 items-center">
                <div className="flex gap-4 items-center">
                    <CirclePlay size={36}/>
                    <span className="text-2xl font-bold">距离比赛结束还有</span>
                </div>
                <TimerDisplay
                    className="text-xl font-bold"
                    targetTime={dayjs(gameInfo?.end_time)}
                    onFinishCallback={() => { }}
                />
            </div>
        ),
        "banned": (
            <div className="flex flex-col gap-4 items-center">
                <div className="flex gap-4 items-center text-red-500 mb-4">
                    <Lock size={32}/>
                    <span className="text-2xl font-bold">你已被管理员禁赛</span>
                </div>
                <div className="flex gap-4 items-center">
                    <CirclePlay size={36}/>
                    <span className="text-2xl font-bold">距离比赛结束还有</span>
                </div>
                <TimerDisplay
                    className="text-xl font-bold"
                    targetTime={dayjs(gameInfo?.end_time)}
                    onFinishCallback={() => { }}
                />
            </div>
        ),
        "pending": (
            <div className="flex flex-col gap-4 items-center">
                <div className="flex gap-4 items-center">
                    <Hourglass size={36} />
                    <span className="text-2xl font-bold">距离比赛开始还有</span>
                </div>
                <TimerDisplay
                    className="text-xl font-bold"
                    targetTime={dayjs(gameInfo?.start_time)}
                    onFinishCallback={() => { }}
                />
            </div>
        ),
        "unRegistered": (
            <div className="flex flex-col gap-8 items-center">
                <div className="flex gap-4">
                    <PencilLine size={36} />
                    <span className="text-2xl font-bold">你还没有报名哦，请先报名</span>
                </div>
                <div className="flex gap-4 pointer-events-auto">
                    <CreateTeamDialog callback={() => {
                        // setTimeout(() => {
                        //     fetchGameInfoWithTeamInfo()
                        // }, 600)
                    }} gameID={gameInfo?.game_id ?? 0}>
                        <Button variant="default" type="button"><Pickaxe />创建队伍</Button>
                    </CreateTeamDialog>
                    <JoinTeamDialog callback={() => {
                        // setTimeout(() => {
                        //     fetchGameInfoWithTeamInfo()
                        // }, 600)
                    }}>
                        <Button variant="default" type="button"><Users />加入队伍</Button>
                    </JoinTeamDialog>

                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col w-full overflow-hidden select-none lg:gap-16 gap-6">
            <div className="relative">
                <div className="w-full aspect-video border-t-2 border-l-2 border-r-2 bg-background rounded-xl overflow-hidden">
                    <ImageLoader
                        src={gameInfo?.poster || clientConfig.DefaultBGImage}
                        className=""
                    />
                </div>
                <div className="absolute bottom-0 w-full border-b-2 border-l-2 border-r-2 rounded-b-2xl overflow-hidden backdrop-blur-md bg-background/10">
                    <div className="w-full h-full py-4 px-7">
                        <div className="flex gap-6 items-center">
                            <img
                                width={"12%"}
                                height={"12%"}
                                className="min-w-[48px] min-h-[48px]"
                                src={getGameIcon()}
                                alt={gameInfo?.name ?? "A1CTF ???????"}
                            />
                            <div className="flex flex-col min-w-0">
                                <span className="font-bold text-2xl text-nowrap pointer-events-auto overflow-ellipsis overflow-hidden whitespace-nowrap block"
                                    data-tooltip-content={gameInfo?.name}
                                    data-tooltip-id="my-tooltip"
                                    data-tooltip-place="top"
                                >{gameInfo?.name}</span>
                                <span className="text-md text-nowrap overflow-ellipsis pointer-events-auto overflow-hidden whitespace-nowrap block"
                                    data-tooltip-content={gameInfo?.summary}
                                    data-tooltip-id="my-tooltip"
                                    data-tooltip-place="bottom"
                                >{gameInfo?.summary}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex gap-2 w-full justify-center items-center">
                {(gameStatusElement as any)[gameStatus]}
            </div>
            <div className="flex w-full justify-center items-center gap-4 mt-[-16px]">
                <div className="flex gap-2 rounded-full border-1 items-center bg-blue-400/60 border-blue-400 px-4 py-1 text-black/70">
                    <UsersRound size={20} />
                    <span>人数限制: { gameInfo?.team_number_limit }</span>
                </div>
                <div className="flex gap-2 rounded-full border-1 items-center bg-orange-400/60 border-orange-400 px-4 py-1 text-black/70">
                    <Package size={20} />
                    <span>容器限制: { gameInfo?.container_number_limit }</span>
                </div>
            </div>
        </div>
    )
}