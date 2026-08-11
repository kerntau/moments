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
  const { theme, setTheme } = useTheme();

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
    if (theme === 'system') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('system');
      toast.success('显示模式将跟随系统设置');
    }
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
                  {!userinfo.token && path === '/user/reg' && '注册'}
                  {(userinfo.token || (path !== '/user/login' && path !== '/user/reg')) &&
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

      {/* 右侧悬浮/工具按钮 */}
      <div className="dark:bg-neutral-800 hidden sm:flex sm:absolute sm:-right-10 sm:rounded sm:p-2 sm:flex-col sm:w-fit justify-end shadow w-full flex-row top-0 p-1 gap-2 bg-white z-20">
        {theme === 'dark' ? (
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

        {userinfo.token && (
          <Link to="/new" title="发表">
            <Camera className="text-[#9fc84a] w-5 h-5 cursor-pointer" />
          </Link>
        )}
        {path !== '/user/calendar' && userinfo.token && (
          <Link to="/user/calendar" title="日历检索">
            <Search className="text-[#9fc84a] w-5 h-5 cursor-pointer" />
          </Link>
        )}
        {path === '/' && (
          <Link to="/friend" title="友情链接">
            <Users className="text-[#9fc84a] w-5 h-5 cursor-pointer" />
          </Link>
        )}
        {path !== '/sys/settings' && userinfo.id === 1 && (
          <Link to="/sys/settings" title="系统设置">
            <Settings className="text-[#9fc84a] w-5 h-5 cursor-pointer" />
          </Link>
        )}
        {path !== '/user/settings' && userinfo.token && (
          <Link to="/user/settings" title="用户中心">
            <User className="text-[#9fc84a] w-5 h-5 cursor-pointer" />
          </Link>
        )}
        {!userinfo.token && (
          <Link to="/user/login" title="登录">
            <LogIn className="text-[#9fc84a] w-5 h-5 cursor-pointer" />
          </Link>
        )}
      </div>

      <img className="header-img w-full object-cover max-h-[220px]" src={user.coverUrl} alt="cover" />
      <div className="absolute right-2 bottom-[-40px]">
        <div className="userinfo flex flex-col">
          <div className="flex flex-row items-center gap-4 justify-end">
            <div className="username text-lg font-bold text-white shadow-sm">
              {user.nickname}
            </div>
            <img
              src={user.avatarUrl}
              className="avatar w-[70px] h-[70px] rounded-xl object-cover border-2 border-white dark:border-gray-800 shadow"
              alt="avatar"
            />
          </div>
          <div className="slogon text-gray-500 dark:text-gray-400 truncate w-full text-end text-xs mt-2">
            {user.slogan}
          </div>
        </div>
      </div>
    </div>
  );
};
