import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGlobalStore } from '@/store';
import { useMyFetch } from '@/lib/api';
import { useUpload } from '@/lib/upload';
import type { UserVO } from '@/types';

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
          <Input type="file" accept="image/*" className="text-xs cursor-pointer" onChange={uploadAvatarUrl} />
          <div className="text-gray-500 text-xs my-2">或者输入在线地址</div>
          <Input
            value={formState.avatarUrl}
            onChange={(e) => setFormState({ ...formState, avatarUrl: e.target.value })}
            className="mb-2 text-xs"
          />
          {formState.avatarUrl && (
            <img src={formState.avatarUrl} className="w-16 h-16 rounded-full object-cover border" alt="Avatar" />
          )}
        </div>

        <div>
          <label className="font-bold text-xs text-neutral-700 dark:text-neutral-300 mb-1 block">顶部图片</label>
          <Input type="file" accept="image/*" className="text-xs cursor-pointer" onChange={uploadCoverUrl} />
          <div className="text-gray-500 text-xs my-2">或者输入在线地址</div>
          <Input
            value={formState.coverUrl}
            onChange={(e) => setFormState({ ...formState, coverUrl: e.target.value })}
            className="mb-2 text-xs"
          />
          {formState.coverUrl && (
            <img src={formState.coverUrl} className="w-full max-h-36 rounded object-cover border" alt="Cover" />
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

        <Button className="justify-center bg-[#9fc84a] hover:bg-[#8eb83f] mt-4" onClick={save}>
          保存
        </Button>
      </div>
    </>
  );
};
