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
    <div className="header relative mb-14">
      {path !== '/' && !path.includes('/memo/') && (
        <div
          className={`flex fixed justify-between items-center p-4 w-full md:w-[567px] text-white top-0 z-30 transition-colors duration-200 ${
            scrollY > 100 ? 'bg-[#4c4c4c]/80' : ''
          }`}
        >
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')} title="返回主页">
            <ChevronLeft className="w-5 h-5 mr-4" />
            {path === '/user/calendar' && <span>日历检索</span>}
            {path === '/sys/settings' && <span>系统设置</span>}
            {path === '/user/settings' && <span>用户中心</span>}
            {path.includes('/tags/') && <span>{params.tag || '话题专栏'}</span>}
            {path === '/friend' && <span>友情链接</span>}
            {path !== '/user/calendar' &&
              path !== '/sys/settings' &&
              path !== '/user/settings' &&
              !path.includes('/tags/') &&
              path !== '/friend' && (
                <span>
                  {!userinfo.token && path === '/user/login' && '登录'}
                  {(userinfo.token || path !== '/user/login') &&
                    `${user.nickname || ''} 的空间`}
                </span>
              )}
          </div>
          {path === '/user/settings' && userinfo.token && (
            <div className="hidden sm:flex" title="登出" onClick={logout}>
              <LogOut className="w-5 h-5 cursor-pointer" />
            </div>
          )}
          {path === '/friend' && userinfo.id === 1 && (
            <div className="flex" title="添加友链">
              <Plus className="w-6 h-6 cursor-pointer" onClick={onAddFriend} />
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
            {userinfo.id === 1 && (
              <span title="系统设置" onClick={() => navigate('/sys/settings')}>
                <Settings className="text-sky-500 w-5 h-5 cursor-pointer" />
              </span>
            )}
            <span title="个人设置" onClick={() => navigate('/user/settings')}>
              <User className="text-sky-500 w-5 h-5 cursor-pointer" />
            </span>
          </>
        ) : (
          <span title="登录" onClick={() => navigate('/user/login')}>
            <LogIn className="text-sky-500 w-5 h-5 cursor-pointer" />
          </span>
        )}
      </div>

      {/* 封面图 */}
      <img
        className="header-img w-full object-cover h-[220px]"
        src={user.coverUrl || '/cover.webp'}
        alt="cover"
      />

      {/* 用户个人信息与头像（浮动覆盖于封面图右下角） */}
      <div className="absolute right-2" style={{ bottom: '-40px' }}>
        <div className="userinfo flex flex-col items-end">
          <div className="flex flex-row items-center gap-3 justify-end">
            <div className="username text-lg font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              {user.nickname}
            </div>
            <img
              src={user.avatarUrl || '/avatar.webp'}
              style={{ width: '70px', height: '70px' }}
              className="avatar rounded-full object-cover shadow-md"
              alt="avatar"
            />
          </div>
          <div className="slogon text-neutral-500 dark:text-neutral-400 truncate w-full text-end text-xs mt-2">
            {user.slogan}
          </div>
        </div>
      </div>
    </div>
  );
};
