import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useMyFetch } from '@/lib/api';

const OAUTH_PROVIDERS = [
  { id: 'github', name: 'GitHub' },
  { id: 'google', name: 'Google' },
];

interface OAuthAccountBindingProps {
  title?: string;
  className?: string;
}

export const OAuthAccountBinding: React.FC<OAuthAccountBindingProps> = ({
  title = '第三方社交账号绑定',
  className = 'pt-2',
}) => {
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
    <div className={className}>
      {title && (
        <label className="font-bold text-xs text-neutral-700 dark:text-neutral-300 mb-2 block">
          {title}
        </label>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {OAUTH_PROVIDERS.map((p) => {
          const isBound = Boolean(boundMap[p.id]);
          return (
            <div
              key={p.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-700/80 bg-neutral-50/50 dark:bg-neutral-800/40"
            >
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {p.name}
              </span>
              {isBound ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                    已绑定
                  </span>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleUnbind(p.id)}
                    className="text-xs text-rose-500 hover:underline cursor-pointer"
                  >
                    解绑
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleBind(p.id)}
                  className="text-xs font-medium text-sky-500 hover:underline cursor-pointer"
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
