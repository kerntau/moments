import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { User, Smile } from 'lucide-react';
import { Emoji } from '@/components/emoji';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGlobalStore } from '@/store';
import { useMyFetch } from '@/lib/api';

interface CommentBoxProps {
  commentId: number;
  memoId: number;
  replyTo?: string;
  replyEmail?: string;
}

declare const grecaptcha: any;

export const CommentBox: React.FC<CommentBoxProps> = ({
  commentId,
  memoId,
  replyTo,
  replyEmail,
}) => {
  const pid = `${memoId}#${commentId}`;
  const currentCommentBox = useGlobalStore((state) => state.currentCommentBox);
  const setCurrentCommentBox = useGlobalStore((state) => state.setCurrentCommentBox);
  const userinfo = useGlobalStore((state) => state.userinfo);
  const sysConfig = useGlobalStore((state) => state.sysConfig);
  const notifyMemoChanged = useGlobalStore((state) => state.notifyMemoChanged);

  const [userShow, setUserShow] = useState(false);
  const [emojiShow, setEmojiShow] = useState(false);

  const [formState, setFormState] = useState({
    content: '',
    username: '',
    qq: '',
  });

  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('localCommentUserinfo');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormState((prev) => ({
          ...prev,
          username: parsed.username || '',
          qq: parsed.qq || parsed.email || '',
        }));
      }
    } catch (e) {
      // ignore error
    }
  }, []);

  useEffect(() => {
    if (currentCommentBox !== pid) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setCurrentCommentBox('');
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [currentCommentBox, pid, setCurrentCommentBox]);

  if (currentCommentBox !== pid) return null;

  const doComment = async (token?: string) => {
    if (!userinfo.token) {
      localStorage.setItem(
        'localCommentUserinfo',
        JSON.stringify({
          username: formState.username,
          qq: formState.qq,
        })
      );
    }

    if (sysConfig.maxCommentLength && formState.content.length > sysConfig.maxCommentLength) {
      toast.error(`评论字数超过限制长度: ${sysConfig.maxCommentLength}`);
      return;
    }

    let formattedEmail = formState.qq.trim();
    if (formattedEmail && !formattedEmail.includes('@')) {
      formattedEmail = `${formattedEmail}@qq.com`;
    }

    try {
      await useMyFetch('/comment/add', {
        memoId,
        replyTo,
        replyEmail,
        content: formState.content,
        username: formState.username,
        email: formattedEmail,
        token,
      });

      toast.success('评论成功!');
      setCurrentCommentBox('');
      setFormState((prev) => ({ ...prev, content: '' }));
      notifyMemoChanged(memoId);
    } catch (err: any) {
      toast.error(err?.message || '评论提交失败');
    }
  };

  const handleComment = async () => {
    if (!formState.content.trim()) {
      toast.error('请输入评论内容');
      return;
    }

    if (sysConfig.enableGoogleRecaptcha && typeof grecaptcha !== 'undefined') {
      grecaptcha.ready(() => {
        grecaptcha
          .execute(sysConfig.googleSiteKey, { action: 'newComment' })
          .then(async (token: string) => {
            await doComment(token);
          });
      });
    } else {
      await doComment();
    }
  };

  const emojiSelected = (emoji: string) => {
    setFormState((prev) => ({ ...prev, content: prev.content + emoji }));
  };

  return (
    <div ref={boxRef} className="px-4 py-2 flex flex-col gap-2 mt-2 border-t border-neutral-100 dark:border-neutral-800">
      <div className="relative">
        <textarea
          rows={4}
          autoFocus
          placeholder={replyTo ? `回复给 ${replyTo}` : '发表评论...'}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-neutral-800"
          value={formState.content}
          onChange={(e) => setFormState({ ...formState, content: e.target.value })}
        />
        <div className="flex items-center gap-2 absolute right-3 bottom-2">
          {!userinfo.token && (
            <User
              className="text-sky-500 w-5 h-5 cursor-pointer hover:opacity-80"
              onClick={() => setUserShow(!userShow)}
            />
          )}
          <Smile
            className="text-sky-500 w-5 h-5 cursor-pointer hover:opacity-80 select-none"
            onClick={() => setEmojiShow(!emojiShow)}
          />
          <Button size="sm" variant="outline" className="text-xs h-7 px-3" onClick={handleComment}>
            发送
          </Button>
        </div>
      </div>

      {emojiShow && <Emoji onSelected={emojiSelected} />}

      {userShow && !userinfo.token && (
        <div className="flex gap-2 mt-1.5">
          <Input
            className="h-8 text-xs rounded bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 focus-visible:ring-1 focus-visible:ring-sky-500 shadow-2xs"
            placeholder="昵称"
            value={formState.username}
            onChange={(e) => setFormState({ ...formState, username: e.target.value })}
          />
          <Input
            className="h-8 text-xs rounded bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 focus-visible:ring-1 focus-visible:ring-sky-500 shadow-2xs"
            placeholder="QQ号"
            value={formState.qq}
            onChange={(e) => setFormState({ ...formState, qq: e.target.value })}
          />
        </div>
      )}
    </div>
  );
};
