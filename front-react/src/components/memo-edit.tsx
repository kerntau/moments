import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  RotateCcw,
  Smile,
  MapPin,
  Plus,
  X,
} from 'lucide-react';
import { ExternalUrl } from '@/components/external-url';
import { UploadImage } from '@/components/upload-image';
import { Music } from '@/components/music';
import { UploadVideo } from '@/components/upload-video';
import { DoubanEdit } from '@/components/douban-edit';
import { DatePicker } from '@/components/date-picker';
import { Emoji } from '@/components/emoji';
import { ExternalUrlPreview } from '@/components/external-url-preview';
import { UploadImagePreview } from '@/components/upload-image-preview';
import { MusicPreview } from '@/components/music-preview';
import { DoubanBookPreview } from '@/components/douban-book-preview';
import { DoubanMoviePreview } from '@/components/douban-movie-preview';
import { VideoPreview } from '@/components/video-preview';
import { VideoPreviewIframe } from '@/components/video-preview-iframe';
import { LocationPicker } from '@/components/location-picker';
import { ResponsivePopover, ResponsivePopoverContent, ResponsivePopoverTrigger } from '@/components/ui/responsive-popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { useMyFetch } from '@/lib/api';
import type {
  DoubanBook,
  DoubanMovie,
  ExtDTO,
  MemoVO,
  MetingMusicServer,
  MetingMusicType,
  MusicDTO,
  Video,
  VideoType,
} from '@/types';

interface MemoEditProps {
  id?: number;
}

export const MemoEdit: React.FC<MemoEditProps> = ({ id = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [doubanType, setDoubanType] = useState<'book' | 'movie'>('book');
  const [doubanData, setDoubanData] = useState<DoubanBook | DoubanMovie>({});
  const [emojiShow, setEmojiShow] = useState(false);
  const [existTags, setExistTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const defaultState = {
    id: id || 0,
    createdAt: '',
    content: '',
    ext: '',
    pinned: false,
    showType: true, // true = 1(公开), false = 0(私密)
    location: '',
    externalFavicon: '',
    externalTitle: '',
    externalUrl: '',
    imgs: '',
    music: {
      id: '',
      api: 'https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&r=:r',
      server: 'netease' as MetingMusicServer,
      type: 'song' as MetingMusicType,
    },
    video: {
      type: 'youtube' as VideoType,
      value: '',
    },
  };

  const [formState, setFormState] = useState(defaultState);

  const loadTags = async () => {
    try {
      const res = await useMyFetch<{ tags: string[] }>('/tag/list');
      setExistTags(res.tags || []);
    } catch (e) {}
  };

  useEffect(() => {
    const initEditData = async () => {
      if (id > 0) {
        try {
          const res = await useMyFetch<MemoVO>(`/memo/get?id=${id}`);
          setFormState({
            id: res.id,
            createdAt: dayjs(res.createdAt).format(),
            content: res.content || '',
            ext: res.ext || '',
            pinned: Boolean(res.pinned),
            showType: res.showType === 1,
            location: res.location || '',
            externalFavicon: res.externalFavicon || '',
            externalTitle: res.externalTitle || '',
            externalUrl: res.externalUrl || '',
            imgs: res.imgs || '',
            music: {
              id: '',
              api: 'https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&r=:r',
              server: 'netease',
              type: 'song',
            },
            video: {
              type: 'youtube',
              value: '',
            },
          });

          let ext: ExtDTO = {};
          try {
            ext = JSON.parse(res.ext || '{}');
          } catch (e) {}

          if (ext.music) {
            setFormState((prev) => ({ ...prev, music: { ...prev.music, ...ext.music } }));
          }
          if (ext.video) {
            setFormState((prev) => ({ ...prev, video: { ...prev.video, ...ext.video } }));
          }

          if (ext.doubanBook && ext.doubanBook.title) {
            setDoubanType('book');
            setDoubanData(ext.doubanBook);
          } else if (ext.doubanMovie && ext.doubanMovie.title) {
            setDoubanType('movie');
            setDoubanData(ext.doubanMovie);
          }

          if (res.tags) {
            let tagsStr = res.tags;
            if (tagsStr.endsWith(',')) tagsStr = tagsStr.slice(0, -1);
            setSelectedTags(tagsStr.split(',').filter(Boolean));
          }
        } catch (err: any) {
          toast.error(err?.message || '获取 Memo 详情失败');
        }
      }
      await loadTags();
    };

    initEditData();
  }, [id]);

  const reset = () => {
    setFormState(defaultState);
    setDoubanType('book');
    setDoubanData({});
    setSelectedTags([]);
  };

  const handleDragImage = (newImgs: string[]) => {
    setFormState((prev) => ({ ...prev, imgs: newImgs.filter(Boolean).join(',') }));
  };

  const handleRemoveImage = (index: number) => {
    const arr = formState.imgs.split(',').filter(Boolean);
    arr.splice(index, 1);
    setFormState((prev) => ({ ...prev, imgs: arr.join(',') }));
  };

  const updateMusic = (music: MusicDTO) => {
    setFormState((prev) => ({ ...prev, music: { ...prev.music, ...music } }));
  };

  const handleVideo = (video: Video) => {
    setFormState((prev) => ({ ...prev, video }));
  };

  const emojiSelected = (emoji: string) => {
    setFormState((prev) => ({ ...prev, content: prev.content + emoji }));
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (!selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
    }
    if (!existTags.includes(trimmed)) {
      setExistTags([...existTags, trimmed]);
    }
    setNewTagInput('');
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  const saveMemo = async () => {
    const doubanKey = doubanType === 'book' ? 'doubanBook' : 'doubanMovie';
    try {
      await useMyFetch('/memo/save', {
        id: formState.id,
        content: formState.content,
        ext: {
          music: formState.music.id ? formState.music : {},
          [doubanKey]: doubanData,
          video: formState.video.value ? formState.video : {},
        },
        pinned: formState.pinned,
        showType: formState.showType ? 1 : 0,
        externalFavicon: formState.externalUrl ? formState.externalFavicon : '',
        externalTitle: formState.externalTitle,
        externalUrl: formState.externalUrl,
        imgs: formState.imgs.split(',').filter(Boolean),
        location: formState.location,
        tags: selectedTags,
        createdAt: formState.createdAt || dayjs().format(),
      });

      toast.success('保存成功!');
      navigate('/');
    } catch (err: any) {
      toast.error(err?.message || '保存失败');
    }
  };

  const parsedLocationLabel = formState.location.split(' ').join(' · ');

  return (
    <div className="px-4 space-y-4 pb-8">
      <div className="flex justify-between items-center pt-4 text-neutral-700 dark:text-neutral-200">
        <div className="flex items-center cursor-pointer" onClick={() => navigate('/')} title="返回主页">
          <ChevronLeft className="w-5 h-5 mr-2" />
          <span className="font-semibold">{id > 0 ? '修改内容' : '新增内容'}</span>
        </div>
        <Button size="sm" onClick={saveMemo} className="bg-sky-500 hover:bg-sky-600 text-white font-medium">
          发表
        </Button>
      </div>

      {/* 工具栏 */}
      <div className="flex items-center gap-4 text-neutral-600 dark:text-neutral-300 pt-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <ExternalUrl
          favicon={formState.externalFavicon}
          title={formState.externalTitle}
          url={formState.externalUrl}
          onConfirm={(data) =>
            setFormState((prev) => ({
              ...prev,
              externalUrl: data.url,
              externalTitle: data.title,
              externalFavicon: data.favicon,
            }))
          }
        />

        <UploadImage
          imgs={formState.imgs}
          onChange={(imgs) => setFormState((prev) => ({ ...prev, imgs }))}
        />

        <Music {...formState.music} onConfirm={updateMusic} />

        <UploadVideo {...formState.video} onConfirm={handleVideo} />

        <DoubanEdit
          type={doubanType}
          data={doubanData}
          onChangeType={setDoubanType}
          onChangeData={setDoubanData}
        />

        {/* 自定义时间 Picker Popover */}
        <ResponsivePopover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <ResponsivePopoverTrigger asChild>
            <CalendarIcon className="w-6 h-6 cursor-pointer text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition" />
          </ResponsivePopoverTrigger>
          <ResponsivePopoverContent className="w-auto p-4" side="top" title="选择发布时间">
            <DatePicker
              mode="single"
              value={formState.createdAt ? new Date(formState.createdAt) : new Date()}
              onChange={(d: Date) => {
                if (d) setFormState((prev) => ({ ...prev, createdAt: dayjs(d).format() }));
                setDatePickerOpen(false);
              }}
            />
          </ResponsivePopoverContent>
        </ResponsivePopover>

        <span title="清空" className="ml-auto flex items-center">
          <RotateCcw
            className="w-5 h-5 cursor-pointer text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition"
            onClick={reset}
          />
        </span>
      </div>

      {/* 文本输入框 + ContextMenu 右键插标签 */}
      <ContextMenu>
        <ContextMenuTrigger className="block w-full">
          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={7}
              placeholder="分享你的此刻想法..."
              className="w-full rounded-2xl border border-transparent bg-neutral-100/90 dark:bg-neutral-800/60 p-3.5 text-sm transition-all focus:bg-white dark:focus:bg-neutral-900 focus:border-sky-400 dark:focus:border-sky-500 focus:ring-2 focus:ring-sky-400/20 dark:focus:ring-sky-500/20 placeholder:text-neutral-400 focus:outline-none resize-none"
              value={formState.content}
              onChange={(e) => setFormState({ ...formState, content: e.target.value })}
            />
            <Smile
              className="text-sky-500 w-6 h-6 animate-bounce absolute right-3.5 bottom-3.5 cursor-pointer select-none"
              onClick={() => setEmojiShow(!emojiShow)}
            />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48 p-2">
          <div className="text-xs text-neutral-400 mb-2 px-2">点击标签快捷插入:</div>
          {existTags.map((tag, i) => (
            <ContextMenuItem
              key={i}
              className="cursor-pointer text-xs py-1"
              onClick={() => addTag(tag)}
            >
              #{tag}
            </ContextMenuItem>
          ))}
        </ContextMenuContent>
      </ContextMenu>

      {emojiShow && <Emoji onSelected={emojiSelected} />}

      {/* 标签选择与创建 */}
      <div className="my-2 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5 min-h-[38px] p-2 border border-transparent rounded-xl bg-neutral-100/70 dark:bg-neutral-800/50">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs bg-sky-500/15 text-sky-600 dark:text-sky-400 px-2.5 py-1 rounded-lg font-medium"
            >
              #{tag}
              <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => removeTag(tag)} />
            </span>
          ))}

          <ResponsivePopover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
            <ResponsivePopoverTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 px-2.5 text-xs flex items-center gap-1 text-neutral-500 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 rounded-lg">
                <Plus className="w-3.5 h-3.5" /> 选择/添加标签
              </Button>
            </ResponsivePopoverTrigger>
            <ResponsivePopoverContent className="w-64 p-3 flex flex-col gap-3" side="bottom" title="选择标签">
              <div className="flex gap-2">
                <Input
                  placeholder="新建标签"
                  className="flex-1"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addTag(newTagInput);
                  }}
                />
                <Button size="sm" className="h-10 px-4 text-sm bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-xl shrink-0" onClick={() => addTag(newTagInput)}>
                  添加
                </Button>
              </div>
              {existTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  {existTags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-xs px-2.5 py-1 rounded-lg cursor-pointer font-medium transition ${
                        selectedTags.includes(tag)
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                      onClick={() => (selectedTags.includes(tag) ? removeTag(tag) : addTag(tag))}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </ResponsivePopoverContent>
          </ResponsivePopover>
        </div>
      </div>

      {/* 位置与公开/私密控制 */}
      <div className="flex justify-between items-center pt-2">
        <ResponsivePopover open={locationPopoverOpen} onOpenChange={setLocationPopoverOpen}>
          <ResponsivePopoverTrigger asChild>
            <div className="flex items-center gap-1.5 text-[#576b95] text-sm cursor-pointer hover:underline">
              <MapPin className="w-4 h-4" />
              <span>{formState.location ? parsedLocationLabel : '自定义位置'}</span>
            </div>
          </ResponsivePopoverTrigger>
          <ResponsivePopoverContent className="w-80 p-4 flex flex-col gap-3" side="top" title="所在位置">
            <LocationPicker
              value={formState.location}
              onChange={(location) => setFormState((prev) => ({ ...prev, location }))}
              onConfirm={() => setLocationPopoverOpen(false)}
            />
          </ResponsivePopoverContent>
        </ResponsivePopover>

        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
          <span>{formState.showType ? '公开' : '私密'}</span>
          <Switch
            checked={formState.showType}
            onChange={(checked) => setFormState({ ...formState, showType: checked })}
          />
        </div>
      </div>

      {/* 实时多媒体扩展预览 */}
      <div className="flex flex-col gap-2 pt-2">
        <ExternalUrlPreview
          favicon={formState.externalFavicon}
          title={formState.externalTitle}
          url={formState.externalUrl}
        />
        <UploadImagePreview
          imgs={formState.imgs}
          onRemoveImage={handleRemoveImage}
          onDragImage={handleDragImage}
        />
        {formState.music && formState.music.id && formState.music.type && formState.music.server && (
          <MusicPreview {...formState.music} />
        )}
        {doubanType === 'book' && doubanData && doubanData.title && <DoubanBookPreview book={doubanData} />}
        {doubanType === 'movie' && doubanData && doubanData.title && <DoubanMoviePreview movie={doubanData} />}
        {['bilibili', 'youtube'].includes(formState.video.type) && formState.video.value && (
          <VideoPreviewIframe url={formState.video.value} />
        )}
        {formState.video.type === 'online' && formState.video.value && <VideoPreview url={formState.video.value} />}
      </div>
    </div>
  );
};
