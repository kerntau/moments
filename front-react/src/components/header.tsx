import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  ChevronLeft,
  LogOut,
  Plus,
  Camera,
  Search,
  Users,
  Settings,
  User,
  LogIn,
  Sun,
  MoonStar,
} from 'lucide-react';
import type { UserVO } from '@/types';
import { useGlobalStore } from '@/store';

interface HeaderProps {
  user: UserVO;
  onAddFriend?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onAddFriend }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (theme || resolvedTheme) === 'dark';

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

  if (path === '/new' || path.includes('/edit/')) {
    return null;
  }

  const logout = () => {
    setUserinfo({});
    navigate('/');
  };

  const toggleMode = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <div className="header relative">
      {path !== '/' && !path.includes('/memo/') && (
        <div
          className={`flex fixed justify-between items-center px-4 py-3.5 w-full md:w-[567px] top-0 z-30 transition-all duration-300 backdrop-blur-md border-b ${
            scrollY > 20
              ? 'bg-white/85 dark:bg-neutral-900/85 border-neutral-200/80 dark:border-neutral-800/80 shadow-sm text-neutral-900 dark:text-neutral-100'
              : 'bg-white/70 dark:bg-neutral-900/70 border-neutral-200/40 dark:border-neutral-800/40 text-neutral-800 dark:text-neutral-200'
          }`}
        >
          <div className="flex items-center gap-1.5 cursor-pointer font-bold text-sm tracking-tight" onClick={() => navigate('/')} title="返回主页">
            <div className="p-1 rounded-full hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition">
              <ChevronLeft className="w-5 h-5 text-neutral-700 dark:text-neutral-200" />
            </div>
            {path === '/user/calendar' && <span>日历检索</span>}
            {path === '/sys/settings' && <span>系统设置</span>}
            {path.includes('/tags/') && <span>{params.tag || '话题专栏'}</span>}
            {path === '/friend' && <span>友情链接</span>}
            {path !== '/user/calendar' &&
              path !== '/sys/settings' &&
              !path.includes('/tags/') &&
              path !== '/friend' && (
                <span>
                  {!userinfo.token && path === '/user/login' && '登录'}
                  {(userinfo.token || path !== '/user/login') &&
                    `${user.nickname || ''} 的空间`}
                </span>
              )}
          </div>
          {path === '/sys/settings' && userinfo.token && (
            <div className="hidden sm:flex p-1.5 rounded-full hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition text-neutral-600 dark:text-neutral-300" title="登出" onClick={logout}>
              <LogOut className="w-4 h-4 cursor-pointer" />
            </div>
          )}
          {path === '/friend' && userinfo.id === 1 && (
            <div className="flex p-1.5 rounded-full hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition text-neutral-700 dark:text-neutral-200" title="添加友链">
              <Plus className="w-5 h-5 cursor-pointer" onClick={onAddFriend} />
            </div>
          )}
        </div>
      )}

      {/* 桌面端右侧固定工具按钮 */}
      <div className="hidden sm:flex sm:absolute sm:-right-10 sm:top-0 sm:rounded sm:p-2 sm:flex-col sm:w-fit sm:shadow bg-white dark:bg-neutral-800 gap-2 z-20">
        <span title={isDark ? '切换亮色模式' : '切换暗色模式'}>
          {isDark ? (
            <Sun
              className="w-5 h-5 cursor-pointer text-yellow-400"
              onClick={toggleMode}
            />
          ) : (
            <MoonStar
              className="w-5 h-5 cursor-pointer text-yellow-400"
              onClick={toggleMode}
            />
          )}
        </span>

        {userinfo.token ? (
          <>
            <Link to="/new" title="发表">
              <Camera className="text-sky-500 w-5 h-5 cursor-pointer" />
            </Link>
            <span title="检索" onClick={() => navigate('/user/calendar')}>
              <Search className="text-sky-500 w-5 h-5 cursor-pointer" />
            </span>
            <span title="友链" onClick={() => navigate('/friend')}>
              <Users className="text-sky-500 w-5 h-5 cursor-pointer" />
            </span>
            <span title="系统设置" onClick={() => navigate('/sys/settings')}>
              <Settings className="text-sky-500 w-5 h-5 cursor-pointer" />
            </span>
          </>
        ) : (
          <span title="登录" onClick={() => navigate('/user/login')}>
            <LogIn className="text-sky-500 w-5 h-5 cursor-pointer" />
          </span>
        )}
      </div>

      {/* 封面图与头像区域 */}
      <div className="relative h-[190px] sm:h-[220px]">
        <img
          className="w-full h-full object-cover"
          src={user.coverUrl || '/cover.webp'}
          alt="cover"
        />

        {/* 昵称：位于封面图右下角 */}
        <div className="absolute right-[92px] sm:right-[104px] bottom-3.5 font-semibold text-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.85)] text-[16px] sm:text-[17px] select-none">
          {user.nickname}
        </div>

        {/* 头像：跨越封面图底部界线 */}
        <div className="absolute right-3.5 sm:right-4 -bottom-8 w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] rounded-[10px] overflow-hidden border-2 border-white dark:border-neutral-800 bg-white dark:bg-neutral-800 shadow-md flex-shrink-0 z-10">
          <img
            src={user.avatarUrl || '/avatar.webp'}
            className="w-full h-full object-cover"
            alt="avatar"
          />
        </div>
      </div>

      {/* 头像下方的签名 / slogan 区域（亮色白底，暗色暗底） */}
      <div className="pt-9 pb-3 px-4 flex justify-end min-h-[48px]">
        {user.slogan && (
          <div className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-[13px] font-normal text-right max-w-[260px] sm:max-w-xs break-words">
            {user.slogan}
          </div>
        )}
      </div>
    </div>
  );
};
