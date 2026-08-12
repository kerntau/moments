import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Music as MusicIcon } from 'lucide-react';
import { ResponsivePopover, ResponsivePopoverContent, ResponsivePopoverTrigger } from '@/components/ui/responsive-popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MusicPreview } from '@/components/music-preview';
import type { MetingMusicServer, MetingMusicType, MusicDTO } from '@/types';

interface MusicProps extends MusicDTO {
  onConfirm: (music: MusicDTO) => void;
}

const servers = [
  { value: 'netease', label: '网易云音乐' },
  { value: 'tencent', label: 'QQ音乐' },
  { value: 'kugou', label: '酷狗音乐' },
  { value: 'xiami', label: '虾米音乐' },
  { value: 'baidu', label: '百度音乐' },
];

const types = [
  { value: 'song', label: '歌曲' },
  { value: 'playlist', label: '播放列表' },
  { value: 'album', label: '专辑' },
  { value: 'search', label: '搜索' },
  { value: 'artist', label: '艺术家' },
];

export const Music: React.FC<MusicProps> = ({
  id: initialId = '',
  server: initialServer = 'netease' as MetingMusicServer,
  type: initialType = 'song' as MetingMusicType,
  api: initialApi = 'https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&r=:r',
  onConfirm,
}) => {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState(initialId);
  const [server, setServer] = useState<MetingMusicServer>(initialServer);
  const [type, setType] = useState<MetingMusicType>(initialType);
  const [api, setApi] = useState(initialApi);

  const [previewing, setPreviewing] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    setId(initialId);
    setServer(initialServer);
    setType(initialType);
    setApi(initialApi);
  }, [initialId, initialServer, initialType, initialApi]);

  const handlePreview = () => {
    if (!server || !api || !id || !type) {
      toast.error('请完整填写所需信息');
      return;
    }
    setPreviewing(false);
    setPreviewLoading(true);
    setTimeout(() => {
      setPreviewing(true);
      setPreviewLoading(false);
    }, 500);
  };

  const handleConfirm = () => {
    onConfirm({ id, server, type, api });
    setOpen(false);
  };

  const handleReset = () => {
    setPreviewing(false);
    setId('');
    setServer('netease' as MetingMusicServer);
    setType('song' as MetingMusicType);
    const defaultApi = 'https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&r=:r';
    setApi(defaultApi);
    onConfirm({ id: '', server: 'netease', type: 'song', api: defaultApi });
    setOpen(false);
  };

  return (
    <ResponsivePopover open={open} onOpenChange={setOpen}>
      <ResponsivePopoverTrigger asChild>
        <MusicIcon className="cursor-pointer w-6 h-6 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition" />
      </ResponsivePopoverTrigger>
      <ResponsivePopoverContent side="top" title="添加音乐">
        <Tabs defaultValue="musicID" className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="musicID">
              在线音乐
            </TabsTrigger>
            <TabsTrigger value="musicAPI">
              API接口
            </TabsTrigger>
          </TabsList>

          <TabsContent value="musicID" className="space-y-3.5 mt-3">
            <div>
              <div className="flex justify-between items-center mb-1.5 px-0.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">选择平台</label>
                <a
                  href="https://github.com/metowolf/MetingJS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sky-500 hover:underline font-medium"
                >
                  MetingJS 文档
                </a>
              </div>
              <Select
                value={server}
                onChange={(e) => setServer(e.target.value as MetingMusicServer)}
              >
                {servers.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 px-0.5 block">选择类型</label>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as MetingMusicType)}
              >
                {types.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 px-0.5 block">资源 ID</label>
              <Input
                placeholder="输入歌曲ID / 播放列表ID / 专辑ID"
                value={id}
                onChange={(e) => setId(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="musicAPI" className="space-y-2 mt-3">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 px-0.5 block">API 接口地址</label>
            <Input value={api} onChange={(e) => setApi(e.target.value)} />
          </TabsContent>
        </Tabs>

        {previewing && <MusicPreview id={id} server={server} type={type} api={api} />}

        <div className="grid grid-cols-3 gap-2.5 pt-3 mt-2 border-t border-neutral-100 dark:border-neutral-800">
          <Button
            size="sm"
            variant="outline"
            className="h-10 rounded-xl border-none bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium text-xs transition-all active:scale-95"
            onClick={handleReset}
          >
            清空
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-10 rounded-xl border-none bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-medium text-xs transition-all active:scale-95"
            onClick={handlePreview}
            disabled={previewLoading}
          >
            {previewLoading ? '加载中' : '预览'}
          </Button>
          <Button
            size="sm"
            className="h-10 rounded-xl border-none bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs shadow-xs transition-all active:scale-95"
            onClick={handleConfirm}
          >
            确定
          </Button>
        </div>
      </ResponsivePopoverContent>
    </ResponsivePopover>
  );
};
