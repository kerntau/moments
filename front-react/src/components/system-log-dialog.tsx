import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import {
  Terminal,
  RefreshCw,
  Trash2,
  Search,
  Globe,
  User,
  Mail,
  Loader2,
  Hash,
  Clock,
  ShieldAlert,
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
      <DialogContent className="w-[96vw] sm:max-w-[640px] max-h-[90vh] sm:max-h-[85vh] rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl p-0 overflow-hidden flex flex-col !gap-0">
        
        {/* 顶部 Header 区域 */}
        <div className="relative px-4 sm:px-6 pt-5 pb-4 sm:pt-6 sm:pb-5 border-b border-neutral-100 dark:border-neutral-800 bg-gradient-to-b from-sky-50/50 to-white/10 dark:from-sky-950/20 dark:to-neutral-900/10">
          <div className="flex items-start sm:items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 pr-8">
              <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-lg shadow-sky-500/20 shrink-0">
                <Terminal className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <h3 className="font-bold text-base sm:text-lg text-neutral-900 dark:text-neutral-100 flex items-center gap-2 truncate">
                  系统评论日志
                  <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300 shrink-0">
                    {logs.length}
                  </span>
                </h3>
                <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                  记录最新发帖评论与客户端 IP
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 搜索与工具栏 */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-100 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/50 flex items-center gap-3 justify-between">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索评论内容 / 动态ID / 昵称..."
              className="pl-9 h-10 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200/70 dark:border-neutral-700/60 focus-visible:ring-sky-500/30 transition-all w-full"
            />
          </div>
          <div className="hidden sm:flex items-center gap-2 justify-end shrink-0">
            <Button
              variant="outline"
              onClick={fetchLogs}
              disabled={loading}
              className="h-10 px-3.5 sm:px-4 text-xs sm:text-sm rounded-xl cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 border-neutral-200/80 dark:border-neutral-700 transition-all font-medium"
              title="刷新日志"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={clearing || logs.length === 0}
              className="h-10 px-3.5 sm:px-4 text-xs sm:text-sm rounded-xl cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200/80 dark:border-red-900/40 transition-all font-medium group"
              title="清空日志"
            >
              {clearing ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1.5 group-hover:scale-110 transition-transform" />
              )}
              清空
            </Button>
          </div>
        </div>

        {/* 日志内容展示区 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 min-h-[300px] bg-neutral-50/30 dark:bg-neutral-950/30">
          {loading && logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-neutral-400 text-sm gap-3">
              <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
              </div>
              <span className="font-medium">加载日志中...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 text-neutral-400 text-sm gap-4">
              <div className="p-4 rounded-3xl bg-neutral-100 dark:bg-neutral-800/80">
                <ShieldAlert className="w-10 h-10 stroke-1 text-neutral-400 dark:text-neutral-500" />
              </div>
              <span className="font-medium text-neutral-500">暂无匹配的系统日志记录</span>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id || `${log.memoId}-${log.createdAt}`}
                className="group p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm border border-neutral-200/60 dark:border-neutral-800/80 space-y-3 hover:border-sky-300 dark:hover:border-sky-700/50 hover:shadow-md transition-all"
              >
                {/* 顶栏：动态 ID & IP & 时间 */}
                <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs text-neutral-500 dark:text-neutral-400 pb-2.5 border-b border-neutral-100 dark:border-neutral-800/60">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-md border border-sky-100 dark:border-sky-900/30">
                      <Hash className="w-3 h-3" />
                      ID: {log.memoId}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                      <Globe className="w-3.5 h-3.5 text-neutral-400" />
                      {log.ip || '未知 IP'}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-neutral-400">
                    <Clock className="w-3.5 h-3.5" />
                    {log.createdAt ? dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss') : '未知时间'}
                  </span>
                </div>

                {/* 用户信息与邮箱 */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-neutral-400" />
                    {log.username || '匿名用户'}
                  </span>
                  {log.email && (
                    <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 text-xs sm:text-sm">
                      <Mail className="w-4 h-4 text-neutral-400" />
                      {log.email}
                    </span>
                  )}
                </div>

                {/* 评论正文内容 */}
                <div className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50/80 dark:bg-neutral-800/40 p-3 sm:p-4 rounded-xl border border-neutral-100 dark:border-neutral-800/60 break-all leading-relaxed">
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
