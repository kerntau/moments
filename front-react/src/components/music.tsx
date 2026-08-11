import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Music as MusicIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <MusicIcon className="cursor-pointer w-6 h-6 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition" />
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-4 flex flex-col gap-3 max-h-[420px] overflow-y-auto" side="top">
        <Tabs defaultValue="musicID" className="w-full">
          <TabsList className="grid grid-cols-2 h-8">
            <TabsTrigger value="musicID" className="text-xs">
              在线音乐
            </TabsTrigger>
            <TabsTrigger value="musicAPI" className="text-xs">
              API接口
            </TabsTrigger>
          </TabsList>

          <TabsContent value="musicID" className="space-y-3 mt-2">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">选择平台</label>
                <a
                  href="https://github.com/metowolf/MetingJS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-neutral-400 underline"
                >
                  MetingJS文档
                </a>
              </div>
              <select
                className="w-full h-8 text-xs border rounded px-2 bg-transparent dark:bg-neutral-800"
                value={server}
                onChange={(e) => setServer(e.target.value as MetingMusicServer)}
              >
                {servers.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">选择类型</label>
              <select
                className="w-full h-8 text-xs border rounded px-2 bg-transparent dark:bg-neutral-800"
                value={type}
                onChange={(e) => setType(e.target.value as MetingMusicType)}
              >
                {types.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">ID</label>
              <Input
                className="text-xs h-8"
                placeholder="输入歌曲ID/播放列表ID/专辑ID"
                value={id}
                onChange={(e) => setId(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="musicAPI" className="space-y-2 mt-2">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">API接口地址</label>
            <Input className="text-xs h-8" value={api} onChange={(e) => setApi(e.target.value)} />
          </TabsContent>
        </Tabs>

        {previewing && <MusicPreview id={id} server={server} type={type} api={api} />}

        <div className="flex gap-2 justify-end mt-2">
          <Button size="sm" variant="secondary" onClick={handlePreview} disabled={previewLoading}>
            预览
          </Button>
          <Button size="sm" onClick={handleConfirm}>
            确定
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset}>
            清空
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
