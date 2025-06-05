import dayjs from "dayjs";
import { CirclePlus, Eye, EyeClosed, EyeOff, FilePenLine, Trash2, Search, Calendar, Users, Trophy, Settings, Play, Pause, Square } from "lucide-react";
import { MacScrollbar } from "mac-scrollbar";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { UserGameSimpleInfo } from "utils/A1API";
import { api } from "utils/ApiHelper";
import { FastAverageColor } from "fast-average-color"
import { useGlobalVariableContext } from "contexts/GlobalVariableContext";
import { useNavigate } from "react-router";

export function GameManagePage() { 

    const { theme } = useTheme()
    const [ games, setGames ] = useState<UserGameSimpleInfo[]>([])

    const router = useNavigate()

    const [ primaryColorMap, setPrimaryColorMap ] = useState<{ [key: number]: string }>({});

    // 懒加载, 当前题目卡片是否在视窗内
    const observerRef = useRef<IntersectionObserver | null>(null);
    const [visibleItems, setVisibleItems] = useState<Record<string, boolean>>({});
    const [isLoaded, setIsLoaded] = useState<Record<string, boolean>>({});
    const [searchContent, setSearchContent] = useState("")

    useEffect(() => {
        api.admin.listGames({ size: 16, offset: 0 }).then((res) => {
            setGames(res.data.data)
        })

        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const target = entry.target as HTMLElement; 
                
                const id = target.dataset.id as string;

                if (entry.isIntersecting) {
                    setVisibleItems((prev) => ({
                        ...prev,
                        [id]: true
                    }));
                    setIsLoaded((prev) => ({
                        ...prev,
                        [id]: true
                    }));
                } else {
                    setVisibleItems((prev) => ({
                        ...prev,
                        [id]: false
                    }));
                }
            }
        );
        },
        {
            rootMargin: "420px 0px",
        });
    }, [])

    const observeItem = (el: HTMLElement, id: string) => {
        if (el && observerRef.current) {
            el.dataset.id = id;
            observerRef.current.observe(el);
        }
    };

    const { clientConfig } = useGlobalVariableContext()

    // 获取比赛状态
    const getGameStatus = (game: UserGameSimpleInfo) => {
        const now = dayjs()
        const start = dayjs(game.start_time)
        const end = dayjs(game.end_time)

        if (now.isBefore(start)) {
            return { text: "即将开始", variant: "secondary", icon: <Pause className="h-3 w-3" /> }
        } else if (now.isAfter(start) && now.isBefore(end)) {
            return { text: "进行中", variant: "default", icon: <Play className="h-3 w-3" /> }
        } else {
            return { text: "已结束", variant: "destructive", icon: <Square className="h-3 w-3" /> }
        }
    }

    // 过滤比赛
    const filteredGames = games.filter((game) => {
        if (searchContent === "") return true;
        return game.name.toLowerCase().includes(searchContent.toLowerCase()) || 
               (game.summary && game.summary.toLowerCase().includes(searchContent.toLowerCase()));
    })

    return (
        <div className="w-full h-full flex flex-col bg-gradient-to-br from-background to-muted/30">
            {/* Header Section */}
            <div className="backdrop-blur-sm bg-background/80 border-b p-5 lg:p-8 sticky top-0 z-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <Trophy className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">比赛管理</h1>
                                <p className="text-sm text-muted-foreground">管理和配置 {games.length} 场比赛</p>
                            </div>
                        </div>
                        
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    value={searchContent} 
                                    onChange={(e) => setSearchContent(e.target.value)} 
                                    placeholder="搜索比赛名称或简介..."
                                    className="pl-10 bg-background/50 backdrop-blur-sm"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={() => router(`/admin/games/create`)}
                        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                        <CirclePlus className="h-4 w-4" />
                        添加比赛
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                {filteredGames.length ? (
                    <MacScrollbar className="h-full" skin={theme == "light" ? "light" : "dark"}>
                        <div className="p-6">
                            <div className={`grid gap-6 ${filteredGames.length > 2 ? "grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3" : "grid-cols-1 lg:grid-cols-2"}`}>
                                {filteredGames.map((game, index) => {
                                    const status = getGameStatus(game);
                                    return (
                                        <div 
                                            key={index} 
                                            className="group relative h-80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] bg-card border border-border/50"
                                            ref={(el) => observeItem(el!, index.toString())}
                                        >
                                            {(visibleItems[index.toString()] || isLoaded[index.toString()]) && (
                                                <>
                                                    {/* Background Image */}
                                                    <div className="absolute top-0 left-0 w-full h-full">
                                                        <img 
                                                            src={game.poster || clientConfig.DefaultBGImage} 
                                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                                            onLoad={(e) => {
                                                                const fac = new FastAverageColor();
                                                                const container = e.target as HTMLImageElement; 

                                                                fac.getColorAsync(container)
                                                                    .then((color: any) => {
                                                                        const brightness = 0.2126 * color.value[0] + 0.7152 * color.value[1] + 0.0722 * color.value[2];
                                                                        const brightColor = brightness > 128 ? "black" : "white";
                                                                        setPrimaryColorMap((prev) => ({
                                                                            ...prev,
                                                                            [index]: brightColor
                                                                        }));
                                                                    })
                                                                    .catch((e: any) => {
                                                                        console.log(e);
                                                                    });
                                                            }} 
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                                    </div>

                                                    {/* Content */}
                                                    <div className="absolute inset-0 p-6 flex flex-col justify-between" style={{ color: primaryColorMap[index] || "white" }}>
                                                        {/* Top Section */}
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex items-center gap-2">
                                                                <Badge 
                                                                    variant={status.variant as any} 
                                                                    className="backdrop-blur-sm bg-background/20 border-white/20 text-white shadow-lg"
                                                                >
                                                                    {status.icon}
                                                                    {status.text}
                                                                </Badge>
                                                                {!game.visible && (
                                                                    <Badge variant="outline" className="backdrop-blur-sm bg-background/20 border-white/20 text-white">
                                                                        <EyeClosed className="h-3 w-3" />
                                                                        隐藏
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Main Content */}
                                                        <div className="flex-1 flex flex-col justify-center">
                                                            <h3 className="text-2xl font-bold mb-2 line-clamp-2 text-white drop-shadow-lg">
                                                                {game.name}
                                                            </h3>
                                                            {game.summary && (
                                                                <p className="text-lg text-white/90 line-clamp-2 drop-shadow-md">
                                                                    {game.summary}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Bottom Section */}
                                                        <div className="flex justify-between items-end">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2 text-white/90">
                                                                    <Calendar className="h-4 w-4" />
                                                                    <span className="text-sm font-medium">
                                                                        {dayjs(game.start_time).format("MM/DD HH:mm")}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-white/90">
                                                                    <span className="text-sm">至</span>
                                                                    <span className="text-sm font-medium">
                                                                        {dayjs(game.end_time).format("MM/DD HH:mm")}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Action Buttons */}
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="secondary"
                                                                    className="backdrop-blur-sm bg-white/20 hover:bg-white/30 border-white/20 text-white h-9 w-9 p-0"
                                                                    onClick={() => router(`/admin/games/${game.game_id}`)}
                                                                    title="编辑比赛"
                                                                >
                                                                    <FilePenLine className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="secondary"
                                                                    className="backdrop-blur-sm bg-white/20 hover:bg-white/30 border-white/20 text-white h-9 w-9 p-0"
                                                                    title="设置"
                                                                >
                                                                    <Settings className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    className="backdrop-blur-sm bg-red-500/30 hover:bg-red-500/50 border-red-500/20 text-white h-9 w-9 p-0"
                                                                    title="删除比赛"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </MacScrollbar>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-muted/40 to-muted/20 flex items-center justify-center mb-4">
                            {searchContent ? (
                                <Search className="h-8 w-8 text-muted-foreground" />
                            ) : (
                                <Trophy className="h-8 w-8 text-muted-foreground" />
                            )}
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                            {searchContent ? "没有找到比赛" : "还没有比赛"}
                        </h3>
                        <p className="text-muted-foreground max-w-md">
                            {searchContent 
                                ? `没有找到包含 "${searchContent}" 的比赛` 
                                : "开始创建您的第一场比赛吧！"
                            }
                        </p>
                        {searchContent ? (
                            <Button 
                                variant="ghost" 
                                onClick={() => setSearchContent("")}
                                className="mt-4"
                            >
                                清除搜索
                            </Button>
                        ) : (
                            <Button 
                                onClick={() => router(`/admin/games/create`)}
                                className="mt-4"
                            >
                                <CirclePlus className="h-4 w-4" />
                                创建比赛
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}