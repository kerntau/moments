import React from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { useTheme } from 'next-themes';
import {
  ChevronLeft,
  LogOut,
  Camera,
  Users,
  Settings,
  User,
  LogIn,
  Sun,
  MoonStar,
  Terminal,
} from 'lucide-react';
import type { UserVO } from '@/types';
import { useGlobalStore } from '@/store';

interface HeaderProps {
  user: UserVO;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (theme || resolvedTheme) === 'dark';

  const userinfo = useGlobalStore((state) => state.userinfo);
  const setUserinfo = useGlobalStore((state) => state.setUserinfo);
  const setSysLogDialogOpen = useGlobalStore((state) => state.setSysLogDialogOpen);

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
      {path !== '/' && (
        <div className="flex absolute justify-between items-center px-4 py-3.5 w-full top-0 z-30 text-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.85)]">
          <div className="flex items-center gap-1.5 cursor-pointer font-bold text-sm tracking-tight" onClick={() => navigate('/')} title="返回主页">
            <div className="p-1 rounded-full hover:bg-black/20 transition">
              <ChevronLeft className="w-5 h-5 text-white" />
            </div>
            {path.includes('/memo/') && <span>详情</span>}
            {path === '/profile' && <span>相册</span>}
            {path === '/sys/settings' && <span>系统设置</span>}
            {path.includes('/tags/') && <span>{params.tag || '话题专栏'}</span>}
            {path !== '/profile' &&
              path !== '/sys/settings' &&
              !path.includes('/tags/') &&
              !path.includes('/memo/') && (
                <span>
                  {!userinfo.token && path === '/user/login' && '登录'}
                  {(userinfo.token || path !== '/user/login') &&
                    `${user.nickname || ''} 的空间`}
                </span>
              )}
          </div>
          {path === '/sys/settings' && userinfo.token && (
            <div className="hidden sm:flex p-1.5 rounded-full hover:bg-black/20 transition text-white" title="登出" onClick={logout}>
              <LogOut className="w-4 h-4 cursor-pointer" />
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
            <span title="我的" onClick={() => navigate('/profile')}>
              <User className="text-sky-500 w-5 h-5 cursor-pointer" />
            </span>
            <span title="友链" onClick={() => navigate('/friend')}>
              <Users className="text-sky-500 w-5 h-5 cursor-pointer" />
            </span>
            <span title="系统设置" onClick={() => navigate('/sys/settings')}>
              <Settings className="text-sky-500 w-5 h-5 cursor-pointer" />
            </span>
            {userinfo.id === 1 && (
              <span title="系统日志" onClick={() => setSysLogDialogOpen(true)}>
                <Terminal className="text-sky-500 w-5 h-5 cursor-pointer" />
              </span>
            )}
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

        {/* 昵称：位于封面图右下角，向下紧贴封面图底部 */}
        <div 
          className="absolute right-[88px] sm:right-[98px] bottom-2 sm:bottom-2.5 font-bold text-white text-base sm:text-lg tracking-wide select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => navigate('/profile')}
        >
          {user.nickname}
        </div>

        {/* 头像：无边框、适中圆角，自然跨越封面图底部 */}
        <div 
          className="absolute right-4 sm:right-5 -bottom-6 w-[62px] h-[62px] sm:w-[68px] sm:h-[68px] rounded-xl overflow-hidden shadow-sm flex-shrink-0 z-10 cursor-pointer active:scale-95 transition-transform"
          onClick={() => navigate('/profile')}
        >
          <img
            src={user.avatarUrl || '/avatar.webp'}
            className="w-full h-full object-cover"
            alt="avatar"
          />
        </div>
      </div>

      {/* 头像下方的签名 / slogan 区域 */}
      <div className="pt-7 pb-2.5 px-4 flex justify-end min-h-[40px]">
        {user.slogan && (
          <div className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-[13px] font-normal text-right max-w-[260px] sm:max-w-xs break-words">
            {user.slogan}
          </div>
        )}
      </div>
    </div>
  );
};
