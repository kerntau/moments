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

  const applySysConfigToDom = (config: SysConfigVO) => {
    if (config.title) {
      document.title = config.title;
    }
    if (config.favicon) {
      const existingLinks = document.querySelectorAll("link[rel*='icon']");
      existingLinks.forEach((el) => el.parentNode?.removeChild(el));

      const link = document.createElement('link');
      link.rel = 'icon';

      const lowerUrl = config.favicon.toLowerCase();
      if (lowerUrl.endsWith('.ico')) {
        link.type = 'image/x-icon';
      } else if (lowerUrl.endsWith('.png')) {
        link.type = 'image/png';
      } else if (lowerUrl.endsWith('.svg')) {
        link.type = 'image/svg+xml';
      } else if (lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg')) {
        link.type = 'image/jpeg';
      } else if (lowerUrl.endsWith('.gif')) {
        link.type = 'image/gif';
      }

      link.href = config.favicon;
      document.head.appendChild(link);
    }

    if (config.css) {
      let styleEl = document.getElementById('custom-sys-css');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'custom-sys-css';
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = config.css;
    }

    // 注入 Google reCAPTCHA 脚本
    if (config.enableGoogleRecaptcha && config.googleSiteKey) {
      const scriptId = 'recaptcha-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://recaptcha.net/recaptcha/api.js?render=${config.googleSiteKey}`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }
  };

  useEffect(() => {
    // 1. 优先读取 localStorage 瞬时缓存，1毫秒内完成标题与 Icon 设定，防止刷新闪烁
    const cacheStr = localStorage.getItem('sys_config_cache');
    if (cacheStr) {
      try {
        const cachedSysConfig: SysConfigVO = JSON.parse(cacheStr);
        setSysConfig(cachedSysConfig);
        applySysConfigToDom(cachedSysConfig);
      } catch (e) {}
    }

    const initLayoutData = async () => {
      try {
        const [profile, sysConfig] = await Promise.all([
          useMyFetch<UserVO>('/user/profile'),
          useMyFetch<SysConfigVO>('/sysConfig/get'),
        ]);

        if (profile) setCurrentUser(profile);
        if (sysConfig) {
          setSysConfig(sysConfig);
          localStorage.setItem('sys_config_cache', JSON.stringify(sysConfig));
          applySysConfigToDom(sysConfig);
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
