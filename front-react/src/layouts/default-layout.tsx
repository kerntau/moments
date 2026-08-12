import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { ArrowUp, Camera, LayoutGrid, LogIn } from 'lucide-react';
import { Footer } from '@/components/footer';
import { MobileNav } from '@/components/mobile-nav';
import { useGlobalStore } from '@/store';
import { useMyFetch } from '@/lib/api';
import type { SysConfigVO, UserVO } from '@/types';

interface DefaultLayoutProps {
  children: React.ReactNode;
}

export const DefaultLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  const location = useLocation();
  const userinfo = useGlobalStore((state) => state.userinfo);
  const setCurrentUser = useGlobalStore((state) => state.setCurrentUser);
  const setSysConfig = useGlobalStore((state) => state.setSysConfig);
  const setSidebarOpen = useGlobalStore((state) => state.setSidebarOpen);

  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const initLayoutData = async () => {
      try {
        const [profile, sysConfig] = await Promise.all([
          useMyFetch<UserVO>('/user/profile'),
          useMyFetch<SysConfigVO>('/sysConfig/get'),
        ]);

        if (profile) setCurrentUser(profile);
        if (sysConfig) {
          setSysConfig(sysConfig);

          // 设置页面标题与 Favicon
          if (sysConfig.title) {
            document.title = sysConfig.title;
          }
          if (sysConfig.favicon) {
            let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'shortcut icon';
              document.head.appendChild(link);
            }
            link.href = sysConfig.favicon;
          }

          // 注入自定义 CSS
          if (sysConfig.css) {
            let styleEl = document.getElementById('custom-sys-css');
            if (!styleEl) {
              styleEl = document.createElement('style');
              styleEl.id = 'custom-sys-css';
              document.head.appendChild(styleEl);
            }
            styleEl.innerHTML = sysConfig.css;
          }

          // 注入 Google reCAPTCHA 脚本
          if (sysConfig.enableGoogleRecaptcha && sysConfig.googleSiteKey) {
            const scriptId = 'recaptcha-script';
            if (!document.getElementById(scriptId)) {
              const script = document.createElement('script');
              script.id = scriptId;
              script.src = `https://recaptcha.net/recaptcha/api.js?render=${sysConfig.googleSiteKey}`;
              script.async = true;
              script.defer = true;
              document.head.appendChild(script);
            }
          }
        }
      } catch (err) {
        console.error('初始化页面基础配置失败:', err);
      }
    };

    initLayoutData();
  }, [setCurrentUser, setSysConfig]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 transition-colors">
      <div className="w-full md:w-[567px] mx-auto min-h-screen shadow-2xl bg-white dark:bg-neutral-800 relative">
        {children}
        <Footer />
      </div>

      {/* 桌面端回到顶部 */}
      {scrollY > 200 && (
        <div
          title="到顶部"
          onClick={scrollToTop}
          className="hidden sm:flex fixed bottom-[20%] right-[10%] lg:right-[15%] xl:right-[20%] 2xl:right-[28%] items-center justify-center bg-white/80 dark:bg-neutral-800/80 p-3 rounded-full shadow-lg border border-neutral-200 dark:border-neutral-700 cursor-pointer hover:opacity-80 transition"
        >
          <ArrowUp className="w-6 h-6 text-neutral-600 dark:text-neutral-300" />
        </div>
      )}

        {/* 移动端右下角悬浮展开菜单 */}
        <MobileNav />
      </div>
  );
};
