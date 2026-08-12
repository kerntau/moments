import React from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  Camera,
  Search,
  Users,
  Settings,
  User,
  LogOut,
  Sun,
  MoonStar,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-none shadow-xl">
        {userinfo.token && (
          <div
            className="flex flex-col items-center p-4 pt-6 text-gray-700 dark:text-white cursor-pointer"
            onClick={() => handleNavigate('/new')}
            title="发表"
          >
            <span className="flex items-center bg-gray-200/75 dark:bg-gray-800/75 p-3 rounded-full hover:bg-gray-300 transition">
              <Camera className="w-7 h-7" />
            </span>
            <span className="text-sm mt-1">发表</span>
          </div>
        )}
        <div className="flex items-center justify-center flex-wrap gap-4 p-4 text-gray-700 dark:text-white min-h-[100px]">
          <div
            className="flex flex-col items-center gap-1 cursor-pointer"
            onClick={toggleMode}
          >
            <span className="flex items-center bg-gray-200/75 dark:bg-gray-800/75 p-3 rounded-full">
              {isDark ? (
                <Sun className="w-6 h-6 text-yellow-400" />
              ) : (
                <MoonStar className="w-6 h-6 text-yellow-400" />
              )}
            </span>
            <span className="text-sm mt-1">
              {isDark ? '暗色' : '亮色'}
            </span>
          </div>

          {path !== '/user/calendar' && userinfo.token && (
            <div
              className="flex flex-col items-center cursor-pointer"
              onClick={() => handleNavigate('/user/calendar')}
              title="日历检索"
            >
              <span className="flex items-center bg-gray-200/75 dark:bg-gray-800/75 p-3 rounded-full">
                <Search className="w-6 h-6" />
              </span>
              <span className="text-sm mt-1">检索</span>
            </div>
          )}

          {path === '/' && (
            <div
              className="flex flex-col items-center cursor-pointer"
              onClick={() => handleNavigate('/friend')}
              title="友情链接"
            >
              <span className="flex items-center bg-gray-200/75 dark:bg-gray-800/75 p-3 rounded-full">
                <Users className="w-6 h-6" />
              </span>
              <span className="text-sm mt-1">友链</span>
            </div>
          )}

          {path !== '/sys/settings' && userinfo.id === 1 && (
            <div
              className="flex flex-col items-center cursor-pointer"
              onClick={() => handleNavigate('/sys/settings')}
              title="系统设置"
            >
              <span className="flex items-center bg-gray-200/75 dark:bg-gray-800/75 p-3 rounded-full">
                <Settings className="w-6 h-6" />
              </span>
              <span className="text-sm mt-1">系统</span>
            </div>
          )}

          {path !== '/user/settings' && userinfo.token && (
            <div
              className="flex flex-col items-center cursor-pointer"
              onClick={() => handleNavigate('/user/settings')}
              title="用户中心"
            >
              <span className="flex items-center bg-gray-200/75 dark:bg-gray-800/75 p-3 rounded-full">
                <User className="w-6 h-6" />
              </span>
              <span className="text-sm mt-1">用户</span>
            </div>
          )}

          {path === '/user/settings' && userinfo.token && (
            <div
              className="flex flex-col items-center cursor-pointer"
              title="登出"
              onClick={logout}
            >
              <span className="flex items-center bg-gray-200/75 dark:bg-gray-800/75 p-3 rounded-full">
                <LogOut className="w-6 h-6 text-red-500" />
              </span>
              <span className="text-sm mt-1">退出</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
