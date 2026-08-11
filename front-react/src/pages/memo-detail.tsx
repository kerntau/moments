import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router';
import { Header } from '@/components/header';
import { Memo } from '@/components/memo';
import { useGlobalStore } from '@/store';
import { useMyFetch } from '@/lib/api';
import type { MemoVO } from '@/types';

export const MemoDetailPage: React.FC = () => {
  const params = useParams();
  const id = parseInt(params.id || '0', 10);

  const memoChangedId = useGlobalStore((state) => state.memoChangedId);
  const [memo, setMemo] = useState<MemoVO | null>(null);

  const reload = useCallback(async () => {
    if (!id) return;
    try {
      const res = await useMyFetch<MemoVO>(`/memo/get?id=${id}`);
      setMemo(res);
    } catch (err) {
      console.error('获取 Memo 详情失败:', err);
    }
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (memoChangedId === id) {
      reload();
    }
  }, [memoChangedId, id, reload]);

  if (!memo) return null;

  return (
    <>
      {memo.user && <Header user={memo.user} />}
      <Memo memo={memo} />
    </>
  );
};
