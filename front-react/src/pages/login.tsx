import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGlobalStore } from '@/store';
import { useMyFetch } from '@/lib/api';
import type { LoginResp, UserVO } from '@/types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useGlobalStore((state) => state.currentUser as UserVO);
  const sysConfig = useGlobalStore((state) => state.sysConfig);
  const setUserinfo = useGlobalStore((state) => state.setUserinfo);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);

  const doLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPending(true);
    try {
      const res = await useMyFetch<LoginResp>('/user/login', { username, password });
      setUserinfo(res);
      toast.success('登录成功,跳转到首页...');
      window.location.href = '/';
    } catch (err: any) {
      toast.error(err?.message || '登录失败');
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {currentUser && <Header user={currentUser} />}
      <div className="pb-20">
        <div className="w-4/5 mx-auto mt-20 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl space-y-6">
          <p className="text-center text-2xl font-bold text-neutral-800 dark:text-neutral-100">登录</p>
          <form className="space-y-4" onSubmit={doLogin}>
            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">用户名</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">密码</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={pending} className="bg-[#9fc84a] hover:bg-[#8eb83f]">
                {pending ? '登录中...' : '登录'}
              </Button>
              {sysConfig.enableRegister && (
                <Link to="/user/reg">
                  <Button type="button" variant="outline">
                    去注册
                  </Button>
                </Link>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
