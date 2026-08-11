import React, { useState } from 'react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <svg
          className="focus:outline-none cursor-pointer w-6 h-6 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M15.2735 15H5V7H19V15H17.3764L16.0767 19H21V21H3V19H7.6123L6.8 16.5L8.70211 15.882L9.71522 19H13.9738L15.2735 15ZM3.5 3H20.5V5H3.5V3ZM7 9V13H17V9H7Z" />
        </svg>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-4 flex flex-col gap-3" side="top">
        <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">选择类型</div>
        <div className="flex gap-4 text-xs">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="doubanType"
              value="book"
              checked={selectedType === 'book'}
              onChange={() => setSelectedType('book')}
            />
            <span>豆瓣读书</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="doubanType"
              value="movie"
              checked={selectedType === 'movie'}
              onChange={() => setSelectedType('movie')}
            />
            <span>豆瓣电影</span>
          </label>
        </div>

        <Input
          type="text"
          className="text-xs h-8"
          placeholder="请输入豆瓣读书/豆瓣电影的ID"
          value={idInput}
          onChange={(e) => setIdInput(e.target.value)}
        />

        <div className="flex gap-2 justify-end mt-2">
          <Button size="sm" onClick={doParse} disabled={pending}>
            {pending ? '解析中...' : '确定'}
          </Button>
          <Button size="sm" variant="outline" onClick={reset}>
            清空并关闭
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
