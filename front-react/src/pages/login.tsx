import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGlobalStore } from '@/store';
import { useMyFetch } from '@/lib/api';
import type { LoginResp, UserVO } from '@/types';
import {
  GithubIcon,
  GoogleIcon,
  QqIcon,
  WechatIcon,
  DouyinIcon,
  BilibiliIcon,
} from '@/components/oauth-icons';

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
              <Button
                type="submit"
                disabled={pending}
                className="w-full h-10 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium shadow-md shadow-sky-500/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                {pending ? '登录中...' : '登录'}
              </Button>
            </div>
          </form>

          {/* 第三方社交授权快捷登录入口 */}
          {sysConfig.enableOAuth && (sysConfig.enableGithubOAuth || sysConfig.enableGoogleOAuth) && (
            <div className="pt-5 border-t border-neutral-100 dark:border-neutral-800 flex flex-col items-center">
              <span className="text-xs text-neutral-400 font-medium mb-3">第三方社交账号快捷登录</span>
              <div className="flex items-center justify-center gap-4">
                {sysConfig.enableGithubOAuth && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await useMyFetch<any>('/oauth/github/redirect');
                        if (res?.url) window.location.href = res.url;
                      } catch (err: any) {
                        toast.error(err?.message || '获取 GitHub 授权失败');
                      }
                    }}
                    className="w-11 h-11 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-sm cursor-pointer"
                    title="GitHub 快捷登录"
                  >
                    <GithubIcon className="w-5.5 h-5.5" />
                  </button>
                )}

                {sysConfig.enableGoogleOAuth && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await useMyFetch<any>('/oauth/google/redirect');
                        if (res?.url) window.location.href = res.url;
                      } catch (err: any) {
                        toast.error(err?.message || '获取 Google 授权失败');
                      }
                    }}
                    className="w-11 h-11 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-sm cursor-pointer"
                    title="Google 快捷登录"
                  >
                    <GoogleIcon className="w-5.5 h-5.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
