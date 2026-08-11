import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Video as VideoIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <VideoIcon className="cursor-pointer w-6 h-6 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition" />
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-4 flex flex-col gap-3" side="top">
        <Tabs defaultValue="uploadVideo" className="w-full">
          <TabsList className="grid grid-cols-2 h-8">
            <TabsTrigger value="uploadVideo" className="text-xs">
              本地
            </TabsTrigger>
            <TabsTrigger value="onlineUrl" className="text-xs">
              在线
            </TabsTrigger>
          </TabsList>

          <TabsContent value="uploadVideo" className="space-y-2 mt-2">
            <div className="text-xs text-neutral-400">上传视频文件</div>
            <Input type="file" accept="video/*" className="text-xs cursor-pointer" onChange={handleUploadVideo} />
            <div className="text-xs text-neutral-400">视频地址</div>
            <Input className="text-xs h-8" value={onlineUrl} onChange={(e) => setOnlineUrl(e.target.value)} />

            {filename && (
              <div className="text-xs text-neutral-400 space-y-1">
                <p>正在上传({current}/{total})</p>
                <p className="truncate">{filename}</p>
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#9fc84a] h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="onlineUrl" className="space-y-2 mt-2">
            <div className="text-xs text-neutral-400">嵌入 B 站视频 (BV号 / 分享链接 / iframe)</div>
            <Input
              className="text-xs h-8"
              placeholder="https://player.bilibili.com/..."
              value={bilibiliUrl}
              onChange={(e) => setBilibiliUrl(e.target.value)}
            />

            <div className="text-xs text-neutral-400">嵌入 YouTube 视频</div>
            <Input
              className="text-xs h-8"
              placeholder="https://www.youtube.com/embed/..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
            />
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 justify-end mt-2">
          <Button size="sm" onClick={handleConfirm}>
            确定
          </Button>
          <Button size="sm" variant="outline" onClick={reset}>
            清空
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
