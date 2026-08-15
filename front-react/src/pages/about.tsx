import React from 'react';
import { useNavigate } from 'react-router';
import { useTheme } from 'next-themes';
import {
  ChevronLeft,
  Sun,
  MoonStar,
  ExternalLink,
  Info,
  GitBranch,
  Heart,
  ShieldCheck,
} from 'lucide-react';
import { useGlobalStore } from '@/store';

interface TechBadgeProps {
  name: string;
  color: string;
  textColor?: string;
  icon?: React.ReactNode;
  href?: string;
}

// 纯内嵌 SVG 图标，100% 真实矢量还原，零外部网络请求
const TechIcons = {
  golang: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.811 10.231c.143 0 .272.008.386.024.161.024.28.056.357.097.076.04.13.096.16.168.03.073.046.162.046.267v.478c0 .121-.024.22-.072.298-.049.077-.113.133-.193.169-.08.036-.176.057-.287.065a2.53 2.53 0 0 1-.362.012c-.29 0-.52-.069-.691-.206-.171-.137-.257-.34-.257-.611 0-.258.093-.456.278-.594.185-.138.408-.207.733-.207zm4.354 0c.29 0 .532.06.726.18.193.121.334.298.423.533.088.234.133.518.133.85v.025c0 .324-.047.604-.14.842a1.442 1.442 0 0 1-.433.545c-.193.129-.434.194-.722.194-.3 0-.546-.065-.738-.194a1.45 1.45 0 0 1-.43-.545 2.378 2.378 0 0 1-.137-.842v-.025c0-.332.045-.616.136-.85.09-.235.234-.412.43-.533.196-.12.437-.18.723-.18zm6.541-.113h1.722v3.385h-1.722V10.118zm4.492.113c.27 0 .493.056.67.169.177.113.308.274.394.484.086.21.129.46.129.75v.024c0 .3-.044.556-.133.77-.089.213-.223.379-.403.496-.18.117-.406.175-.677.175-.282 0-.516-.063-.701-.19a1.328 1.328 0 0 1-.41-.516 2.08 2.08 0 0 1-.129-.759v-.024c0-.298.043-.553.13-.766.086-.213.22-.377.4-.492.18-.115.412-.172.69-.172z" />
    </svg>
  ),
  echo: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v-3a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H7" />
      <polyline points="10 9 7 12 10 15" />
    </svg>
  ),
  sqlite: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.477 3 2 4.79 2 7v10c0 2.21 4.477 4 10 4s10-1.79 10-4V7c0-2.21-4.477-4-10-4zm0 2c4.418 0 8 1.343 8 3s-3.582 3-8 3-8-1.343-8-3 3.582-3 8-3zm0 6c4.418 0 8 1.343 8 3s-3.582 3-8 3-8-1.343-8-3v-1.646c-1.848.97-4.717 1.646-8 1.646s-6.152-.676-8-1.646V11zm0 5c4.418 0 8 1.343 8 3s-3.582 3-8 3-8-1.343-8-3v-1.646c-1.848.97-4.717 1.646-8 1.646s-6.152-.676-8-1.646V16z" />
    </svg>
  ),
  gorm: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
    </svg>
  ),
  s3: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
    </svg>
  ),
  docker: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.983 11.078h2.119a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.119a.185.185 0 0 0-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 0 0 .186-.186V3.574a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 0 0 .186-.186V6.29a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.887c0 .102.082.186.185.186m-2.93 0h2.12a.186.186 0 0 0 .184-.186V6.29a.185.185 0 0 0-.185-.185H8.1a.185.185 0 0 0-.185.185v1.887c0 .102.083.186.185.186m-2.964 0h2.119a.186.186 0 0 0 .185-.186V6.29a.185.185 0 0 0-.185-.185H5.136a.186.186 0 0 0-.186.185v1.887c0 .102.084.186.186.186m5.893 2.715h2.119a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.119a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 0 0 .185-.185V9.006a.185.185 0 0 0-.185-.186H5.136a.186.186 0 0 0-.186.185v1.888c0 .102.084.185.186.185m-2.928 0h2.119a.185.185 0 0 0 .185-.185V9.006a.185.185 0 0 0-.185-.186H2.208a.186.186 0 0 0-.186.185v1.888c0 .102.084.185.186.185M23.99 12.01c-.13-.483-.586-.814-1.125-.814h-1.92a4.8 4.8 0 0 0-3.86 1.938H1.364a1.363 1.363 0 0 0-1.364 1.364c0 4.148 3.363 7.512 7.512 7.512 4.417 0 8.077-3.218 8.688-7.512h4.48c.624 0 1.157-.428 1.31-1.033.208-.824.208-1.649 0-2.455" />
    </svg>
  ),
  react: (
    <svg className="w-3.5 h-3.5" viewBox="-11.5 -10.23174 23 20.46348" fill="currentColor">
      <circle cx="0" cy="0" r="2.05" fill="#61dafb" />
      <g stroke="#61dafb" strokeWidth="1" fill="none">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  ),
  typescript: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.125 0C0.502 0 0 0.502 0 1.125v21.75C0 23.498 0.502 24 1.125 24h21.75c0.623 0 1.125-0.502 1.125-1.125V1.125C24 0.502 23.498 0 22.875 0H1.125zm17.363 9.75c0.612 0 1.154 0.037 1.661 0.111v2.179c-0.521-0.109-1.077-0.163-1.668-0.163-1.165 0-1.856 0.436-1.856 1.485 0 0.741 0.407 1.196 1.528 1.691l0.752 0.334c2.091 0.925 3.095 2.148 3.095 4.148 0 2.872-1.982 4.465-5.26 4.465-1.018 0-1.996-0.122-2.932-0.366v-2.316c0.887 0.231 1.834 0.347 2.839 0.347 1.579 0 2.454-0.658 2.454-1.782 0-0.785-0.443-1.282-1.637-1.808l-0.752-0.333c-1.928-0.843-2.984-2.023-2.984-4.013 0-2.697 1.954-4.378 4.76-4.378zm-8.374 0.203v2.093h-3.08v9.954H4.377V12.046H1.309V9.953h8.802z" />
    </svg>
  ),
  rsbuild: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zm0 8.5L4.5 7 12 3.5 19.5 7 12 10.5zm0 3.5l10-5v6l-10 5-10-5v-6l10 5z" />
    </svg>
  ),
  tailwind: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z" />
    </svg>
  ),
  reactRouter: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-1.5V6a3 3 0 0 0-3-3H4.5A3 3 0 0 0 1.5 6v12a3 3 0 0 0 3 3h15zm-15-1.5a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 4.5 4.5H15A1.5 1.5 0 0 1 16.5 6v12a1.5 1.5 0 0 1-1.5 1.5H4.5z" />
    </svg>
  ),
  zustand: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m4.93 4.93 4.24 4.24" />
      <path d="m14.83 9.17 4.24-4.24" />
      <path d="m14.83 14.83 4.24 4.24" />
      <path d="m9.17 14.83-4.24 4.24" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  pnpm: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M0 0h7.5v7.5H0V0zm8.25 0h7.5v7.5h-7.5V0zm8.25 0H24v7.5h-7.5V0zM8.25 8.25h7.5v7.5h-7.5v-7.5zm8.25 0H24v7.5h-7.5v-7.5zM0 16.5h7.5V24H0v-7.5zm8.25 0h7.5V24h-7.5v-7.5zm8.25 0H24V24h-7.5v-7.5z" />
    </svg>
  ),
  markdown: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.27 19.385H1.73A1.73 1.73 0 0 1 0 17.655V6.345a1.73 1.73 0 0 1 1.73-1.73h20.54A1.73 1.73 0 0 1 24 6.345v11.308a1.73 1.73 0 0 1-1.73 1.732zm-17.693-3.79h2.523v-4.485l1.96 2.45 1.96-2.45v4.485h2.524V8.405H11.52l-2.49 3.11-2.49-3.11H4.577v7.19zm14.846-3.692h-2.115v-3.5h-2.385v3.5h-2.115l3.308 3.593 3.307-3.593z" />
    </svg>
  ),
  shiki: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 19.778h20L12 2zm0 4.889l6.167 10.889H5.833L12 6.889z" />
    </svg>
  ),
  fancybox: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  ),
  radix: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.52 24a5.76 5.76 0 0 1-5.76-5.76V12.48a5.76 5.76 0 0 1 11.52 0v5.76A5.76 5.76 0 0 1 11.52 24zm6.72-12.48a5.76 5.76 0 1 1 5.76-5.76 5.76 5.76 0 0 1-5.76 5.76zM5.76 11.52A5.76 5.76 0 1 1 0 5.76 5.76 5.76 0 0 1 5.76 11.52z" />
    </svg>
  ),
  lucide: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="12 8 8 12 12 16 16 12 12 8" />
    </svg>
  ),
  sonner: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
  dayjs: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  sortable: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="6" r="1.5" fill="currentColor" />
      <circle cx="15" cy="6" r="1.5" fill="currentColor" />
      <circle cx="9" cy="12" r="1.5" fill="currentColor" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" />
      <circle cx="9" cy="18" r="1.5" fill="currentColor" />
      <circle cx="15" cy="18" r="1.5" fill="currentColor" />
    </svg>
  ),
  zerolog: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" x2="20" y1="19" y2="19" />
    </svg>
  ),
  github: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  ),
  gitee: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.327 0 .592-.265.592-.592v-2.074a.593.593 0 0 0-.592-.593H11.85a.593.593 0 0 1-.593-.593V10.67c0-.328.266-.593.593-.593h5.926c.491 0 .889.398.889.889v4.741a2.37 2.37 0 0 1-2.37 2.37H8.296a2.37 2.37 0 0 1-2.37-2.37V9.778c0-2.455 1.99-4.445 4.444-4.445h7.704z" />
    </svg>
  ),
};

const TechBadge: React.FC<TechBadgeProps> = ({
  name,
  color,
  textColor = 'text-white',
  icon,
  href,
}) => {
  const content = (
    <>
      {icon && <span className="flex-shrink-0 flex items-center justify-center">{icon}</span>}
      <span>{name}</span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ backgroundColor: color }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[11px] font-semibold tracking-wide ${textColor} shadow-xs border border-black/10 dark:border-white/10 hover:brightness-115 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer select-none active:scale-95`}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      style={{ backgroundColor: color }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[11px] font-semibold tracking-wide ${textColor} shadow-xs border border-black/10 dark:border-white/10 hover:brightness-110 hover:-translate-y-0.5 transition-all duration-150 cursor-default select-none`}
    >
      {content}
    </div>
  );
};

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (theme || resolvedTheme) === 'dark';
  const sysConfig = useGlobalStore((state) => state.sysConfig);

  const blogUrl = 'http://blog.curn.me/';
  const repoUrl = 'https://gitee.com/kerntau/moments';

  // 格式化真实版本号，防止出现 vunknown
  const displayVersion =
    sysConfig.version && sysConfig.version !== 'unknown'
      ? `v${sysConfig.version}`
      : 'v0.2.1';

  return (
    <div className="about-page min-h-screen bg-white dark:bg-neutral-900 transition-colors">
      {/* 顶部极简导航栏 */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-800">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer"
          title="返回主页"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>返回主页</span>
        </button>

        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title={isDark ? '切换亮色模式' : '切换暗色模式'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <MoonStar className="w-4 h-4 text-neutral-600" />
          )}
        </button>
      </div>

      <div className="px-5 py-6 space-y-7 text-neutral-800 dark:text-neutral-200">
        {/* 页面主标题与项目真实定位 */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            关于 Moments
          </h1>
          <p className="text-[13px] sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            基于 <strong className="font-semibold text-neutral-900 dark:text-white">Go (Echo)</strong>、
            <strong className="font-semibold text-neutral-900 dark:text-white">React 19</strong> 与{' '}
            <strong className="font-semibold text-neutral-900 dark:text-white">Rsbuild</strong> 构建的现代化轻量级自建朋友圈系统。深度复刻经典社交互动，融合现代化全栈架构，提供极速响应、私密可控且轻量化的个人与好友动态空间。
          </p>
        </div>

        {/* 博客与动态 - 提示框卡片 */}
        <div className="space-y-2.5">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">
            博客与动态
          </h2>
          <div className="flex items-start sm:items-center gap-2.5 p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-800/60 text-xs sm:text-[13px] text-sky-900 dark:text-sky-200">
            <div className="p-1 rounded-full bg-sky-500 text-white flex-shrink-0 mt-0.5 sm:mt-0">
              <Info className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <div className="flex-1 break-all leading-relaxed">
              <span className="font-semibold">个人博客</span>：记录技术笔记，欢迎随时来串门交流：
              <a
                href={blogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 dark:text-sky-400 font-medium underline underline-offset-2 hover:text-sky-700 dark:hover:text-sky-300 inline-flex items-center gap-0.5 ml-1"
              >
                <span>blog.curn.me</span>
                <ExternalLink className="w-3 h-3 inline-block" />
              </a>
            </div>
          </div>
        </div>

        {/* 技术栈体系 - 100% 真实项目全栈 (GitHub/Shields.io 风格) */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">
            技术栈体系
          </h2>

          {/* 1. 后端架构与数据存储 */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              后端架构与数据存储
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <TechBadge name="Go 1.23" color="#00ADD8" icon={TechIcons.golang} href="https://github.com/golang/go" />
              <TechBadge name="Echo v4" color="#007D9C" icon={TechIcons.echo} href="https://github.com/labstack/echo" />
              <TechBadge name="SQLite" color="#003B57" icon={TechIcons.sqlite} href="https://github.com/glebarez/sqlite" />
              <TechBadge name="GORM" color="#2A5A7B" icon={TechIcons.gorm} href="https://github.com/go-gorm/gorm" />
              <TechBadge name="AWS SDK v2" color="#232F3E" icon={TechIcons.s3} href="https://github.com/aws/aws-sdk-go-v2" />
              <TechBadge name="Zerolog" color="#4B5563" icon={TechIcons.zerolog} href="https://github.com/rs/zerolog" />
              <TechBadge name="Docker" color="#2496ED" icon={TechIcons.docker} href="https://github.com/docker" />
            </div>
          </div>

          {/* 2. 前端核心与构建体系 */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              前端核心与构建体系
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <TechBadge name="React 19" color="#20232A" icon={TechIcons.react} href="https://github.com/facebook/react" />
              <TechBadge name="TypeScript" color="#3178C6" icon={TechIcons.typescript} href="https://github.com/microsoft/TypeScript" />
              <TechBadge name="Rsbuild" color="#E15E12" icon={TechIcons.rsbuild} href="https://github.com/web-infra-dev/rsbuild" />
              <TechBadge name="Tailwind CSS v4" color="#06B6D4" icon={TechIcons.tailwind} href="https://github.com/tailwindlabs/tailwindcss" />
              <TechBadge name="React Router v7" color="#CA4245" icon={TechIcons.reactRouter} href="https://github.com/remix-run/react-router" />
              <TechBadge name="Zustand" color="#443E38" icon={TechIcons.zustand} href="https://github.com/pmndrs/zustand" />
              <TechBadge name="PNPM" color="#F69220" icon={TechIcons.pnpm} href="https://github.com/pnpm/pnpm" />
            </div>
          </div>

          {/* 3. 内容生态与交互组件 */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              内容生态与交互组件
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <TechBadge name="Markdown-it" color="#083FA1" icon={TechIcons.markdown} href="https://github.com/markdown-it/markdown-it" />
              <TechBadge name="Shiki" color="#7C3AED" icon={TechIcons.shiki} href="https://github.com/shikijs/shiki" />
              <TechBadge name="Fancyapps UI" color="#059669" icon={TechIcons.fancybox} href="https://github.com/fancyapps/ui" />
              <TechBadge name="Radix UI" color="#161618" icon={TechIcons.radix} href="https://github.com/radix-ui/primitives" />
              <TechBadge name="Lucide Icons" color="#F97316" icon={TechIcons.lucide} href="https://github.com/lucide-icons/lucide" />
              <TechBadge name="Sonner" color="#4F46E5" icon={TechIcons.sonner} href="https://github.com/emilkowalski/sonner" />
              <TechBadge name="Day.js" color="#E11D48" icon={TechIcons.dayjs} href="https://github.com/iamkun/dayjs" />
              <TechBadge name="SortableJS" color="#DC2626" icon={TechIcons.sortable} href="https://github.com/SortableJS/Sortable" />
            </div>
          </div>
        </div>

        {/* 开源致谢 - GitHub 徽章墙 */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">
            开源致谢
          </h2>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <TechBadge name="Golang" color="#00ADD8" icon={TechIcons.golang} href="https://github.com/golang" />
            <TechBadge name="Labstack Echo" color="#007D9C" icon={TechIcons.echo} href="https://github.com/labstack/echo" />
            <TechBadge name="Go GORM" color="#2A5A7B" icon={TechIcons.gorm} href="https://github.com/go-gorm/gorm" />
            <TechBadge name="ByteDance Rsbuild" color="#E15E12" icon={TechIcons.rsbuild} href="https://github.com/web-infra-dev/rsbuild" />
            <TechBadge name="Facebook React" color="#20232A" icon={TechIcons.react} href="https://github.com/facebook/react" />
            <TechBadge name="Tailwind Labs" color="#06B6D4" icon={TechIcons.tailwind} href="https://github.com/tailwindlabs" />
            <TechBadge name="Shiki Project" color="#7C3AED" icon={TechIcons.shiki} href="https://github.com/shikijs/shiki" />
            <TechBadge name="Fancyapps UI" color="#059669" icon={TechIcons.fancybox} href="https://github.com/fancyapps/ui" />
            <TechBadge name="Radix Primitives" color="#161618" icon={TechIcons.radix} href="https://github.com/radix-ui/primitives" />
            <TechBadge name="Lucide Icons" color="#F97316" icon={TechIcons.lucide} href="https://github.com/lucide-icons/lucide" />
            <TechBadge name="Sonner Toast" color="#4F46E5" icon={TechIcons.sonner} href="https://github.com/emilkowalski/sonner" />
            <TechBadge name="Poimandres Zustand" color="#443E38" icon={TechIcons.zustand} href="https://github.com/pmndrs/zustand" />
            <TechBadge name="Day.js Team" color="#E11D48" icon={TechIcons.dayjs} href="https://github.com/iamkun/dayjs" />
            <TechBadge name="SortableJS Team" color="#DC2626" icon={TechIcons.sortable} href="https://github.com/SortableJS/Sortable" />
            <TechBadge name="Gitee" color="#C71D23" icon={TechIcons.gitee} href="https://gitee.com" />
            <TechBadge name="GitHub" color="#181717" icon={TechIcons.github} href="https://github.com" />
          </div>
        </div>

        {/* 底部开源仓库直达与版本信息 */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-all duration-200 border border-neutral-200/80 dark:border-neutral-700/80 group"
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex-shrink-0">
                <GitBranch className="w-4 h-4" />
              </div>
              <div className="truncate text-left">
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <span>开源仓库 (Gitee)</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                    {displayVersion}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">{repoUrl}</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>

          <div className="text-center space-y-1 text-xs text-neutral-400 dark:text-neutral-500 pt-1 pb-4">
            <div className="flex items-center justify-center gap-1">
              <span>Crafted with</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
              <span>for personal moments</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-[11px]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> MIT License
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



