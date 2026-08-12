import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useMyFetch } from '@/lib/api';
import { useGlobalStore } from '@/store';

export const OAuthCallbackPage: React.FC = () => {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setUserinfo = useGlobalStore((state) => state.setUserinfo);
  const setCurrentUser = useGlobalStore((state) => state.setCurrentUser);

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code || !provider) {
      setStatus('error');
      setErrorMsg('缺少必要的授权 code 参数');
      return;
    }

    const doCallback = async () => {
      try {
        const res = await useMyFetch<any>(`/oauth/${provider}/callback`, {
          code,
        });

        if (res && res.token) {
          setUserinfo(res);
          setStatus('success');
          toast.success(`第三方登录成功，欢迎回来！`);
          
          // 获取最新用户信息
          try {
            const profile = await useMyFetch<any>('/user/profile');
            if (profile) setCurrentUser(profile);
          } catch (e) {
            console.error('更新用户信息失败:', e);
          }

          setTimeout(() => {
            window.location.href = '/';
          }, 800);
        } else {
          setStatus('error');
          setErrorMsg('获取登录令牌失败');
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err?.message || '授权验证失败，请重试');
      }
    };

    doCallback();
  }, [provider, searchParams, navigate, setCurrentUser]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4 select-none">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-800 rounded-3xl p-8 shadow-xl border border-neutral-100 dark:border-neutral-700/60 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95">
        {status === 'loading' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center text-sky-500 mb-1">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">正在验证授权...</h3>
            <p className="text-xs text-neutral-400">正在安全建立 {provider?.toUpperCase()} 登录令牌</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500 mb-1">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">登录授权成功</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">正在为您跳转至首页...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500 mb-1">
              <XCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">授权认证失败</h3>
            <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-2 text-xs font-semibold px-5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 transition"
            >
              返回首页
            </button>
          </>
        )}
      </div>
    </div>
  );
};
