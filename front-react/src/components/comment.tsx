import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Confirm } from '@/components/confirm';
import { CommentBox } from '@/components/comment-box';
import { useGlobalStore } from '@/store';
import { useMyFetch } from '@/lib/api';
import type { CommentVO } from '@/types';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

interface CommentProps {
  comment: CommentVO;
  memoId: number;
  memoUserId: number;
}

export const Comment: React.FC<CommentProps> = ({ comment, memoId, memoUserId }) => {
  const userinfo = useGlobalStore((state) => state.userinfo);
  const currentCommentBox = useGlobalStore((state) => state.currentCommentBox);
  const setCurrentCommentBox = useGlobalStore((state) => state.setCurrentCommentBox);
  const notifyMemoChanged = useGlobalStore((state) => state.notifyMemoChanged);

  const toggle = () => {
    const value = `${memoId}#${comment.id}`;
    if (currentCommentBox === value) {
      setCurrentCommentBox('');
    } else {
      setCurrentCommentBox(value);
    }
  };

  const removeComment = async () => {
    try {
      await useMyFetch(`/comment/remove?id=${comment.id}`);
      toast.success('删除成功!');
      notifyMemoChanged(memoId);
    } catch (err: any) {
      toast.error(err?.message || '删除失败');
    }
  };

  const formatWebsite = (website: string) => {
    if (/^https?:\/\//i.test(website)) {
      return website;
    }
    return `http://${website}`;
  };

  return (
    <div className="text-[14px] leading-[1.45] py-0.5 text-[#111111] dark:text-neutral-100">
      <div>
        {comment.author === memoUserId ? (
          <span className="text-[#576b95] dark:text-[#7d90b8] font-medium mr-1">
            {comment.username}
            <span className="ml-1 text-[10px] bg-black/5 dark:bg-white/10 px-1 py-0.2 rounded text-neutral-500 dark:text-neutral-400 font-normal">
              作者
            </span>
          </span>
        ) : (
          <span className="text-[#576b95] dark:text-[#7d90b8] font-medium mr-1">
            {comment.website ? (
              <a
                href={formatWebsite(comment.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80"
              >
                {comment.username}
              </a>
            ) : (
              <span>{comment.username}</span>
            )}
          </span>
        )}

        {comment.replyTo && (
          <>
            <span className="mx-1 text-[#111111] dark:text-neutral-300">回复</span>
            <span className="text-[#576b95] dark:text-[#7d90b8] font-medium mr-1">{comment.replyTo}</span>
          </>
        )}

        <span className="mr-1 text-[#111111] dark:text-neutral-300">:</span>
        <span className="inline break-all cursor-pointer hover:opacity-80" onClick={toggle}>
          {comment.content}
        </span>

        <span className="inline-flex items-center gap-1.5 align-middle text-xs text-neutral-400 ml-2">
          <span>{dayjs(comment.createdAt).fromNow()}</span>
          {(userinfo.id === memoUserId || userinfo.id === 1) && (
            <Confirm onOk={removeComment}>
              <span className="inline-flex items-center justify-center p-0.5 cursor-pointer text-red-400 hover:text-red-600 transition leading-none">
                <Trash2 className="w-3.5 h-3.5" />
              </span>
            </Confirm>
          )}
        </span>
      </div>

      <CommentBox
        memoId={memoId}
        replyTo={comment.username}
        commentId={comment.id}
      />
    </div>
  );
};
