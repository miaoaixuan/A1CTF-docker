import { useState, useEffect } from 'react';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from 'components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from 'components/ui/alert-dialog';
import { Badge } from 'components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'components/ui/card';
import { MacScrollbar } from 'mac-scrollbar';
import { useTheme } from 'next-themes';
import { toast } from 'react-toastify/unstyled';
import { api } from 'utils/ApiHelper';
import { AdminNoticeItem } from 'utils/A1API';
import { PlusCircle, Trash2, MessageSquare, Calendar, AlertCircle, Eye } from 'lucide-react';
import dayjs from 'dayjs';
import ThemedEditor from 'components/modules/ThemedEditor';

interface GameNoticeManagerProps {
    gameId: number;
}

export function GameNoticeManager({ gameId }: GameNoticeManagerProps) {
    const { theme } = useTheme();
    const [notices, setNotices] = useState<AdminNoticeItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedNotice, setSelectedNotice] = useState<AdminNoticeItem | null>(null);
    const [createForm, setCreateForm] = useState({
        title: '',
        content: ''
    });

    // 截取文本内容，限制显示长度
    const truncateContent = (content: string, maxLength: number = 100) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    // 加载公告列表
    const loadNotices = async () => {
        setLoading(true);

        api.admin.adminListGameNotices(gameId, {
            game_id: gameId,
            size: 50,
            offset: 0
        }).then((response) => {
            setNotices(response.data.data);
        }).finally(() => {
            setLoading(false);
        })
    };

    // 创建公告
    const handleCreateNotice = async () => {
        if (!createForm.title.trim() || !createForm.content.trim()) {
            toast.error('请填写完整的公告信息');
            return;
        }

        api.admin.adminCreateGameNotice(gameId, {
            title: createForm.title,
            content: createForm.content
        }).then(() => {
            toast.success('公告创建成功');
            setCreateForm({ title: '', content: '' });
            setIsCreateDialogOpen(false);
            loadNotices();
        })
    };

    // 删除公告
    const handleDeleteNotice = async (noticeId: number) => {
        api.admin.adminDeleteGameNotice({
            notice_id: noticeId
        }).then(() => {
            toast.success('公告删除成功');
            loadNotices();
        })
    };

    // 查看公告详情
    const handleViewNotice = (notice: AdminNoticeItem) => {
        setSelectedNotice(notice);
        setIsViewDialogOpen(true);
    };

    useEffect(() => {
        loadNotices();
    }, [gameId]);

    return (
        <div className="space-y-6">
            {/* 操作栏 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                        共 {notices.length} 条公告
                    </span>
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <PlusCircle className="h-4 w-4" />
                            创建公告
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[60%]">
                        <DialogHeader>
                            <DialogTitle>创建新公告</DialogTitle>
                            <DialogDescription>
                                创建的公告将会立即推送给所有参赛选手
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 overflow-hidden px-1">
                            <div>
                                <label className="text-sm font-medium mb-2 block">公告标题</label>
                                <Input
                                    value={createForm.title}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="请输入公告标题"
                                    className="bg-background/50"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">公告内容</label>
                                <ThemedEditor
                                    value={createForm.content}
                                    onChange={(value) => setCreateForm(prev => ({ ...prev, content: value ?? "" }))}
                                    language="markdown"
                                    className='h-[500px]'
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" type='button' onClick={() => setIsCreateDialogOpen(false)}>
                                    取消
                                </Button>
                                <Button onClick={handleCreateNotice} type='button'>
                                    创建公告
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* 公告列表 */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : notices.length === 0 ? (
                    <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">暂无公告</h3>
                        <p className="text-muted-foreground">创建第一条公告来通知参赛选手</p>
                    </div>
                ) : (
                    <MacScrollbar className="h-[500px]" skin={theme === "dark" ? "dark" : "light"}>
                        <div className="space-y-4 pr-4">
                            {notices.map((notice) => (
                                <Card key={notice.notice_id} className="group hover:shadow-md transition-all duration-200 bg-card/60 backdrop-blur-sm border-border/50">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors duration-200">
                                                    {notice.title}
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-2 mt-2">
                                                    <Calendar className="h-4 w-4" />
                                                    {dayjs(notice.create_time).format('YYYY-MM-DD HH:mm:ss')}
                                                    <Badge variant="secondary" className="ml-2">
                                                        {notice.content.length} 字
                                                    </Badge>
                                                </CardDescription>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    type='button'
                                                    className="hover:bg-blue-500/10 hover:text-blue-600"
                                                    onClick={() => handleViewNotice(notice)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            type='button'
                                                            className="hover:bg-destructive/10 hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>确认删除公告</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                您确定要删除公告 "<strong>{notice.title}</strong>" 吗？
                                                                <br />
                                                                此操作无法撤销，删除后所有参赛选手将无法再看到此公告。
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>取消</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDeleteNotice(notice.notice_id)}
                                                                className="bg-destructive hover:bg-destructive/90"
                                                            >
                                                                确认删除
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {truncateContent(notice.content)}
                                            {notice.content.length > 100 && (
                                                <Button
                                                    variant="link"
                                                    type='button'
                                                    className="p-0 h-auto text-primary text-sm ml-1"
                                                    onClick={() => handleViewNotice(notice)}
                                                >
                                                    查看更多
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </MacScrollbar>
                )}
            </div>

            {/* 公告详情查看对话框 */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            {selectedNotice?.title}
                        </DialogTitle>
                        <DialogDescription className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            发布时间: {selectedNotice ? dayjs(selectedNotice.create_time).format('YYYY-MM-DD HH:mm:ss') : ''}
                            <Badge variant="secondary" className="ml-2">
                                {selectedNotice?.content.length} 字
                            </Badge>
                        </DialogDescription>
                    </DialogHeader>
                    <MacScrollbar className="max-h-[400px]" skin={theme === "dark" ? "dark" : "light"}>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed p-4 bg-muted/30 rounded-lg">
                            {selectedNotice?.content}
                        </div>
                    </MacScrollbar>
                    <div className="flex justify-end">
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                            关闭
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
} 