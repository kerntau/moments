import React, { useState, useEffect, useCallback, useRef } from 'react';
import { add, format, sub, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Header } from '@/components/header';
import { Memo } from '@/components/memo';
import { DatePicker } from '@/components/date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useGlobalStore } from '@/store';
import { useMyFetch } from '@/lib/api';
import type { MemoVO, UserVO } from '@/types';

const ranges = [
  { label: '一周内', duration: { days: 7 } },
  { label: '一月内', duration: { days: 31 } },
  { label: '三月内', duration: { days: 90 } },
  { label: '本年', duration: { months: 12 } },
  { label: '近三年', duration: { years: 3 } },
];

export const UserCalendarPage: React.FC = () => {
  const currentUser = useGlobalStore((state) => state.currentUser as UserVO);
  const memoReloadTrigger = useGlobalStore((state) => state.memoReloadTrigger);
  const memoChangedId = useGlobalStore((state) => state.memoChangedId);

  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: sub(new Date(), { days: 31 }),
    end: add(new Date(), { days: 1 }),
  });
  const [contentContains, setContentContains] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [locationStats, setLocationStats] = useState<{location: string, count: number}[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showType, setShowType] = useState<number>(-1);

  const [memos, setMemos] = useState<MemoVO[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const loadMoreEleRef = useRef<HTMLDivElement>(null);

  const loadTags = async () => {
    try {
      const res = await useMyFetch<{ tags: string[] }>('/tag/list');
      setAvailableTags(res.tags || []);
    } catch (e) {}
  };

  const loadLocations = async () => {
    try {
      const res = await useMyFetch<{ locations: {location: string, count: number}[] }>('/location/list');
      setLocationStats(res.locations || []);
    } catch (e) {}
  };

  const reload = useCallback(async () => {
    setPage(1);
    try {
      const res = await useMyFetch<{
        list: MemoVO[];
        total: number;
        hasNext: boolean;
      }>('/memo/list', {
        page: 1,
        size: 10,
        start: dateRange.start,
        end: dateRange.end,
        contentContains,
        showType,
        tag: selectedTags.join(','),
        location: selectedLocation,
      });

      setMemos(res.list || []);
      setHasNext(res.hasNext);
    } catch (err) {
      console.error('检索 Memo 失败:', err);
    }
  }, [dateRange, contentContains, showType, selectedTags, selectedLocation]);

  const loadMore = useCallback(async () => {
    if (loading || !hasNext) return;
    setLoading(true);
    const nextPage = page + 1;
    try {
      const res = await useMyFetch<{
        list: MemoVO[];
        total: number;
        hasNext: boolean;
      }>('/memo/list', {
        page: nextPage,
        size: 10,
        start: dateRange.start,
        end: dateRange.end,
        contentContains,
        showType,
        tag: selectedTags.join(','),
        location: selectedLocation,
      });

      setMemos((prev) => [...prev, ...(res.list || [])]);
      setPage(nextPage);
      setHasNext(res.hasNext);
    } catch (err) {
      console.error('加载更多失败:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasNext, page, dateRange, contentContains, showType, selectedTags, selectedLocation]);

  useEffect(() => {
    loadTags();
    loadLocations();
    reload();
  }, []);

  useEffect(() => {
    if (memoReloadTrigger > 0) reload();
  }, [memoReloadTrigger, reload]);

  useEffect(() => {
    if (memoChangedId > 0) {
      useMyFetch<MemoVO>(`/memo/get?latest=1&id=${memoChangedId}`).then((res) => {
        if (res) {
          setMemos((prev) =>
            prev.map((item) => (item.id === memoChangedId ? res : item))
          );
        }
      });
    }
  }, [memoChangedId]);

  useEffect(() => {
    if (!hasNext || !loadMoreEleRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreEleRef.current);
    return () => observer.disconnect();
  }, [hasNext, loadMore]);

  const selectRange = (duration: any) => {
    setDateRange({
      start: sub(new Date(), duration),
      end: new Date(),
    });
  };

  const toggleTag = (t: string) => {
    if (selectedTags.includes(t)) {
      setSelectedTags(selectedTags.filter((tag) => tag !== t));
    } else {
      setSelectedTags([...selectedTags, t]);
    }
  };

  return (
    <div>
      <Header user={currentUser} />

      <div className="p-4 space-y-4 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <label className="font-bold text-xs text-neutral-700 dark:text-neutral-300 mb-1 block">日期范围</label>
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-xs font-normal">
                <CalendarIcon className="w-4 h-4 mr-2" />
                从 {format(dateRange.start, 'yyyy-MM-dd')} 到 {format(dateRange.end, 'yyyy-MM-dd')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" side="bottom" align="start">
              <div className="flex flex-col items-center gap-3">
                <div className="flex flex-wrap gap-1 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                  {ranges.map((r, i) => (
                    <Button key={i} size="sm" variant="ghost" className="text-xs" onClick={() => selectRange(r.duration)}>
                      {r.label}
                    </Button>
                  ))}
                </div>
                <DatePicker
                  mode="range"
                  value={dateRange}
                  onChange={(range: any) => {
                    if (range?.from && range?.to) {
                      setDateRange({ start: range.from, end: range.to });
                      setDatePopoverOpen(false);
                    }
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="font-bold text-xs text-neutral-700 dark:text-neutral-300 mb-1 block">包含内容</label>
          <Input
            value={contentContains}
            onChange={(e) => setContentContains(e.target.value)}
            placeholder="搜索关键字..."
          />
        </div>

        <div>
          <label className="font-bold text-xs text-neutral-700 dark:text-neutral-300 mb-1 block">包含标签</label>
          <div className="flex flex-wrap gap-1.5 border border-input p-2 rounded-md min-h-[36px]">
            {availableTags.map((t) => (
              <span
                key={t}
                className={`text-xs px-2 py-0.5 rounded cursor-pointer transition ${
                  selectedTags.includes(t)
                    ? 'bg-[#9fc84a] text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                }`}
                onClick={() => toggleTag(t)}
              >
                #{t}
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="font-bold text-xs text-neutral-700 dark:text-neutral-300 mb-1 block">足迹分布</label>
          <div className="flex flex-wrap gap-1.5 border border-input p-2 rounded-md min-h-[36px]">
            {locationStats.map((l) => (
              <span
                key={l.location}
                className={`text-xs px-2 py-0.5 rounded cursor-pointer transition flex items-center gap-1 ${
                  selectedLocation === l.location
                    ? 'bg-sky-500 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                }`}
                onClick={() => setSelectedLocation(selectedLocation === l.location ? '' : l.location)}
              >
                <span>{l.location.split(' ').pop()}</span>
                <span className="opacity-70 text-[10px]">({l.count})</span>
              </span>
            ))}
            {locationStats.length === 0 && <span className="text-xs text-neutral-400 p-1">暂无足迹</span>}
          </div>
        </div>

        <div>
          <label className="font-bold text-xs text-neutral-700 dark:text-neutral-300 mb-1 block">可见性</label>
          <Select
            value={showType}
            onChange={(e) => setShowType(parseInt(e.target.value, 10))}
          >
            <option value={-1}>所有的</option>
            <option value={1}>公开的</option>
            <option value={0}>自己可见</option>
          </Select>
        </div>

        <Button className="w-full bg-[#9fc84a] hover:bg-[#8eb83f]" onClick={reload}>
          搜索
        </Button>
      </div>

      <div className="flex flex-col divide-y divide-[#C0BEBF]/20 min-h-[300px]">
        {memos.map((m) => (
          <Memo key={m.id} memo={m} />
        ))}
      </div>

      {hasNext ? (
        <div
          ref={loadMoreEleRef}
          className="text-xs text-center text-neutral-500 py-4 cursor-pointer hover:text-neutral-800 dark:hover:text-neutral-200 transition"
          onClick={loadMore}
        >
          {loading ? '加载中...' : '点击加载更多'}
        </div>
      ) : (
        <div className="text-xs text-center text-neutral-400 py-4">已经到底啦</div>
      )}
    </div>
  );
};
