import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import {
  Terminal,
  RefreshCw,
  Trash2,
  Search,
  MessageSquare,
  Globe,
  User,
  Mail,
  Loader2,
  Hash,
  Clock,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMyFetch } from '@/lib/api';
import { useGlobalStore } from '@/store';
import type { CommentLogVO } from '@/types';

interface SystemLogDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const SystemLogDialog: React.FC<SystemLogDialogProps> = ({
  open: propOpen,
  onOpenChange: propOnOpenChange,
}) => {
  const storeOpen = useGlobalStore((state) => state.sysLogDialogOpen);
  const setStoreOpen = useGlobalStore((state) => state.setSysLogDialogOpen);

  const open = propOpen !== undefined ? propOpen : storeOpen;
  const onOpenChange = propOnOpenChange || setStoreOpen;

  const [logs, setLogs] = useState<CommentLogVO[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [clearing, setClearing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');


  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await useMyFetch<CommentLogVO[]>('/comment/log/list');
      if (Array.isArray(res)) {
        setLogs(res);
      } else {
        setLogs([]);
      }
    } catch (err: any) {
      toast.error(err?.message || '获取系统日志失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open, fetchLogs]);

  const handleClear = async () => {
    if (!window.confirm('确定要清空所有系统评论日志吗？此操作不可撤销。')) {
      return;
    }
    setClearing(true);
    try {
      await useMyFetch('/comment/log/clear', {});
      toast.success('系统日志已成功清空');
      setLogs([]);
    } catch (err: any) {
      toast.error(err?.message || '清空日志失败');
    } finally {
      setClearing(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      String(log.memoId).includes(q) ||
      (log.username && log.username.toLowerCase().includes(q)) ||
      (log.email && log.email.toLowerCase().includes(q)) ||
      (log.ip && log.ip.toLowerCase().includes(q)) ||
      (log.content && log.content.toLowerCase().includes(q))
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] w-[92vw] max-h-[85vh] rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-2xl p-0 overflow-hidden flex flex-col">
        {/* 顶部 Header 区域 */}
        <div className="px-3.5 sm:px-5 py-3 sm:py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
            <div className="p-1.5 sm:p-2 rounded-xl bg-sky-500/10 text-sky-500 dark:bg-sky-400/10 dark:text-sky-400 shrink-0">
              <Terminal className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 sm:gap-2 truncate">
                系统评论日志控制台
                <span className="text-[10px] font-normal px-1.5 sm:px-2 py-0.5 rounded-full bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 shrink-0">
                  {logs.length} 条
                </span>
              </h3>
              <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 truncate hidden xs:block">
                实时记录朋友圈最新发帖评论与客户端 IP 调试日志
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 mr-7 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchLogs}
              disabled={loading}
              className="h-7 sm:h-8 px-2 sm:px-2.5 text-xs rounded-lg cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="刷新日志"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClear}
              disabled={clearing || logs.length === 0}
              className="h-7 sm:h-8 px-2 sm:px-2.5 text-xs rounded-lg cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200/60 dark:border-red-900/30"
              title="清空日志"
            >
              {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {/* 搜索与工具栏 */}
        <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800/60 bg-white dark:bg-neutral-900">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索评论内容 / 动态ID / 昵称 / 邮箱 / IP..."
              className="pl-9 h-9 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200/70 dark:border-neutral-700/60"
            />
          </div>
        </div>

        {/* 日志内容展示区 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[260px]">
          {loading && logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-neutral-400 text-xs gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
              <span>正在加载系统日志...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-neutral-400 text-xs gap-2">
              <MessageSquare className="w-8 h-8 stroke-1 text-neutral-300 dark:text-neutral-600" />
              <span>暂无匹配的系统评论日志记录</span>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id || `${log.memoId}-${log.createdAt}`}
                className="p-3.5 rounded-xl bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/40 space-y-2 hover:border-sky-500/40 transition-colors"
              >
                {/* 顶栏：动态 ID & IP & 时间 */}
                <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 pb-1.5 border-b border-neutral-200/40 dark:border-neutral-700/30">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded-md border border-sky-200/60 dark:border-sky-900/40">
                      <Hash className="w-3 h-3" />
                      动态 ID: {log.memoId}
                    </span>
                    <span className="inline-flex items-center gap-1 text-neutral-600 dark:text-neutral-300">
                      <Globe className="w-3 h-3 text-neutral-400" />
                      IP: {log.ip || '未获取'}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-neutral-400 text-[10px]">
                    <Clock className="w-3 h-3" />
                    {log.createdAt ? dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss') : '未知时间'}
                  </span>
                </div>

                {/* 用户信息与邮箱 */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-neutral-400" />
                    {log.username || '匿名'}
                  </span>
                  {log.email && (
                    <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1 text-[11px]">
                      <Mail className="w-3 h-3 text-neutral-400" />
                      {log.email}
                    </span>
                  )}
                </div>

                {/* 评论正文内容 */}
                <div className="text-xs text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-200/40 dark:border-neutral-800 break-all leading-relaxed">
                  {log.content}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
