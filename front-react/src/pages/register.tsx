import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGlobalStore } from '@/store';
import { useMyFetch } from '@/lib/api';
import type { UserVO } from '@/types';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useGlobalStore((state) => state.currentUser as UserVO);
  const sysConfig = useGlobalStore((state) => state.sysConfig);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (sysConfig && sysConfig.enableRegister === false) {
      navigate('/');
    }
  }, [sysConfig, navigate]);

  const doReg = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (username.length < 3) {
      toast.warning('用户名最少3个字符');
      return;
    }
    if (password !== repeatPassword) {
      toast.warning('两次输入的密码不一致');
      return;
    }

    setPending(true);
    try {
      await useMyFetch('/user/reg', { username, password, repeatPassword });
      toast.success('注册成功,快去登录吧!');
      navigate('/user/login');
    } catch (err: any) {
      toast.error(err?.message || '注册失败');
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      {currentUser && <Header user={currentUser} />}
      <div className="pb-20">
        <div className="w-[85%] max-w-[420px] mx-auto mt-12 sm:mt-16 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl space-y-6">
          <p className="text-center text-2xl font-bold text-neutral-800 dark:text-neutral-100">注册用户</p>
          <form className="space-y-4" onSubmit={doReg}>
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
            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">重复密码</label>
              <Input
                type="password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                placeholder="请再次输入密码"
                required
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                disabled={pending}
                className="flex-1 h-10 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium shadow-md shadow-sky-500/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                {pending ? '注册中...' : '注册'}
              </Button>
              <Link to="/user/login">
                <Button type="button" variant="outline">
                  去登录
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
