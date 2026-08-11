import React, { useState } from 'react';
import { toast } from 'sonner';
import { Link as LinkIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <LinkIcon className="cursor-pointer w-6 h-6 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition" />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 flex flex-col gap-3" side="top">
        <Input
          placeholder="请输入分享的链接"
          className="text-xs h-8"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="flex gap-2">
          <Input
            placeholder="请输入分享的标题"
            className="flex-1 text-xs h-8"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button size="sm" variant="outline" className="text-xs whitespace-nowrap" onClick={getFavicon} disabled={pending}>
            {pending ? '抓取中...' : '自动获取标题'}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="请输入分享的 favicon 地址"
            className="flex-1 text-xs h-8"
            value={favicon}
            onChange={(e) => setFavicon(e.target.value)}
          />
          {favicon && <img className="w-6 h-6 object-contain rounded" src={favicon} alt="icon" />}
        </div>

        <div className="flex gap-2 justify-end mt-2">
          <Button size="sm" onClick={handleConfirm}>
            确定
          </Button>
          <Button size="sm" variant="outline" onClick={clear}>
            清空并关闭
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
