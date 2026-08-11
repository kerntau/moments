import React from 'react';
import { useParams } from 'react-router';
import { Header } from '@/components/header';
import { MemoEdit } from '@/components/memo-edit';
import { useGlobalStore } from '@/store';
import type { UserVO } from '@/types';

export const EditMemoPage: React.FC = () => {
  const params = useParams();
  const id = parseInt(params.id || '0', 10);
  const currentUser = useGlobalStore((state) => state.currentUser as UserVO);

  return (
    <div>
      {currentUser && <Header user={currentUser} />}
      <MemoEdit id={id} />
    </div>
  );
};
