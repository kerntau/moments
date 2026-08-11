import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '@/components/header';
import { Memo } from '@/components/memo';
import { useGlobalStore } from '@/store';
import { useMyFetch } from '@/lib/api';
import type { MemoVO, UserVO } from '@/types';

export const HomePage: React.FC = () => {
  const currentUser = useGlobalStore((state) => state.currentUser as UserVO);
  const sysConfig = useGlobalStore((state) => state.sysConfig);
  const memoReloadTrigger = useGlobalStore((state) => state.memoReloadTrigger);
  const memoChangedId = useGlobalStore((state) => state.memoChangedId);

  const [memos, setMemos] = useState<MemoVO[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadMoreEleRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async () => {
    setPage(1);
    try {
      const res = await useMyFetch<{
        list: MemoVO[];
        total: number;
        hasNext: boolean;
      }>('/memo/list', { page: 1, size: 10 });

      setMemos(res.list || []);
      setHasNext(res.hasNext);
    } catch (err) {
      console.error('加载 Memo 列表失败:', err);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasNext) return;
    setLoading(true);
    const nextPage = page + 1;
    try {
      const res = await useMyFetch<{
        list: MemoVO[];
        total: number;
        hasNext: boolean;
      }>('/memo/list', { page: nextPage, size: 10 });

      setMemos((prev) => [...prev, ...(res.list || [])]);
      setPage(nextPage);
      setHasNext(res.hasNext);
    } catch (err) {
      console.error('加载更多失败:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasNext, page]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (memoReloadTrigger > 0) {
      reload();
    }
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

  // 滚动自动触底加载
  useEffect(() => {
    if (!sysConfig.enableAutoLoadNextPage || !hasNext || !loadMoreEleRef.current) return;

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
  }, [sysConfig.enableAutoLoadNextPage, hasNext, loadMore]);

  return (
    <>
      <Header user={currentUser} />
      <div className="flex flex-col divide-y divide-[#C0BEBF]/20">
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
    </>
  );
};
