import React, { useState } from 'react';
import { toast } from 'sonner';
import { Link as LinkIcon } from 'lucide-react';
import { ResponsivePopover, ResponsivePopoverContent, ResponsivePopoverTrigger } from '@/components/ui/responsive-popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMyFetch } from '@/lib/api';

interface ExternalUrlProps {
  url?: string;
  title?: string;
  favicon?: string;
  onConfirm: (data: { url: string; title: string; favicon: string }) => void;
}

export const ExternalUrl: React.FC<ExternalUrlProps> = ({
  url: initialUrl = '',
  title: initialTitle = '',
  favicon: initialFavicon = '',
  onConfirm,
}) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(initialUrl);
  const [title, setTitle] = useState(initialTitle);
  const [favicon, setFavicon] = useState(initialFavicon);
  const [pending, setPending] = useState(false);

  const getFavicon = async () => {
    if (!url.trim()) {
      toast.error('请先填写地址');
      return;
    }
    setPending(true);
    try {
      const res = await useMyFetch<{ favicon: string; title: string }>(
        `/memo/getFaviconAndTitle?url=${encodeURIComponent(url.trim())}`
      );
      setTitle(res.title || '');
      setFavicon(res.favicon || '');
      toast.success('自动抓取外链信息成功');
    } catch (err: any) {
      toast.error(err?.message || '抓取外链元数据失败');
    } finally {
      setPending(false);
    }
  };

  const handleConfirm = () => {
    if (url.trim() && title.trim() && favicon.trim()) {
      onConfirm({ url: url.trim(), title: title.trim(), favicon: favicon.trim() });
      setOpen(false);
      return;
    }
    toast.error('请完整填写相关内容');
  };

  const clear = () => {
    setUrl('');
    setTitle('');
    setFavicon('');
    onConfirm({ url: '', title: '', favicon: '' });
    setOpen(false);
  };

  return (
    <ResponsivePopover open={open} onOpenChange={setOpen}>
      <ResponsivePopoverTrigger asChild>
        <LinkIcon className="cursor-pointer w-6 h-6 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition" />
      </ResponsivePopoverTrigger>
      <ResponsivePopoverContent className="w-full sm:w-[540px]" side="top" title="分享链接">
        <Input
          placeholder="请输入分享的链接 (https://...)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="flex gap-2">
          <Input
            placeholder="请输入分享的标题"
            className="flex-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button size="sm" variant="outline" className="text-xs h-10 px-3 rounded-xl whitespace-nowrap font-medium border-neutral-200/80 dark:border-neutral-700/80 hover:bg-neutral-100 dark:hover:bg-neutral-800" onClick={getFavicon} disabled={pending}>
            {pending ? '抓取中...' : '自动获取'}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="请输入分享的 favicon 地址"
            className="flex-1"
            value={favicon}
            onChange={(e) => setFavicon(e.target.value)}
          />
          {favicon && <img className="w-8 h-8 object-contain rounded-xl shrink-0 border border-neutral-200 dark:border-neutral-700 bg-white p-0.5 shadow-xs" src={favicon} alt="icon" />}
        </div>

        <div className="flex gap-3 pt-2 mt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-10 rounded-xl border-none bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-medium text-sm transition-all active:scale-95"
            onClick={clear}
          >
            清空关闭
          </Button>
          <Button
            size="sm"
            className="flex-1 h-10 rounded-xl border-none bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm shadow-xs transition-all active:scale-95"
            onClick={handleConfirm}
          >
            确定
          </Button>
        </div>
      </ResponsivePopoverContent>
    </ResponsivePopover>
  );
};
