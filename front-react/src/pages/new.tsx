import React from 'react';
import { Header } from '@/components/header';
import { MemoEdit } from '@/components/memo-edit';
import { useGlobalStore } from '@/store';
import type { UserVO } from '@/types';

export const NewMemoPage: React.FC = () => {
  const currentUser = useGlobalStore((state) => state.currentUser as UserVO);

  return (
    <div>
      {currentUser && <Header user={currentUser} />}
      <MemoEdit />
    </div>
  );
};
