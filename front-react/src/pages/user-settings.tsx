import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileInput } from '@/components/ui/file-input';
import { useGlobalStore } from '@/store';
import { useMyFetch } from '@/lib/api';
import { useUpload } from '@/lib/upload';
import type { UserVO } from '@/types';

const OAUTH_PROVIDERS = [
  { id: 'github', name: 'GitHub' },
  { id: 'google', name: 'Google' },
];

const OAuthAccountBinding: React.FC = () => {
  const [boundMap, setBoundMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const loadBoundList = async () => {
    try {
      const res = await useMyFetch<Record<string, boolean>>('/oauth/bound');
      if (res) setBoundMap(res);
    } catch (e) {
      console.error('获取 OAuth 绑定列表失败:', e);
    }
  };

  useEffect(() => {
    loadBoundList();
  }, []);

  const handleBind = async (provider: string) => {
    try {
      const res = await useMyFetch<{ url: string }>(`/oauth/${provider}/redirect`);
      if (res && res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      toast.error(err?.message || '获取绑定链接失败');
    }
  };

  const handleUnbind = async (provider: string) => {
    setLoading(true);
    try {
      await useMyFetch('/oauth/unbind', { provider });
      toast.success('解绑成功');
      loadBoundList();
    } catch (err: any) {
      toast.error(err?.message || '解绑失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-2">
      <label className="font-bold text-xs text-neutral-700 dark:text-neutral-300 mb-2 block">第三方社交账号绑定</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {OAUTH_PROVIDERS.map((p) => {
          const isBound = Boolean(boundMap[p.id]);
          return (
            <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-700/80 bg-neutral-50/50 dark:bg-neutral-800/40">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{p.name}</span>
              {isBound ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">已绑定</span>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleUnbind(p.id)}
                    className="text-xs text-rose-500 hover:underline"
                  >
                    解绑
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleBind(p.id)}
                  className="text-xs font-medium text-sky-500 hover:underline"
                >
                  去绑定
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const UserSettingsPage: React.FC = () => {
  const currentUser = useGlobalStore((state) => state.currentUser as UserVO);
  const setCurrentUser = useGlobalStore((state) => state.setCurrentUser);

  const [formState, setFormState] = useState({
    password: '',
    username: '',
    nickname: '',
    slogan: '',
    avatarUrl: '',
    coverUrl: '',
    email: '',
    css: '',
    js: '',
  });

  useEffect(() => {
    if (currentUser) {
      setFormState((prev) => ({
        ...prev,
        username: currentUser.username || '',
        nickname: currentUser.nickname || '',
        slogan: currentUser.slogan || '',
        avatarUrl: currentUser.avatarUrl || '',
        coverUrl: currentUser.coverUrl || '',
        email: currentUser.email || '',
      }));
    }
  }, [currentUser]);

  const save = async () => {
    try {
      await useMyFetch('/user/saveProfile', formState);
      toast.success('保存成功');
      const updatedProfile = await useMyFetch<UserVO>('/user/profile');
      if (updatedProfile) setCurrentUser(updatedProfile);
    } catch (err: any) {
      toast.error(err?.message || '保存个人设置失败');
    }
  };

  const uploadAvatarUrl = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      if (!files[i].type.includes('image')) {
        toast.error('只能上传图片');
        return;
      }
    }

    try {
      const result = await useUpload(files);
      if (result && result.length) {
        toast.success('上传成功');
        setFormState((prev) => ({ ...prev, avatarUrl: result[0] }));
      }
    } catch (err: any) {
      toast.error(err?.message || '上传头像失败');
    }
  };

  const uploadCoverUrl = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      if (!files[i].type.includes('image')) {
        toast.error('只能上传图片');
        return;
      }
    }

    try {
      const result = await useUpload(files);
      if (result && result.length) {
        toast.success('上传成功');
        setFormState((prev) => ({ ...prev, coverUrl: result[0] }));
      }
    } catch (err: any) {
      toast.error(err?.message || '上传封面失败');
    }
  };

  return (
    <>
      <Header user={currentUser} />
      <div className="space-y-4 flex flex-col p-4 my-4 dark:bg-neutral-800 bg-white min-h-[400px]">
        <div>
          <label className="font-bold text-xs text-neutral-700 dark:text-neutral-300 mb-1 block">头像</label>
          <FileInput
            accept="image/*"
            onChange={uploadAvatarUrl}
            urlValue={formState.avatarUrl}
            onUrlChange={(v) => setFormState({ ...formState, avatarUrl: v })}
            urlPlaceholder="上传或输入在线地址"
            previewSrc={formState.avatarUrl}
            previewClassName="rounded-full"
          />
        </div>

        <div>
          <label className="font-bold text-xs text-neutral-700 dark:text-neutral-300 mb-1 block">顶部图片</label>
          <FileInput
            accept="image/*"
            onChange={uploadCoverUrl}
            urlValue={formState.coverUrl}
            onUrlChange={(v) => setFormState({ ...formState, coverUrl: v })}
            urlPlaceholder="上传或输入在线地址"
          />
          {formState.coverUrl && (
            <img src={formState.coverUrl} className="w-full max-h-36 rounded-md object-cover border border-neutral-200 dark:border-neutral-700 mt-2" alt="Cover" />
          )}
        </div>

        <div>
          <label className="font-bold text-xs text-neutral-700 dark:text-neutral-300 mb-1 block">登录名</label>
          <Input value={formState.username} disabled className="bg-neutral-100 dark:bg-neutral-900" />
        </div>

        <div>
          <label className="font-bold text-xs text-neutral-700 dark:text-neutral-300 mb-1 block">昵称</label>
          <Input
            value={formState.nickname}
            onChange={(e) => setFormState({ ...formState, nickname: e.target.value })}
          />
        </div>

        <div>
          <label className="font-bold text-xs text-neutral-700 dark:text-neutral-300 mb-1 block">心情状态</label>
          <Input
            value={formState.slogan}
            onChange={(e) => setFormState({ ...formState, slogan: e.target.value })}
          />
        </div>

        <div>
          <label className="font-bold text-xs text-neutral-700 dark:text-neutral-300 mb-1 block">密码</label>
          <Input
            type="password"
            placeholder="留空则不修改密码"
            value={formState.password}
            onChange={(e) => setFormState({ ...formState, password: e.target.value })}
          />
        </div>

        <div>
          <label className="font-bold text-xs text-neutral-700 dark:text-neutral-300 mb-1 block">邮箱</label>
          <Input
            type="email"
            placeholder="若管理员启用了邮件通知，将在收到评论时发送邮件通知"
            value={formState.email}
            onChange={(e) => setFormState({ ...formState, email: e.target.value })}
          />
        </div>

        {/* 社交账号绑定管理 */}
        <OAuthAccountBinding />

        <Button className="justify-center bg-[#9fc84a] hover:bg-[#8eb83f] mt-4" onClick={save}>
          保存
        </Button>
      </div>
    </>
  );
};
