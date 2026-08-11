import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router';
import { Header } from '@/components/header';
import { Memo } from '@/components/memo';
import { useGlobalStore } from '@/store';
import { useMyFetch } from '@/lib/api';
import type { MemoVO, UserVO } from '@/types';

export const UserProfilePage: React.FC = () => {
  const params = useParams();
  const userId = parseInt(params.id || '0', 10);

  const memoReloadTrigger = useGlobalStore((state) => state.memoReloadTrigger);
  const memoChangedId = useGlobalStore((state) => state.memoChangedId);

  const [memos, setMemos] = useState<MemoVO[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadMoreEleRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async () => {
    if (!userId) return;
    setPage(1);
    try {
      const res = await useMyFetch<{
        list: MemoVO[];
        total: number;
        hasNext: boolean;
      }>('/memo/list', { page: 1, size: 10, userId });

      setMemos(res.list || []);
      setHasNext(res.hasNext);
    } catch (err) {
      console.error('获取个人空间 Memo 列表失败:', err);
    }
  }, [userId]);

  const loadMore = useCallback(async () => {
    if (loading || !hasNext || !userId) return;
    setLoading(true);
    const nextPage = page + 1;
    try {
      const res = await useMyFetch<{
        list: MemoVO[];
        total: number;
        hasNext: boolean;
      }>('/memo/list', { page: nextPage, size: 10, userId });

      setMemos((prev) => [...prev, ...(res.list || [])]);
      setPage(nextPage);
      setHasNext(res.hasNext);
    } catch (err) {
      console.error('加载更多失败:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasNext, userId, page]);

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

  const userVO = memos.length > 0 ? memos[0].user : ({} as UserVO);

  return (
    <>
      {userVO && userVO.id && <Header user={userVO} />}
      <div className="flex flex-col divide-y divide-[#C0BEBF]/20 min-h-[400px]">
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
