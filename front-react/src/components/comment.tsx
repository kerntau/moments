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
    <div className="text-sm py-1 border-b border-neutral-100 dark:border-neutral-800/50 last:border-none">
      <div>
        {comment.author === memoUserId ? (
          <span className="text-[#576b95] whitespace-nowrap font-medium">
            {comment.username}
            <span className="ml-1 text-[10px] bg-neutral-200 dark:bg-neutral-700 px-1 py-0.5 rounded text-neutral-600 dark:text-neutral-300">
              作者
            </span>
          </span>
        ) : (
          <span className="text-[#576b95] whitespace-nowrap font-medium">
            {comment.website ? (
              <a
                href={formatWebsite(comment.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
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
            <span className="mx-1 text-neutral-500">回复</span>
            <span className="text-[#576b95] whitespace-nowrap">{comment.replyTo}</span>
          </>
        )}

        <span className="mx-0.5">:</span>
        <span className="inline break-all cursor-pointer hover:opacity-80 ml-1" onClick={toggle}>
          {comment.content}
        </span>

        <span className="text-xs text-neutral-400 ml-2 hidden sm:inline-block">
          {dayjs(comment.createdAt).fromNow()}
        </span>

        {(userinfo.id === memoUserId || userinfo.id === 1) && (
          <span className="text-xs text-neutral-400 ml-2 inline-flex items-center">
            <Confirm onOk={removeComment}>
              <Trash2 className="w-3.5 h-3.5 cursor-pointer text-red-400 hover:text-red-600 transition" />
            </Confirm>
          </span>
        )}
      </div>

      <CommentBox
        memoId={memoId}
        replyTo={comment.username}
        commentId={comment.id}
      />
    </div>
  );
};
