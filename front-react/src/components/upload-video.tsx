import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Video as VideoIcon } from 'lucide-react';
import { ResponsivePopover, ResponsivePopoverContent, ResponsivePopoverTrigger } from '@/components/ui/responsive-popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileInput } from '@/components/ui/file-input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useUpload } from '@/lib/upload';
import type { Video, VideoType } from '@/types';

interface UploadVideoProps {
  type?: VideoType;
  value?: string;
  onConfirm: (video: Video) => void;
}

const youtubeUrlTemplateList = [
  {
    reg: /src=['"](?:https?:)?(?:\/)*([^'"]+)['"]/,
    template: 'https://@{placeholder}',
  },
  {
    reg: /v=([^&#]+)/,
    template: 'https://www.youtube.com/embed/@{placeholder}',
  },
  {
    reg: /youtu\.be\/([^\/\?]+)/,
    template: 'https://www.youtube.com/embed/@{placeholder}',
  },
];

const bilibiliUrlTemplateList = [
  {
    reg: /src=['"](?:https?:)?(?:\/)*([^'"]+)['"]/,
    template: 'https://@{placeholder}',
  },
  {
    reg: /av(\d+)/i,
    template: 'https://player.bilibili.com/player.html?aid=@{placeholder}',
  },
  {
    reg: /(bv[\w]+)/i,
    template: 'https://player.bilibili.com/player.html?bvid=@{placeholder}',
  },
];

export const UploadVideo: React.FC<UploadVideoProps> = ({
  type = 'youtube',
  value = '',
  onConfirm,
}) => {
  const [open, setOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [bilibiliUrl, setBilibiliUrl] = useState('');
  const [onlineUrl, setOnlineUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [filename, setFilename] = useState('');
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (type === 'youtube') setYoutubeUrl(value);
    else if (type === 'bilibili') setBilibiliUrl(value);
    else if (type === 'online') setOnlineUrl(value);
  }, [type, value]);

  const handleUploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      if (!files[i].type.includes('video')) {
        toast.error('只能上传视频文件');
        return;
      }
    }

    try {
      const result = await useUpload(files, (totalSize, index, name, p) => {
        setProgress(Math.round(p * 100));
        setFilename(name);
        setTotal(totalSize);
        setCurrent(index);
      });

      if (result.length) {
        toast.success('上传成功');
        setOnlineUrl(result[0]);
        setProgress(0);
        setFilename('');
      }
    } catch (err: any) {
      toast.error(err?.message || '上传视频失败');
    }
  };

  const emitUrl = (vType: VideoType, val: string) => {
    if (vType !== 'youtube') setYoutubeUrl('');
    if (vType !== 'bilibili') setBilibiliUrl('');
    if (vType !== 'online') setOnlineUrl('');

    onConfirm({ type: vType, value: val });
  };

  const handleConfirm = () => {
    if (bilibiliUrl.trim() && youtubeUrl.trim()) {
      toast.warning('请勿同时填写两个地址');
      return;
    }

    if (bilibiliUrl.trim()) {
      if (bilibiliUrl.startsWith('https://player.bilibili.com/player.html')) {
        emitUrl('bilibili', bilibiliUrl.trim());
        setOpen(false);
        return;
      }

      for (const tpl of bilibiliUrlTemplateList) {
        const [_, matchedValue] = bilibiliUrl.match(tpl.reg) || [];
        if (matchedValue) {
          const url = tpl.template.replace('@{placeholder}', matchedValue);
          emitUrl('bilibili', url);
          setOpen(false);
          return;
        }
      }

      toast.warning('无效的B站视频地址');
      return;
    }

    if (youtubeUrl.trim()) {
      if (youtubeUrl.startsWith('https://www.youtube.com/embed')) {
        emitUrl('youtube', youtubeUrl.trim());
        setOpen(false);
        return;
      }

      for (const tpl of youtubeUrlTemplateList) {
        const [_, matchedValue] = youtubeUrl.match(tpl.reg) || [];
        if (matchedValue) {
          const url = tpl.template.replace('@{placeholder}', matchedValue);
          emitUrl('youtube', url);
          setOpen(false);
          return;
        }
      }

      toast.warning('无效的Youtube视频地址');
      return;
    }

    if (onlineUrl.trim()) {
      emitUrl('online', onlineUrl.trim());
      setOpen(false);
      return;
    }

    setOpen(false);
  };

  const reset = () => {
    setYoutubeUrl('');
    setBilibiliUrl('');
    setOnlineUrl('');
    onConfirm({ type: 'youtube', value: '' });
  };

  return (
    <ResponsivePopover open={open} onOpenChange={setOpen}>
      <ResponsivePopoverTrigger asChild>
        <VideoIcon className="cursor-pointer w-6 h-6 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition" />
      </ResponsivePopoverTrigger>
      <ResponsivePopoverContent className="w-[300px] p-4 flex flex-col gap-3" side="top" title="添加视频">
        <Tabs defaultValue="uploadVideo" className="w-full">
          <TabsList className="grid grid-cols-2 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1">
            <TabsTrigger value="uploadVideo" className="text-xs rounded-lg font-medium">
              本地上传
            </TabsTrigger>
            <TabsTrigger value="onlineUrl" className="text-xs rounded-lg font-medium">
              在线嵌入
            </TabsTrigger>
          </TabsList>

          <TabsContent value="uploadVideo" className="space-y-3 mt-2">
            <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 px-0.5">上传视频文件</div>
            <FileInput accept="video/*" onChange={handleUploadVideo} />
            <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 px-0.5 pt-1">视频 URL 地址</div>
            <Input value={onlineUrl} onChange={(e) => setOnlineUrl(e.target.value)} />

            {filename && (
              <div className="text-xs text-neutral-400 space-y-1.5 p-2.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
                <p className="font-medium text-neutral-600 dark:text-neutral-300">正在上传({current}/{total})</p>
                <p className="truncate text-[11px] text-neutral-400">{filename}</p>
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="onlineUrl" className="space-y-3 mt-2">
            <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 px-0.5">B站视频 (BV号/链接)</div>
            <Input
              placeholder="https://player.bilibili.com/..."
              value={bilibiliUrl}
              onChange={(e) => setBilibiliUrl(e.target.value)}
            />

            <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 px-0.5 pt-1">YouTube 视频</div>
            <Input
              placeholder="https://www.youtube.com/embed/..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
            />
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-2 mt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-10 rounded-xl border-none bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 font-medium text-sm transition-all active:scale-95"
            onClick={reset}
          >
            清空
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
