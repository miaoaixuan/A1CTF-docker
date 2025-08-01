import React, { useState, useEffect } from 'react';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Textarea } from 'components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from 'components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from 'components/ui/table';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from 'components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify/unstyled';
import { api } from 'utils/ApiHelper';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { AxiosError } from 'axios';

interface GameGroup {
    group_id: number;
    group_name: string;
    group_description?: string;
    display_order: number;
    created_at: string;
    updated_at: string;
}

interface GameGroupManagerProps {
    gameId: number;
}

const groupFormSchema = z.object({
    group_name: z.string().min(1, '分组名称不能为空').max(100, '分组名称不能超过100个字符'),
    description: z.string().max(500, '描述不能超过500个字符').optional(),
});

type GroupFormData = z.infer<typeof groupFormSchema>;

export function GameGroupManager({ gameId }: GameGroupManagerProps) {
    const [groups, setGroups] = useState<GameGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<GameGroup | null>(null);

    const createForm = useForm<GroupFormData>({
        resolver: zodResolver(groupFormSchema),
        defaultValues: {
            group_name: '',
            description: '',
        },
    });

    const editForm = useForm<GroupFormData>({
        resolver: zodResolver(groupFormSchema),
        defaultValues: {
            group_name: '',
            description: '',
        },
    });

    // 加载分组列表
    const loadGroups = async () => {
        setLoading(true);

        api.admin.adminGetGameGroups(gameId).then((response) => {
            const groups = (response.data.data || []).map((group: any) => ({
                group_id: group.group_id,
                group_name: group.group_name,
                group_description: group.group_description || group.description,
                display_order: group.display_order || 0,
                created_at: group.created_at,
                updated_at: group.updated_at,
            }));
            setGroups(groups);
        }).finally(() => {
            setLoading(false);
        })
    };

    // 创建分组
    const handleCreateGroup = async (data: GroupFormData) => {

        api.admin.adminCreateGameGroup(gameId, {
            group_name: data.group_name,
            description: data.description || '',
        }).then((res) => {
            toast.success('分组创建成功');
            setIsCreateDialogOpen(false);
            createForm.reset();
            loadGroups();
        })
    };

    // 更新分组
    const handleUpdateGroup = async (data: GroupFormData) => {
        if (!editingGroup) return;

        api.admin.adminUpdateGameGroup(gameId, editingGroup.group_id, {
            group_name: data.group_name,
            description: data.description || '',
        }).then((res) => {
            toast.success('分组更新成功');
            setIsEditDialogOpen(false);
            setEditingGroup(null);
            editForm.reset();
            loadGroups();
        })
    };

    // 删除分组
    const handleDeleteGroup = async (groupId: number) => {
        if (!confirm('确定要删除这个分组吗？删除后无法恢复。')) {
            return;
        }

        api.admin.adminDeleteGameGroup(gameId, groupId).then((res) => {
            toast.success('分组删除成功');
            loadGroups();
        })
    };

    // 编辑分组
    const handleEditGroup = (group: GameGroup) => {
        setEditingGroup(group);
        editForm.setValue('group_name', group.group_name);
        editForm.setValue('description', group.group_description || '');
        setIsEditDialogOpen(true);
    };

    useEffect(() => {
        loadGroups();
    }, [gameId]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">参赛分组管理</h3>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <PlusCircle className="w-4 h-4 mr-2" />
                            创建分组
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>创建新分组</DialogTitle>
                            <DialogDescription>
                                为比赛创建一个新的参赛分组
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...createForm}>
                            <form onSubmit={createForm.handleSubmit(handleCreateGroup)} className="space-y-4">
                                <FormField
                                    control={createForm.control}
                                    name="group_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>分组名称</FormLabel>
                                            <FormControl>
                                                <Input placeholder="例如：本科组、研究生组" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>分组描述（可选）</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="描述这个分组的特点或要求"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button type="submit">创建分组</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* 分组列表 */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>分组名称</TableHead>
                            <TableHead>描述</TableHead>
                            <TableHead>创建时间</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8">
                                    加载中...
                                </TableCell>
                            </TableRow>
                        ) : groups.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    暂无分组，点击"创建分组"开始添加
                                </TableCell>
                            </TableRow>
                        ) : (
                            groups.map((group) => (
                                <TableRow key={group.group_id}>
                                    <TableCell className="font-medium">{group.group_name}</TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        {group.group_description || '-'}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(group.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                type="button"
                                                onClick={() => handleEditGroup(group)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                type="button"
                                                onClick={() => handleDeleteGroup(group.group_id)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* 编辑分组对话框 */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>编辑分组</DialogTitle>
                        <DialogDescription>
                            修改分组的名称和描述
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(handleUpdateGroup)} className="space-y-4">
                            <FormField
                                control={editForm.control}
                                name="group_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>分组名称</FormLabel>
                                        <FormControl>
                                            <Input placeholder="例如：本科组、研究生组" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>分组描述（可选）</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="描述这个分组的特点或要求"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit">保存更改</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
} 