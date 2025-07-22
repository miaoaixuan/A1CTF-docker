import React, { useState, useEffect } from 'react';
import { Button } from "components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "components/ui/avatar";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Badge } from "components/ui/badge";
import { Separator } from "components/ui/separator";
import { Users, Trophy, Hash, Copy, Crown, UserCheck, UserMinus, UserPlus, Settings, Trash2, CircleArrowLeft, Upload, Group, Pencil, Ban, Gift, AlertTriangle, Calculator, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "components/ui/alert-dialog";
import { toast } from "sonner";
import copy from "copy-to-clipboard";
import { AxiosError } from "axios";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { MacScrollbar } from "mac-scrollbar";
import { api } from 'utils/ApiHelper';
import type {
    TeamJoinRequestInfo,
    HandleJoinRequestPayload,
    TransferCaptainPayload,
    UpdateTeamInfoPayload,
    UserFullGameInfo,
    GameScoreboardData,
    TeamScore,
    SolvedChallenge,
    UserSimpleGameChallenge
} from 'utils/A1API';
import { LoadingPage } from 'components/LoadingPage';
import { useLocation, useNavigate } from 'react-router';
import { UploadImageDialog } from 'components/dialogs/UploadImageDialog';

interface MyTeamInfomationViewProps {
    gameid: number;
}

const MyTeamInfomationView: React.FC<MyTeamInfomationViewProps> = ({
    gameid
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();

    const [gameInfo, setGameInfo] = useState<UserFullGameInfo>();
    const [scoreBoardData, setScoreBoardData] = useState<GameScoreboardData>();
    const [currentUserTeam, setCurrentUserTeam] = useState<TeamScore>();
    const [joinRequests, setJoinRequests] = useState<TeamJoinRequestInfo[]>([]);
    const [challenges, setChallenges] = useState<Record<string, UserSimpleGameChallenge[]>>({});
    const [loading, setLoading] = useState(false);
    const [sloganDialogOpen, setSloganDialogOpen] = useState(false);
    const [newSlogan, setNewSlogan] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string>('');

    const [dataLoaded, setDataLoaded] = useState(false)

    // 检查当前用户是否是队长
    const isTeamCaptain = gameInfo?.team_info?.team_members?.find(
        member => member.user_id === currentUserId
    )?.captain || false;

    // 获取用户资料来确定当前用户ID
    const fetchUserProfile = () => {
        api.user.getUserProfile()
            .then((response) => {
                setCurrentUserId(response.data.data.user_id);
            })
            .catch((error) => {
                console.error("Failed to fetch user profile:", error);
            });
    };

    // 获取游戏信息和战队信息
    const fetchGameInfo = () => {
        api.user.userGetGameInfoWithTeamInfo(gameid)
            .then((response) => {
                setGameInfo(response.data.data);
                if (response.data.data.team_info?.team_slogan) {
                    setNewSlogan(response.data.data.team_info.team_slogan);
                }
            })
            .catch((error) => {
                console.error("Failed to fetch game info:", error);
                toast.error("获取游戏信息失败");
            });
    };

    // 获取记分榜数据（包含解题情况）
    const fetchScoreBoardData = () => {
        api.user.userGetGameScoreboard(gameid)
            .then((response) => {
                setScoreBoardData(response.data.data);

                // 分组题目
                const groupedChallenges: Record<string, UserSimpleGameChallenge[]> = {};
                response.data.data?.challenges?.forEach((challenge: UserSimpleGameChallenge) => {
                    const category = challenge.category?.toLowerCase() || "misc";
                    if (!groupedChallenges[category]) {
                        groupedChallenges[category] = [];
                    }
                    groupedChallenges[category].push(challenge);
                });
                setChallenges(groupedChallenges);

                // 找到当前用户的战队数据
                setCurrentUserTeam(response.data.data?.your_team);

                setDataLoaded(true)
            })
            .catch((error) => {
                console.error("Failed to fetch scoreboard data:", error);
                setDataLoaded(true)
            });
    };

    // 获取加入申请列表
    const fetchJoinRequests = () => {
        if (!isTeamCaptain || !gameInfo?.team_info?.team_id) return;

        api.team.getTeamJoinRequests(gameInfo.team_info.team_id)
            .then((response) => {
                setJoinRequests(response.data.data);
            })
            .catch((error) => {
                console.error("Failed to fetch join requests:", error);
            });
    };

    // 获取题目信息
    const getChallenge = (id: number): UserSimpleGameChallenge | undefined => {
        let target: UserSimpleGameChallenge | undefined;
        if (challenges) {
            Object.values(challenges).forEach((challengeList) => {
                const tmp = challengeList.find((challenge) => challenge.challenge_id === id);
                if (tmp) target = tmp;
            });
        }
        return target;
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    useEffect(() => {
        if (gameid) {
            fetchGameInfo();
        }
    }, [gameid]);

    useEffect(() => {
        if (gameInfo && currentUserId) {
            fetchScoreBoardData();
            fetchJoinRequests();
        }
    }, [gameInfo, currentUserId]);

    useEffect(() => {
        if (gameInfo?.team_info?.team_id && scoreBoardData) {
            setCurrentUserTeam(scoreBoardData?.your_team);
        }
    }, [gameInfo, scoreBoardData]);

    // 处理加入申请
    const handleJoinRequest = (requestId: number, action: 'approve' | 'reject') => {
        setLoading(true);
        api.team.handleTeamJoinRequest(requestId, { action } as HandleJoinRequestPayload)
            .then(() => {
                toast.success(action === 'approve' ? '申请已批准' : '申请已拒绝');
                fetchJoinRequests();
                fetchGameInfo(); // 刷新战队信息
            })
            .catch((error: any) => {
                const errorMessage = error.response?.data?.message || '操作失败';
                toast.error(errorMessage);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // 转移队长
    const handleTransferCaptain = (newCaptainId: string) => {
        if (!gameInfo?.team_info?.team_id) return;

        setLoading(true);
        api.team.transferTeamCaptain(gameInfo.team_info.team_id, { new_captain_id: newCaptainId } as TransferCaptainPayload)
            .then(() => {
                toast.success('队长已转移');
                fetchGameInfo();
            })
            .catch((error: any) => {
                const errorMessage = error.response?.data?.message || '转移队长失败';
                toast.error(errorMessage);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // 踢出队员
    const handleRemoveMember = (userId: string) => {
        if (!gameInfo?.team_info?.team_id) return;

        setLoading(true);
        api.team.removeTeamMember(gameInfo.team_info.team_id, userId)
            .then(() => {
                toast.success('队员已移除');
                fetchGameInfo();
            })
            .catch((error: any) => {
                const errorMessage = error.response?.data?.message || '移除队员失败';
                toast.error(errorMessage);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // 解散战队
    const handleDeleteTeam = () => {
        if (!gameInfo?.team_info?.team_id) return;

        setLoading(true);
        api.team.deleteTeam(gameInfo.team_info.team_id)
            .then(() => {
                toast.success('战队已解散');
                fetchGameInfo();
            })
            .catch((error: any) => {
                const errorMessage = error.response?.data?.message || '解散战队失败';
                toast.error(errorMessage);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // 更新战队口号
    const handleUpdateSlogan = () => {
        if (!gameInfo?.team_info?.team_id) return;

        setLoading(true);
        api.team.updateTeamInfo(gameInfo.team_info.team_id, { team_slogan: newSlogan } as UpdateTeamInfoPayload)
            .then(() => {
                toast.success('战队口号已更新');
                setSloganDialogOpen(false);
                fetchGameInfo();
            })
            .catch((error: any) => {
                const errorMessage = error.response?.data?.message || '更新失败';
                toast.error(errorMessage);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // 复制文本
    const copyToClipboard = (text: string, successMessage: string) => {
        if (copy(text)) {
            toast.success(successMessage);
        } else {
            toast.error('复制失败');
        }
    };

    // 如果用户没有战队，显示提示

    const teamInfo = gameInfo?.team_info;

    const gamePath = useLocation().pathname.split("/").slice(0, -1).join("/")
    const navigator = useNavigate();

    const getAdjustmentTypeInfo = (type: string) => {
        switch (type) {
            case 'cheat':
                return { 
                    icon: <Ban className="w-4 h-4" />, 
                    color: 'text-red-500',
                    label: '作弊扣分'
                };
            case 'reward':
                return { 
                    icon: <Gift className="w-4 h-4" />, 
                    color: 'text-green-500',
                    label: '奖励加分'
                };
            case 'other':
                return { 
                    icon: <AlertTriangle className="w-4 h-4" />, 
                    color: 'text-yellow-500',
                    label: '其他调整'
                };
            default:
                return { 
                    icon: <Calculator className="w-4 h-4" />, 
                    color: 'text-gray-500',
                    label: '未知'
                };
        }
    }

    if (!dataLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="flex">
                    <Loader2 className="animate-spin" />
                    <span className="font-bold ml-3">Loading...</span>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* <LoadingPage visible={loadingVisiblity} /> */}
            {gameInfo?.team_info ? (<MacScrollbar
                className="w-full h-full overflow-y-auto"
                skin={theme == "light" ? "light" : "dark"}
                suppressScrollX
            >
                <div className="container mx-auto p-6 space-y-6 py-10">
                    <div className='flex items-center'>
                        <span className='text-3xl font-bold [text-shadow:_hsl(var(--foreground))_1px_1px_20px] select-none'>Team Info</span>
                    </div>
                    {/* 战队基本信息 */}
                    <Card className='bg-transparent backdrop-blur-md mt-6'>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="w-16 h-16">
                                        {teamInfo?.team_avatar ? (
                                            <AvatarImage src={teamInfo?.team_avatar} alt={teamInfo?.team_name} />
                                        ) : (
                                            <AvatarFallback>
                                                <Users className="w-8 h-8" />
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-2xl">{teamInfo?.team_name}</CardTitle>
                                        <CardDescription>{teamInfo?.team_slogan || '这个战队很神秘，什么都没有留下'}</CardDescription>
                                    </div>
                                </div>
                                {isTeamCaptain && (
                                    <div className="flex space-x-2">
                                        <UploadImageDialog type="team" updateTeam={() => {}} id={gameInfo?.team_info?.team_id}>
                                            <Button variant="outline" size="sm">
                                                <Upload className="w-4 h-4" />
                                                上传头像
                                            </Button>
                                        </UploadImageDialog>
                                        <Dialog open={sloganDialogOpen} onOpenChange={setSloganDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <Settings className="w-4 h-4" />
                                                    编辑口号
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>编辑战队口号</DialogTitle>
                                                    <DialogDescription>
                                                        修改你的战队口号，让其他人了解你们的风格
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                    <div>
                                                        <Label htmlFor="slogan">战队口号</Label>
                                                        <Input
                                                            id="slogan"
                                                            value={newSlogan}
                                                            onChange={(e) => setNewSlogan(e.target.value)}
                                                            placeholder="输入新的战队口号"
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setSloganDialogOpen(false)}>
                                                        取消
                                                    </Button>
                                                    <Button onClick={handleUpdateSlogan} disabled={loading}>
                                                        保存
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className='flex flex-col gap-2'>
                                <div className="flex items-center space-x-2 h-[32px]">
                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                    <span className="font-semibold">分数: {teamInfo?.team_score}</span>
                                    {currentUserTeam?.rank && (
                                        <Badge variant="secondary">排名: #{currentUserTeam.rank}</Badge>
                                    )}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Hash className="w-5 h-5 text-blue-500" />
                                    <span>Hash: {teamInfo?.team_hash}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(teamInfo?.team_hash ?? "", 'Hash已复制')}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Group className="w-5 h-5 text-purple-500" />
                                    <span>所属队伍: {teamInfo?.group_name ?? "Public"}</span>
                                </div>
                                {teamInfo?.invite_code && (
                                    <div className="flex items-center space-x-2">
                                        <UserPlus className="w-5 h-5 text-green-500" />
                                        <span>邀请码: {teamInfo?.invite_code}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(teamInfo?.invite_code!, '邀请码已复制')}
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 战队成员 */}
                    <Card className='bg-transparent backdrop-blur-md'>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Users className="w-5 h-5" />
                                <span>战队成员</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {teamInfo?.team_members?.map((member) => (
                                    <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <Avatar>
                                                {member.avatar ? (
                                                    <AvatarImage src={member.avatar} alt={member.user_name} />
                                                ) : (
                                                    <AvatarFallback>{member.user_name.substring(0, 2)}</AvatarFallback>
                                                )}
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium">{member.user_name}</span>
                                                    {member.captain && (
                                                        <Badge variant="default">
                                                            <Crown className="w-3 h-3 mr-1" />
                                                            队长
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {isTeamCaptain && !member.captain && member.user_id !== currentUserId && (
                                            <div className="flex space-x-2">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="outline" size="sm">
                                                            <Crown className="w-4 h-4 mr-2" />
                                                            转移队长
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>确认转移队长</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                你确定要将队长权限转移给 {member.user_name} 吗？此操作不可撤销。
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>取消</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleTransferCaptain(member.user_id)}>
                                                                确认转移
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                                            <UserMinus className="w-4 h-4 mr-2" />
                                                            踢出
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>确认踢出队员</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                你确定要将 {member.user_name} 踢出战队吗？
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>取消</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleRemoveMember(member.user_id)}
                                                                className="bg-red-600 hover:bg-red-700"
                                                            >
                                                                确认踢出
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 加入申请（仅队长可见） */}
                    {isTeamCaptain && (
                        <Card className='bg-transparent backdrop-blur-md'>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <UserCheck className="w-5 h-5" />
                                    <span>加入申请</span>
                                    {joinRequests.length > 0 && (
                                        <Badge variant="destructive">{joinRequests.length}</Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {joinRequests.length === 0 ? (
                                    <p className="text-muted-foreground">暂无待处理的加入申请</p>
                                ) : (
                                    <div className="space-y-4">
                                        {joinRequests.map((request) => (
                                            <div key={request.request_id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <Avatar>
                                                        {request.user_avatar ? (
                                                            <AvatarImage src={request.user_avatar} alt={request.username} />
                                                        ) : (
                                                            <AvatarFallback>{request.username.substring(0, 2)}</AvatarFallback>
                                                        )}
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{request.username}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            申请时间: {dayjs(request.create_time).format('YYYY-MM-DD HH:mm:ss')}
                                                        </div>
                                                        {request.message && (
                                                            <div className="text-sm text-muted-foreground mt-1">
                                                                留言: {request.message}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleJoinRequest(request.request_id, 'approve')}
                                                        disabled={loading}
                                                    >
                                                        <UserCheck className="w-4 h-4 mr-2" />
                                                        批准
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleJoinRequest(request.request_id, 'reject')}
                                                        disabled={loading}
                                                    >
                                                        <UserMinus className="w-4 h-4 mr-2" />
                                                        拒绝
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* 解题情况 */}
                    <Card className='bg-transparent backdrop-blur-md'>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Trophy className="w-5 h-5" />
                                <span>解题情况</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!currentUserTeam?.solved_challenges || currentUserTeam.solved_challenges.length === 0 ? (
                                <p className="text-muted-foreground">暂无解题记录</p>
                            ) : (
                                <div className="space-y-2">
                                    {currentUserTeam.solved_challenges.map((solvedChallenge, index) => (
                                        <div key={`solved-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <div className="font-medium">{getChallenge(solvedChallenge.challenge_id || 0)?.challenge_name || `题目 ${solvedChallenge.challenge_id}`}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    解题者: {solvedChallenge.solver} | 解题时间: {dayjs(solvedChallenge.solve_time).format('YYYY-MM-DD HH:mm:ss')}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Badge variant="secondary">#{solvedChallenge.rank}</Badge>
                                                <span className="text-green-600 font-medium">+{solvedChallenge.score} pts</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className='bg-transparent backdrop-blur-md'>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Pencil className="w-5 h-5" />
                                <span>分数修正</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!currentUserTeam?.score_adjustments || currentUserTeam.score_adjustments.length === 0 ? (
                                <p className="text-muted-foreground">暂无分数修正</p>
                            ) : (
                                <div className="space-y-2">
                                    {currentUserTeam.score_adjustments.map((adjustedScore, index) => (
                                        <div key={`solved-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <div className={`flex gap-2 items-center ${getAdjustmentTypeInfo(adjustedScore.adjustment_type).color}`}>
                                                    { getAdjustmentTypeInfo(adjustedScore.adjustment_type).icon }
                                                    <div className={`font-medium`}>{getAdjustmentTypeInfo(adjustedScore.adjustment_type).label}</div>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    理由：{adjustedScore.reason} 修正时间: {dayjs(adjustedScore.created_at).format('YYYY-MM-DD HH:mm:ss')}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                { adjustedScore.score_change > 0 ? (
                                                    <span className="text-green-600 font-medium">+ {adjustedScore.score_change} pts</span>
                                                ) : (
                                                    <span className="text-red-600 font-medium">- {Math.abs(adjustedScore.score_change)} pts</span>
                                                ) }
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 危险操作（仅队长可见） */}
                    {isTeamCaptain && (
                        <Card className="border-red-200 bg-transparent backdrop-blur-md">
                            <CardHeader>
                                <CardTitle className="text-red-600 flex items-center space-x-2">
                                    <Trash2 className="w-5 h-5" />
                                    <span>危险操作</span>
                                </CardTitle>
                                <CardDescription>
                                    以下操作不可撤销，请谨慎操作
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            解散战队
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>确认解散战队</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                你确定要解散战队 "{teamInfo?.team_name}" 吗？此操作将删除所有战队数据，且不可撤销。
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>取消</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleDeleteTeam}
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                确认解散
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </MacScrollbar>) : (
                <div className="container mx-auto p-6 h-full flex flex-col items-center justify-center">
                    <Card className='bg-transparent backdrop-blur-md select-none px-20'>
                        <CardContent className="py-6">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold mb-2">您还没有加入战队</h3>
                                <p className="text-muted-foreground mb-4">请先创建或加入一个战队来查看战队信息</p>
                                <Button variant="outline" onClick={() => {
                                    navigator(gamePath)
                                }}>
                                    <CircleArrowLeft size={32} />
                                    返回
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </>
    );
};

export default MyTeamInfomationView;
