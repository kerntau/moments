import React, { useState } from 'react';
import { toast } from 'sonner';
import { ResponsivePopover, ResponsivePopoverContent, ResponsivePopoverTrigger } from '@/components/ui/responsive-popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMyFetch } from '@/lib/api';
import type { DoubanBook, DoubanMovie } from '@/types';

interface DoubanEditProps {
  type?: 'book' | 'movie';
  data?: DoubanBook | DoubanMovie;
  onChangeType: (type: 'book' | 'movie') => void;
  onChangeData: (data: DoubanBook | DoubanMovie) => void;
}

export const DoubanEdit: React.FC<DoubanEditProps> = ({
  type = 'book',
  data = { id: '' },
  onChangeType,
  onChangeData,
}) => {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [idInput, setIdInput] = useState(data.id || '');
  const [selectedType, setSelectedType] = useState<'book' | 'movie'>(type);

  const doParse = async () => {
    if (!idInput.trim()) {
      toast.error('请输入豆瓣 ID');
      return;
    }

    setPending(true);
    const url = selectedType === 'book' ? '/memo/getDoubanBookInfo' : '/memo/getDoubanMovieInfo';
    try {
      const res = await useMyFetch<any>(`${url}?id=${encodeURIComponent(idInput.trim())}`);
      onChangeType(selectedType);
      onChangeData({ id: idInput.trim(), ...res });
      setOpen(false);
      toast.success('豆瓣信息解析成功');
    } catch (err: any) {
      toast.error(err?.message || '解析失败');
    } finally {
      setPending(false);
    }
  };

  const reset = () => {
    setSelectedType('book');
    setIdInput('');
    onChangeType('book');
    onChangeData({ id: '' });
    setOpen(false);
  };

  return (
    <ResponsivePopover open={open} onOpenChange={setOpen}>
      <ResponsivePopoverTrigger asChild>
        <svg
          className="focus:outline-none cursor-pointer w-6 h-6 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M15.2735 15H5V7H19V15H17.3764L16.0767 19H21V21H3V19H7.6123L6.8 16.5L8.70211 15.882L9.71522 19H13.9738L15.2735 15ZM3.5 3H20.5V5H3.5V3ZM7 9V13H17V9H7Z" />
        </svg>
      </ResponsivePopoverTrigger>
      <ResponsivePopoverContent className="w-full sm:w-[540px]" side="top" title="豆瓣信息">
        <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 px-0.5">选择解析类型</div>
        <div className="flex gap-3 text-sm px-0.5">
          <label
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl border cursor-pointer font-medium text-xs transition-all ${
              selectedType === 'book'
                ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400'
                : 'bg-neutral-100 dark:bg-neutral-800 border-transparent text-neutral-600 dark:text-neutral-300'
            }`}
            onClick={() => setSelectedType('book')}
          >
            <span>豆瓣读书</span>
          </label>
          <label
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl border cursor-pointer font-medium text-xs transition-all ${
              selectedType === 'movie'
                ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400'
                : 'bg-neutral-100 dark:bg-neutral-800 border-transparent text-neutral-600 dark:text-neutral-300'
            }`}
            onClick={() => setSelectedType('movie')}
          >
            <span>豆瓣电影</span>
          </label>
        </div>

        <Input
          type="text"
          className="mt-1"
          placeholder="请输入豆瓣读书 / 电影的数字ID"
          value={idInput}
          onChange={(e) => setIdInput(e.target.value)}
        />

        <div className="flex gap-3 pt-2 mt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-10 rounded-xl border-none bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 font-medium text-sm transition-all active:scale-95"
            onClick={reset}
          >
            清空关闭
          </Button>
          <Button
            size="sm"
            className="flex-1 h-10 rounded-xl border-none bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm shadow-xs transition-all active:scale-95"
            onClick={doParse}
            disabled={pending}
          >
            {pending ? '解析中...' : '确定'}
          </Button>
        </div>
      </ResponsivePopoverContent>
    </ResponsivePopover>
  );
};
