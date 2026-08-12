import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useTheme } from 'next-themes';
import {
  Camera,
  Search,
  Users,
  Settings,
  User,
  LogOut,
  Sun,
  MoonStar,
  LayoutGrid,
  X,
  ArrowUp,
  LogIn,
} from 'lucide-react';
import { useGlobalStore } from '@/store';

export const MobileNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (theme || resolvedTheme) === 'dark';

  const open = useGlobalStore((state) => state.sidebarOpen);
  const setOpen = useGlobalStore((state) => state.setSidebarOpen);
  const userinfo = useGlobalStore((state) => state.userinfo);
  const setUserinfo = useGlobalStore((state) => state.setUserinfo);

  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const path = location.pathname;

  const toggleMode = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const handleNavigate = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  const logout = () => {
    setOpen(false);
    setUserinfo({});
    navigate('/');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showTopBtn = !open && scrollY > 200;

  return (
    <>
      {/* 菜单展开时的无感透明遮罩 */}
      {open && (
        <div
          className="sm:hidden fixed inset-0 z-40 bg-transparent"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 右下角悬浮控制区 */}
      <div className="sm:hidden fixed right-2.5 bottom-5 z-50 flex flex-col items-end gap-1.5">
        {/* 向上平滑竖向展开的功能列表 */}
        <div
          className={`flex flex-col items-end gap-1.5 transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] origin-bottom-right ${
            open
              ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 scale-90 translate-y-3 pointer-events-none'
          }`}
        >
          {/* 发表动态 */}
          {userinfo.token && path === '/' && (
            <div
              className="flex items-center gap-1.5 cursor-pointer group"
              onClick={() => handleNavigate('/new')}
            >
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm backdrop-blur-md transition group-hover:border-sky-400">
                发表动态
              </span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sky-500 text-white shadow-md shadow-sky-500/20 active:scale-90 transition-transform">
                <Camera className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* 外观切换 */}
          <div
            className="flex items-center gap-1.5 cursor-pointer group"
            onClick={toggleMode}
          >
            <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm backdrop-blur-md transition">
              {isDark ? '浅色外观' : '深色外观'}
            </span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-200 border border-neutral-200/70 dark:border-neutral-700/70 shadow-sm backdrop-blur-md active:scale-90 transition-transform">
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <MoonStar className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
              )}
            </div>
          </div>

          {/* 日历检索 */}
          {path !== '/user/calendar' && userinfo.token && (
            <div
              className="flex items-center gap-1.5 cursor-pointer group"
              onClick={() => handleNavigate('/user/calendar')}
            >
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm backdrop-blur-md transition">
                日历检索
              </span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-200 border border-neutral-200/70 dark:border-neutral-700/70 shadow-sm backdrop-blur-md active:scale-90 transition-transform">
                <Search className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* 友情链接 */}
          {path === '/' && (
            <div
              className="flex items-center gap-1.5 cursor-pointer group"
              onClick={() => handleNavigate('/friend')}
            >
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm backdrop-blur-md transition">
                友情链接
              </span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-200 border border-neutral-200/70 dark:border-neutral-700/70 shadow-sm backdrop-blur-md active:scale-90 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* 系统设置 */}
          {path !== '/sys/settings' && userinfo.id === 1 && (
            <div
              className="flex items-center gap-1.5 cursor-pointer group"
              onClick={() => handleNavigate('/sys/settings')}
            >
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm backdrop-blur-md transition">
                系统设置
              </span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-200 border border-neutral-200/70 dark:border-neutral-700/70 shadow-sm backdrop-blur-md active:scale-90 transition-transform">
                <Settings className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* 用户中心 */}
          {path !== '/user/settings' && userinfo.token && (
            <div
              className="flex items-center gap-1.5 cursor-pointer group"
              onClick={() => handleNavigate('/user/settings')}
            >
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm backdrop-blur-md transition">
                用户中心
              </span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-200 border border-neutral-200/70 dark:border-neutral-700/70 shadow-sm backdrop-blur-md active:scale-90 transition-transform">
                <User className="w-4 h-4 text-sky-500" />
              </div>
            </div>
          )}

          {/* 登录按钮（未登录时） */}
          {!userinfo.token && path === '/' && (
            <div
              className="flex items-center gap-1.5 cursor-pointer group"
              onClick={() => handleNavigate('/user/login')}
            >
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm backdrop-blur-md transition">
                登录账号
              </span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sky-500 text-white shadow-md active:scale-90 transition-transform">
                <LogIn className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* 退出登录 */}
          {path === '/user/settings' && userinfo.token && (
            <div
              className="flex items-center gap-1.5 cursor-pointer group"
              onClick={logout}
            >
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-white/90 dark:bg-neutral-800/90 text-red-500 border border-red-200/60 dark:border-red-900/40 shadow-sm backdrop-blur-md transition">
                退出登录
              </span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/90 dark:bg-neutral-800/90 text-red-500 border border-red-200/70 dark:border-red-900/50 shadow-sm backdrop-blur-md active:scale-90 transition-transform">
                <LogOut className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>

        {/* 回到顶部按钮 (平滑风琴淡入淡出动效) */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showTopBtn ? 'max-h-8 opacity-100 scale-100' : 'max-h-0 opacity-0 scale-75 pointer-events-none'
          }`}
        >
          <button
            onClick={scrollToTop}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/90 dark:bg-neutral-800/90 text-neutral-600 dark:text-neutral-300 border border-neutral-200/70 dark:border-neutral-700/70 shadow-sm backdrop-blur-md active:scale-90 transition-all duration-200 cursor-pointer"
            title="回到顶部"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

        {/* 快捷菜单主开关按钮 (带 rotate-90 连贯平滑翻转) */}
        <button
          onClick={() => setOpen(!open)}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-200 border border-neutral-200/70 dark:border-neutral-700/70 shadow-sm backdrop-blur-md active:scale-90 transition-all duration-200 cursor-pointer"
          title={open ? '关闭菜单' : '展开菜单'}
        >
          <div className={`transition-transform duration-300 ${open ? 'rotate-90 scale-110' : 'rotate-0 scale-100'}`}>
            {open ? (
              <X className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            ) : (
              <LayoutGrid className="w-4 h-4" />
            )}
          </div>
        </button>
      </div>
    </>
  );
};
