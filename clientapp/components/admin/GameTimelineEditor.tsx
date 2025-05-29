import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Button } from "components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "components/ui/dialog";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import { Calendar } from "components/ui/calendar";
import { ScrollArea, ScrollBar } from "components/ui/scroll-area";
import { Badge } from "components/ui/badge";
import { cn } from "lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Clock, Plus, Edit, Trash2, GripVertical } from "lucide-react";
import { challengeCategoryIcons } from "utils/ClientAssets";
import dayjs from "dayjs";

interface TimePoint {
    id: string;
    name: string;
    startTime: Date;
    endTime: Date;
}

interface ChallengeBlock {
    id: number;
    name: string;
    category: string;
    score: number;
    belongStage: string | null;
}

interface GameTimelineEditorProps {
    gameStartTime: Date;
    gameEndTime: Date;
    timePoints: TimePoint[];
    challenges: ChallengeBlock[];
    onTimePointsChange: (timePoints: TimePoint[]) => void;
    onChallengeAssignmentChange: (challengeId: number, stageId: string | null) => void;
}

interface DraggedChallenge {
    challenge: ChallengeBlock;
    dragStartX: number;
    dragStartY: number;
}

export function GameTimelineEditor({
    gameStartTime,
    gameEndTime,
    timePoints,
    challenges,
    onTimePointsChange,
    onChallengeAssignmentChange,
}: GameTimelineEditorProps) {
    const [draggedChallenge, setDraggedChallenge] = useState<DraggedChallenge | null>(null);
    const [isEditingTimePoint, setIsEditingTimePoint] = useState<string | null>(null);
    const [isCreatingTimePoint, setIsCreatingTimePoint] = useState(false);
    const [newTimePoint, setNewTimePoint] = useState({
        name: '',
        startTime: (() => {
            const now = new Date();
            now.setHours(9, 0, 0, 0); // 默认上午9点
            return now;
        })(),
        endTime: (() => {
            const now = new Date();
            now.setHours(17, 0, 0, 0); // 默认下午5点
            return now;
        })(),
    });
    const [editingTimePoint, setEditingTimePoint] = useState({
        name: '',
        startTime: (() => {
            const now = new Date();
            now.setHours(9, 0, 0, 0);
            return now;
        })(),
        endTime: (() => {
            const now = new Date();
            now.setHours(17, 0, 0, 0);
            return now;
        })(),
    });

    const timelineRef = useRef<HTMLDivElement>(null);
    const challengeIcons = challengeCategoryIcons;

    // 计算时间轴的总持续时间（毫秒）
    const totalDuration = useMemo(() => {
        return gameEndTime.getTime() - gameStartTime.getTime();
    }, [gameStartTime, gameEndTime]);

    // 将时间转换为时间轴上的位置百分比
    const timeToPosition = useCallback((time: Date) => {
        const timeOffset = time.getTime() - gameStartTime.getTime();
        return Math.max(0, Math.min(100, (timeOffset / totalDuration) * 100));
    }, [gameStartTime, totalDuration]);

    // 将位置百分比转换为时间
    const positionToTime = useCallback((position: number) => {
        const timeOffset = (position / 100) * totalDuration;
        return new Date(gameStartTime.getTime() + timeOffset);
    }, [gameStartTime, totalDuration]);

    // 处理拖拽开始
    const handleDragStart = (e: React.DragEvent, challenge: ChallengeBlock) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setDraggedChallenge({
            challenge,
            dragStartX: e.clientX - rect.left,
            dragStartY: e.clientY - rect.top,
        });
        e.dataTransfer.effectAllowed = 'move';
    };

    // 处理拖拽结束
    const handleDragEnd = () => {
        setDraggedChallenge(null);
    };

    // 处理时间轴上的drop
    const handleTimelineDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!draggedChallenge || !timelineRef.current) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const dropX = e.clientX - rect.left;
        const position = (dropX / rect.width) * 100;
        const dropTime = positionToTime(position);

        // 查找落在哪个时间段
        let targetStage: string | null = null;
        for (const timePoint of timePoints) {
            if (dropTime >= timePoint.startTime && dropTime <= timePoint.endTime) {
                targetStage = timePoint.id;
                break;
            }
        }

        onChallengeAssignmentChange(draggedChallenge.challenge.id, targetStage);
        setDraggedChallenge(null);
    };

    // 处理时间轴拖拽悬停
    const handleTimelineDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    // 添加新时间点
    const handleAddTimePoint = () => {
        const newId = `stage_${Date.now()}`;
        const newPoint: TimePoint = {
            id: newId,
            name: newTimePoint.name,
            startTime: newTimePoint.startTime,
            endTime: newTimePoint.endTime,
        };
        onTimePointsChange([...timePoints, newPoint]);
        
        // 重置表单
        setNewTimePoint({ 
            name: '', 
            startTime: (() => {
                const now = new Date();
                now.setHours(9, 0, 0, 0);
                return now;
            })(),
            endTime: (() => {
                const now = new Date();
                now.setHours(17, 0, 0, 0);
                return now;
            })(),
        });
        setIsCreatingTimePoint(false);
    };

    // 开始编辑时间点
    const handleStartEditTimePoint = (id: string) => {
        const timePoint = timePoints.find(tp => tp.id === id);
        if (timePoint) {
            setEditingTimePoint({
                name: timePoint.name,
                startTime: timePoint.startTime,
                endTime: timePoint.endTime,
            });
            setIsEditingTimePoint(id);
        }
    };

    // 保存编辑的时间点
    const handleSaveEditTimePoint = () => {
        if (!isEditingTimePoint) return;

        const updatedTimePoints = timePoints.map(tp =>
            tp.id === isEditingTimePoint
                ? {
                    ...tp,
                    name: editingTimePoint.name,
                    startTime: editingTimePoint.startTime,
                    endTime: editingTimePoint.endTime,
                }
                : tp
        );
        onTimePointsChange(updatedTimePoints);
        setIsEditingTimePoint(null);
    };

    // 删除时间点
    const handleDeleteTimePoint = (id: string) => {
        // 先将属于这个时间段的题目重置为全局
        challenges.forEach(challenge => {
            if (challenge.belongStage === id) {
                onChallengeAssignmentChange(challenge.id, null);
            }
        });

        // 然后删除时间点
        const updatedTimePoints = timePoints.filter(tp => tp.id !== id);
        onTimePointsChange(updatedTimePoints);
    };

    // 根据归属分组题目
    const groupedChallenges = useMemo(() => {
        const global: ChallengeBlock[] = [];
        const staged: { [key: string]: ChallengeBlock[] } = {};

        challenges.forEach(challenge => {
            if (challenge.belongStage === null) {
                global.push(challenge);
            } else {
                if (!staged[challenge.belongStage]) {
                    staged[challenge.belongStage] = [];
                }
                staged[challenge.belongStage].push(challenge);
            }
        });

        return { global, staged };
    }, [challenges]);

    return (
        <div className="w-full space-y-6">
            {/* 时间轴区域 */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>比赛时间轴</CardTitle>
                        <Dialog open={isCreatingTimePoint} onOpenChange={setIsCreatingTimePoint}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    添加时间段
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>添加新时间段</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="stageName">时间段名称</Label>
                                        <Input
                                            id="stageName"
                                            value={newTimePoint.name}
                                            onChange={(e) => setNewTimePoint(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="输入时间段名称"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>开始时间</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className="w-full">
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {format(newTimePoint.startTime, "MM/dd/yyyy HH:mm")}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <div className="sm:flex">
                                                        <Calendar
                                                            mode="single"
                                                            selected={newTimePoint.startTime}
                                                            onSelect={(date) => {
                                                                if (date) {
                                                                    const newDate = new Date(date);
                                                                    newDate.setHours(newTimePoint.startTime.getHours());
                                                                    newDate.setMinutes(newTimePoint.startTime.getMinutes());
                                                                    setNewTimePoint(prev => ({ ...prev, startTime: newDate }));
                                                                }
                                                            }}
                                                            initialFocus
                                                        />
                                                        <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                                                            <ScrollArea className="w-64 sm:w-auto">
                                                                <div className="flex sm:flex-col p-2">
                                                                    {Array.from({ length: 24 }, (_, i) => i)
                                                                        .reverse()
                                                                        .map((hour) => (
                                                                            <Button
                                                                                key={hour}
                                                                                size="icon"
                                                                                variant={
                                                                                    newTimePoint.startTime.getHours() === hour
                                                                                        ? "default"
                                                                                        : "ghost"
                                                                                }
                                                                                className="sm:w-full shrink-0 aspect-square"
                                                                                onClick={() => {
                                                                                    const newDate = new Date(newTimePoint.startTime);
                                                                                    newDate.setHours(hour);
                                                                                    setNewTimePoint(prev => ({ ...prev, startTime: newDate }));
                                                                                }}
                                                                            >
                                                                                {hour}
                                                                            </Button>
                                                                        ))}
                                                                </div>
                                                                <ScrollBar
                                                                    orientation="horizontal"
                                                                    className="sm:hidden"
                                                                />
                                                            </ScrollArea>
                                                            <ScrollArea className="w-64 sm:w-auto">
                                                                <div className="flex sm:flex-col p-2">
                                                                    {Array.from({ length: 60 }, (_, i) => i).map(
                                                                        (minute) => (
                                                                            <Button
                                                                                key={minute}
                                                                                size="icon"
                                                                                variant={
                                                                                    newTimePoint.startTime.getMinutes() === minute
                                                                                        ? "default"
                                                                                        : "ghost"
                                                                                }
                                                                                className="sm:w-full shrink-0 aspect-square"
                                                                                onClick={() => {
                                                                                    const newDate = new Date(newTimePoint.startTime);
                                                                                    newDate.setMinutes(minute);
                                                                                    setNewTimePoint(prev => ({ ...prev, startTime: newDate }));
                                                                                }}
                                                                            >
                                                                                {minute.toString().padStart(2, "0")}
                                                                            </Button>
                                                                        )
                                                                    )}
                                                                </div>
                                                                <ScrollBar
                                                                    orientation="horizontal"
                                                                    className="sm:hidden"
                                                                />
                                                            </ScrollArea>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div>
                                            <Label>结束时间</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className="w-full">
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {format(newTimePoint.endTime, "MM/dd/yyyy HH:mm")}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <div className="sm:flex">
                                                        <Calendar
                                                            mode="single"
                                                            selected={newTimePoint.endTime}
                                                            onSelect={(date) => {
                                                                if (date) {
                                                                    const newDate = new Date(date);
                                                                    newDate.setHours(newTimePoint.endTime.getHours());
                                                                    newDate.setMinutes(newTimePoint.endTime.getMinutes());
                                                                    setNewTimePoint(prev => ({ ...prev, endTime: newDate }));
                                                                }
                                                            }}
                                                            initialFocus
                                                        />
                                                        <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                                                            <ScrollArea className="w-64 sm:w-auto">
                                                                <div className="flex sm:flex-col p-2">
                                                                    {Array.from({ length: 24 }, (_, i) => i)
                                                                        .reverse()
                                                                        .map((hour) => (
                                                                            <Button
                                                                                key={hour}
                                                                                size="icon"
                                                                                variant={
                                                                                    newTimePoint.endTime.getHours() === hour
                                                                                        ? "default"
                                                                                        : "ghost"
                                                                                }
                                                                                className="sm:w-full shrink-0 aspect-square"
                                                                                onClick={() => {
                                                                                    const newDate = new Date(newTimePoint.endTime);
                                                                                    newDate.setHours(hour);
                                                                                    setNewTimePoint(prev => ({ ...prev, endTime: newDate }));
                                                                                }}
                                                                            >
                                                                                {hour}
                                                                            </Button>
                                                                        ))}
                                                                </div>
                                                                <ScrollBar
                                                                    orientation="horizontal"
                                                                    className="sm:hidden"
                                                                />
                                                            </ScrollArea>
                                                            <ScrollArea className="w-64 sm:w-auto">
                                                                <div className="flex sm:flex-col p-2">
                                                                    {Array.from({ length: 60 }, (_, i) => i).map(
                                                                        (minute) => (
                                                                            <Button
                                                                                key={minute}
                                                                                size="icon"
                                                                                variant={
                                                                                    newTimePoint.endTime.getMinutes() === minute
                                                                                        ? "default"
                                                                                        : "ghost"
                                                                                }
                                                                                className="sm:w-full shrink-0 aspect-square"
                                                                                onClick={() => {
                                                                                    const newDate = new Date(newTimePoint.endTime);
                                                                                    newDate.setMinutes(minute);
                                                                                    setNewTimePoint(prev => ({ ...prev, endTime: newDate }));
                                                                                }}
                                                                            >
                                                                                {minute.toString().padStart(2, "0")}
                                                                            </Button>
                                                                        )
                                                                    )}
                                                                </div>
                                                                <ScrollBar
                                                                    orientation="horizontal"
                                                                    className="sm:hidden"
                                                                />
                                                            </ScrollArea>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setIsCreatingTimePoint(false)}>
                                            取消
                                        </Button>
                                        <Button onClick={handleAddTimePoint} disabled={!newTimePoint.name.trim()}>
                                            添加
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* 时间轴 */}
                    <div className="relative">
                        {/* 时间标签 */}
                        <div className="flex justify-between mb-2 text-sm text-muted-foreground">
                            <span>{format(gameStartTime, "MM/dd HH:mm")}</span>
                            <span>{format(gameEndTime, "MM/dd HH:mm")}</span>
                        </div>

                        {/* 主时间轴 */}
                        <div
                            ref={timelineRef}
                            className="relative h-12 bg-muted rounded-lg border-2 border-dashed border-muted-foreground/20"
                            onDrop={handleTimelineDrop}
                            onDragOver={handleTimelineDragOver}
                        >
                            {/* 时间段显示 */}
                            {timePoints.map((timePoint) => {
                                const startPos = timeToPosition(timePoint.startTime);
                                const endPos = timeToPosition(timePoint.endTime);
                                const width = endPos - startPos;

                                return (
                                    <div
                                        key={timePoint.id}
                                        className="absolute top-1 bottom-1 bg-primary/20 border border-primary/40 rounded-md flex items-center justify-center text-xs font-medium px-2"
                                        style={{
                                            left: `${startPos}%`,
                                            width: `${width}%`,
                                        }}
                                        data-tooltip-id="my-tooltip"
                                        data-tooltip-place="top"
                                        data-tooltip-content={`${timePoint.name}(${challenges.filter(c => c.belongStage === timePoint.id).length}) ${format(timePoint.startTime, "MM/dd HH:mm")} - ${format(timePoint.endTime, "MM/dd HH:mm")}`}
                                    >
                                        <span className="truncate px-1">{timePoint.name}({challenges.filter(c => c.belongStage === timePoint.id).length})</span>
                                        <div className="flex gap-1 ml-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                type='button'
                                                className="h-4 w-4 p-0 hover:bg-transparent text-primary/60 hover:text-primary"
                                                onClick={() => handleStartEditTimePoint(timePoint.id)}
                                            >
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                type='button'
                                                className="h-4 w-4 p-0 hover:bg-transparent text-primary/60 hover:text-primary"
                                                onClick={() => handleDeleteTimePoint(timePoint.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* 拖拽提示 */}
                            {timePoints.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm pointer-events-none">
                                    拖拽题目到此处分配时间段
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 编辑时间段对话框 */}
            <Dialog open={isEditingTimePoint !== null} onOpenChange={() => setIsEditingTimePoint(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>编辑时间段</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="editStageName">时间段名称</Label>
                            <Input
                                id="editStageName"
                                value={editingTimePoint.name}
                                onChange={(e) => setEditingTimePoint(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="输入时间段名称"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>开始时间</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {format(editingTimePoint.startTime, "MM/dd/yyyy HH:mm")}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <div className="sm:flex">
                                            <Calendar
                                                mode="single"
                                                selected={editingTimePoint.startTime}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        const newDate = new Date(date);
                                                        newDate.setHours(editingTimePoint.startTime.getHours());
                                                        newDate.setMinutes(editingTimePoint.startTime.getMinutes());
                                                        setEditingTimePoint(prev => ({ ...prev, startTime: newDate }));
                                                    }
                                                }}
                                                initialFocus
                                            />
                                            <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                                                <ScrollArea className="w-64 sm:w-auto">
                                                    <div className="flex sm:flex-col p-2">
                                                        {Array.from({ length: 24 }, (_, i) => i)
                                                            .reverse()
                                                            .map((hour) => (
                                                                <Button
                                                                    key={hour}
                                                                    size="icon"
                                                                    variant={
                                                                        editingTimePoint.startTime.getHours() === hour
                                                                            ? "default"
                                                                            : "ghost"
                                                                    }
                                                                    className="sm:w-full shrink-0 aspect-square"
                                                                    onClick={() => {
                                                                        const newDate = new Date(editingTimePoint.startTime);
                                                                        newDate.setHours(hour);
                                                                        setEditingTimePoint(prev => ({ ...prev, startTime: newDate }));
                                                                    }}
                                                                >
                                                                    {hour}
                                                                </Button>
                                                            ))}
                                                    </div>
                                                    <ScrollBar
                                                        orientation="horizontal"
                                                        className="sm:hidden"
                                                    />
                                                </ScrollArea>
                                                <ScrollArea className="w-64 sm:w-auto">
                                                    <div className="flex sm:flex-col p-2">
                                                        {Array.from({ length: 60 }, (_, i) => i).map(
                                                            (minute) => (
                                                                <Button
                                                                    key={minute}
                                                                    size="icon"
                                                                    variant={
                                                                        editingTimePoint.startTime.getMinutes() === minute
                                                                            ? "default"
                                                                            : "ghost"
                                                                    }
                                                                    className="sm:w-full shrink-0 aspect-square"
                                                                    onClick={() => {
                                                                        const newDate = new Date(editingTimePoint.startTime);
                                                                        newDate.setMinutes(minute);
                                                                        setEditingTimePoint(prev => ({ ...prev, startTime: newDate }));
                                                                    }}
                                                                >
                                                                    {minute.toString().padStart(2, "0")}
                                                                </Button>
                                                            )
                                                        )}
                                                    </div>
                                                    <ScrollBar
                                                        orientation="horizontal"
                                                        className="sm:hidden"
                                                    />
                                                </ScrollArea>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div>
                                <Label>结束时间</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {format(editingTimePoint.endTime, "MM/dd/yyyy HH:mm")}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <div className="sm:flex">
                                            <Calendar
                                                mode="single"
                                                selected={editingTimePoint.endTime}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        const newDate = new Date(date);
                                                        newDate.setHours(editingTimePoint.endTime.getHours());
                                                        newDate.setMinutes(editingTimePoint.endTime.getMinutes());
                                                        setEditingTimePoint(prev => ({ ...prev, endTime: newDate }));
                                                    }
                                                }}
                                                initialFocus
                                            />
                                            <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                                                <ScrollArea className="w-64 sm:w-auto">
                                                    <div className="flex sm:flex-col p-2">
                                                        {Array.from({ length: 24 }, (_, i) => i)
                                                            .reverse()
                                                            .map((hour) => (
                                                                <Button
                                                                    key={hour}
                                                                    size="icon"
                                                                    variant={
                                                                        editingTimePoint.endTime.getHours() === hour
                                                                            ? "default"
                                                                            : "ghost"
                                                                    }
                                                                    className="sm:w-full shrink-0 aspect-square"
                                                                    onClick={() => {
                                                                        const newDate = new Date(editingTimePoint.endTime);
                                                                        newDate.setHours(hour);
                                                                        setEditingTimePoint(prev => ({ ...prev, endTime: newDate }));
                                                                    }}
                                                                >
                                                                    {hour}
                                                                </Button>
                                                            ))}
                                                    </div>
                                                    <ScrollBar
                                                        orientation="horizontal"
                                                        className="sm:hidden"
                                                    />
                                                </ScrollArea>
                                                <ScrollArea className="w-64 sm:w-auto">
                                                    <div className="flex sm:flex-col p-2">
                                                        {Array.from({ length: 60 }, (_, i) => i).map(
                                                            (minute) => (
                                                                <Button
                                                                    key={minute}
                                                                    size="icon"
                                                                    variant={
                                                                        editingTimePoint.endTime.getMinutes() === minute
                                                                            ? "default"
                                                                            : "ghost"
                                                                    }
                                                                    className="sm:w-full shrink-0 aspect-square"
                                                                    onClick={() => {
                                                                        const newDate = new Date(editingTimePoint.endTime);
                                                                        newDate.setMinutes(minute);
                                                                        setEditingTimePoint(prev => ({ ...prev, endTime: newDate }));
                                                                    }}
                                                                >
                                                                    {minute.toString().padStart(2, "0")}
                                                                </Button>
                                                            )
                                                        )}
                                                    </div>
                                                    <ScrollBar
                                                        orientation="horizontal"
                                                        className="sm:hidden"
                                                    />
                                                </ScrollArea>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsEditingTimePoint(null)}>
                                取消
                            </Button>
                            <Button onClick={handleSaveEditTimePoint} disabled={!editingTimePoint.name.trim()}>
                                保存
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 题目分配区域 */}
            <div className="grid grid-cols-12 gap-6">
                {/* 全局题目 */}
                <div className="col-span-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">全局题目</CardTitle>
                            <p className="text-sm text-muted-foreground">整个比赛期间都可见的题目</p>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-80">
                                <div className="space-y-2 pr-[10px]">
                                    {groupedChallenges.global.map((challenge) => (
                                        <div
                                            key={challenge.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, challenge)}
                                            onDragEnd={handleDragEnd}
                                            className="flex items-center gap-2 p-2 bg-muted rounded cursor-move hover:bg-muted/80 transition-colors"
                                        >
                                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                                            {challengeIcons[challenge.category?.toLowerCase() || 'misc']}
                                            <span className="font-medium text-sm">{challenge.name}</span>
                                            <Badge variant="outline" className="ml-auto">
                                                {challenge.score}pts
                                            </Badge>
                                        </div>
                                    ))}
                                    {groupedChallenges.global.length === 0 && (
                                        <p className="text-center text-muted-foreground text-sm py-8">
                                            暂无全局题目
                                        </p>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* 时间段题目 */}
                <div className="col-span-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">时间段题目</CardTitle>
                            <p className="text-sm text-muted-foreground">分配到特定时间段的题目</p>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-80">
                                {timePoints.length === 0 ? (
                                    <p className="text-center text-muted-foreground text-sm py-8">
                                        请先添加时间段
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {timePoints.map((timePoint) => (
                                            <div key={timePoint.id} className="border rounded-lg p-3">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-medium">{timePoint.name}</h4>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Clock className="h-4 w-4" />
                                                        <span>
                                                            {format(timePoint.startTime, "MM/dd HH:mm")} - {format(timePoint.endTime, "MM/dd HH:mm")}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    {(groupedChallenges.staged[timePoint.id] || []).map((challenge) => (
                                                        <div
                                                            key={challenge.id}
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, challenge)}
                                                            onDragEnd={handleDragEnd}
                                                            className="flex items-center gap-2 p-2 bg-primary/5 rounded cursor-move hover:bg-primary/10 transition-colors"
                                                        >
                                                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                            {challengeIcons[challenge.category?.toLowerCase() || 'misc']}
                                                            <span className="font-medium text-sm">{challenge.name}</span>
                                                            <Badge variant="outline" className="ml-auto">
                                                                {challenge.score}pts
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                    {(!groupedChallenges.staged[timePoint.id] || groupedChallenges.staged[timePoint.id].length === 0) && (
                                                        <p className="text-center text-muted-foreground text-sm py-4">
                                                            拖拽题目到上方的时间线
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
} 