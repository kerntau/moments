import React, { useState, useEffect } from 'react';
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
    website: '',
    email: '',
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('localCommentUserinfo');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormState((prev) => ({
          ...prev,
          username: parsed.username || '',
          website: parsed.website || '',
          email: parsed.email || '',
        }));
      }
    } catch (e) {
      // ignore error
    }
  }, []);

  if (currentCommentBox !== pid) return null;

  const doComment = async (token?: string) => {
    if (!userinfo.token) {
      localStorage.setItem(
        'localCommentUserinfo',
        JSON.stringify({
          username: formState.username,
          website: formState.website,
          email: formState.email,
        })
      );
    }

    if (sysConfig.maxCommentLength && formState.content.length > sysConfig.maxCommentLength) {
      toast.error(`评论字数超过限制长度: ${sysConfig.maxCommentLength}`);
      return;
    }

    try {
      await useMyFetch('/comment/add', {
        memoId,
        replyTo,
        replyEmail,
        content: formState.content,
        username: formState.username,
        website: formState.website,
        email: formState.email,
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
    <div className="px-4 py-2 flex flex-col gap-2 mt-2 border-t border-neutral-100 dark:border-neutral-800">
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
              className="text-[#9fc84a] w-5 h-5 cursor-pointer hover:opacity-80"
              onClick={() => setUserShow(!userShow)}
            />
          )}
          <Smile
            className="text-[#9fc84a] w-5 h-5 cursor-pointer hover:opacity-80 select-none"
            onClick={() => setEmojiShow(!emojiShow)}
          />
          <Button size="sm" variant="outline" className="text-xs h-7 px-3" onClick={handleComment}>
            发送
          </Button>
        </div>
      </div>

      {emojiShow && <Emoji onSelected={emojiSelected} />}

      {userShow && !userinfo.token && (
        <div className="flex gap-2 mt-1">
          <Input
            placeholder="姓名"
            value={formState.username}
            onChange={(e) => setFormState({ ...formState, username: e.target.value })}
          />
          <Input
            placeholder="网站"
            value={formState.website}
            onChange={(e) => setFormState({ ...formState, website: e.target.value })}
          />
          <Input
            placeholder="邮箱"
            value={formState.email}
            onChange={(e) => setFormState({ ...formState, email: e.target.value })}
          />
        </div>
      )}
    </div>
  );
};
