import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router';
import dayjs from 'dayjs';
import { Camera, Play, Lock } from 'lucide-react';
import { useGlobalStore } from '@/store';
import { useMyFetch } from '@/lib/api';
import type { MemoVO, UserVO } from '@/types';
import { Header } from '@/components/header';
import { MyFancyBox } from '@/components/my-fancybox';
export const ProfilePage: React.FC = () => {
  const currentUser = useGlobalStore((state) => state.currentUser as UserVO);
  const navigate = useNavigate();

  const [memos, setMemos] = useState<MemoVO[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadMoreEleRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(async () => {
    setPage(1);
    try {
      const res = await useMyFetch<{
        list: MemoVO[];
        total: number;
        hasNext: boolean;
      }>('/memo/list', { page: 1, size: 30 });
      setMemos(res.list || []);
      setHasNext(res.hasNext);
    } catch (err) {
      console.error('获取动态失败:', err);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasNext) return;
    setLoading(true);
    const nextPage = page + 1;
    try {
      const res = await useMyFetch<{
        list: MemoVO[];
        total: number;
        hasNext: boolean;
      }>('/memo/list', { page: nextPage, size: 30 });
      setMemos((prev) => [...prev, ...(res.list || [])]);
      setPage(nextPage);
      setHasNext(res.hasNext);
    } catch (err) {
      console.error('加载更多失败:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasNext, page]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!hasNext || !loadMoreEleRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(loadMoreEleRef.current);
    return () => observer.disconnect();
  }, [hasNext, loadMore]);

  // 置顶动态
  const pinnedMemos = useMemo(() => {
    return memos.filter((m) => Boolean(m.pinned) && m.pinned !== '0');
  }, [memos]);

  // 普通时间轴动态（去重置顶）
  const timelineMemos = useMemo(() => {
    return memos.filter((m) => !m.pinned || m.pinned === '0');
  }, [memos]);

  // 按年份和日期分组
  const groupedData = useMemo(() => {
    const groups: { [year: string]: { [dateStr: string]: MemoVO[] } } = {};
    timelineMemos.forEach((m) => {
      const d = dayjs(m.createdAt || new Date());
      const year = d.format('YYYY');
      let dateStr = d.format('DD M月');
      if (d.isSame(dayjs(), 'day')) {
        dateStr = '今天';
      }
      if (!groups[year]) groups[year] = {};
      if (!groups[year][dateStr]) groups[year][dateStr] = [];
      groups[year][dateStr].push(m);
    });

    const sortedYears = Object.keys(groups).sort((a, b) => Number(b) - Number(a));
    return sortedYears.map((year) => {
      const dateGroups = Object.entries(groups[year]).map(([dateStr, ms]) => {
        return {
          dateStr,
          memos: ms,
          timestamp: ms[0].createdAt,
        };
      });
      dateGroups.sort((a, b) => dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf());
      return {
        year,
        dates: dateGroups,
      };
    });
  }, [timelineMemos]);

  const hasToday = groupedData[0]?.dates[0]?.dateStr === '今天';

  return (
    <div className="w-full pb-16">
        <Header user={currentUser} />


        <div className="px-4 sm:px-6 flex flex-col gap-6">
          
          {/* 置顶动态 */}
          {pinnedMemos.length > 0 && (
            <div className="flex flex-col gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              {pinnedMemos.map((pinnedMemo) => {
                const plainText = (pinnedMemo.content || '')
                  .replace(/!\[.*?\]\(.*?\)/g, '')
                  .replace(/<[^>]+>/g, '')
                  .trim();

                return (
                  <div key={pinnedMemo.id} className="flex gap-4 items-start">
                    <div className="w-16 sm:w-20 shrink-0 pt-0.5">
                      <span className="text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight">
                        置顶
                      </span>
                    </div>

                    <div
                      className="flex-1 bg-[#f3f3f3] dark:bg-neutral-800 p-3.5 sm:p-4 rounded-sm cursor-pointer hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80 transition-colors"
                      onClick={() => navigate(`/memo/${pinnedMemo.id}`)}
                    >
                      <p className="text-sm sm:text-base text-neutral-900 dark:text-neutral-100 font-bold leading-normal line-clamp-3">
                        {plainText || '置顶动态'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 今天空动态入口 */}
          {!hasToday && (
            <div className="flex gap-4 sm:gap-6 items-start group cursor-pointer" onClick={() => navigate('/new')}>
              <div className="w-16 sm:w-20 shrink-0 pt-0.5">
                <span className="text-2xl sm:text-3xl font-bold text-black dark:text-white">今天</span>
              </div>
              <div className="flex-1">
                <div className="w-20 h-20 sm:w-[84px] sm:h-[84px] bg-[#f3f3f3] dark:bg-neutral-800 flex items-center justify-center rounded-sm group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors">
                  <Camera className="w-8 h-8 text-neutral-400" strokeWidth={1.2} />
                </div>
              </div>
            </div>
          )}

          {/* 按年份聚合（微信相册格式：2025年、2024年） */}
          {groupedData.map((yearGroup) => (
            <div key={yearGroup.year} className="flex flex-col gap-5">
              <h2 className="text-2xl sm:text-3xl font-bold text-black dark:text-white tracking-tight my-2">
                {yearGroup.year}年
              </h2>

              <div className="flex flex-col gap-6">
                {yearGroup.dates.map((dateGroup) => {
                  const isToday = dateGroup.dateStr === '今天';
                  const dayPart = isToday ? '今天' : dateGroup.dateStr.split(' ')[0];
                  const monthPart = isToday ? '' : dateGroup.dateStr.split(' ')[1];

                  return (
                    <div key={dateGroup.dateStr} className="flex gap-4 sm:gap-6 items-start">
                      {/* 左侧日期：大字号 Day + 小字号 Month */}
                      <div className="w-16 sm:w-20 shrink-0 pt-0.5">
                        {isToday ? (
                          <span className="text-2xl sm:text-3xl font-bold text-black dark:text-white">今天</span>
                        ) : (
                          <div className="flex items-baseline text-black dark:text-white">
                            <span className="text-2xl sm:text-[28px] font-bold tracking-tight">{dayPart}</span>
                            <span className="text-xs sm:text-[13px] font-bold ml-0.5">{monthPart}</span>
                          </div>
                        )}
                        {dateGroup.memos[0]?.location && (
                          <div className="text-[11px] text-neutral-400 font-normal mt-0.5 truncate max-w-[64px]" title={dateGroup.memos[0].location}>
                            {dateGroup.memos[0].location.length > 6 
                              ? dateGroup.memos[0].location.substring(0, 6) + '...' 
                              : dateGroup.memos[0].location.split(' ').pop()}
                          </div>
                        )}
                      </div>

                      {/* 右侧动态列表 */}
                      <div className="flex-1 flex flex-col gap-4">
                        {dateGroup.memos.map((memo) => (
                          <ProfileMemoItem key={memo.id} memo={memo} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

        </div>

        {/* 底部加载完成提示 */}
        {hasNext ? (
          <div
            ref={loadMoreEleRef}
            className="text-xs text-center text-neutral-500 py-10 cursor-pointer hover:text-sky-500 transition-colors"
            onClick={loadMore}
          >
            {loading ? '加载中...' : '滑动加载更多'}
          </div>
        ) : (
          <div className="text-xs text-center text-neutral-400 py-12 flex items-center justify-center gap-2">
            <span className="w-4 h-px bg-neutral-200 dark:bg-neutral-800"></span>
            <span>已加载完成</span>
            <span className="w-4 h-px bg-neutral-200 dark:bg-neutral-800"></span>
          </div>
        )}
    </div>
  );
};

const ProfileMemoItem = ({ memo }: { memo: MemoVO }) => {
  const navigate = useNavigate();
  let extJSON: any = {};
  try {
    extJSON = JSON.parse(memo.ext || '{}');
  } catch (e) {
    extJSON = {};
  }

  const imgs: string[] = (memo.imgs || '').split(',').filter(Boolean);
  const hasVideo = !!(
    extJSON.video &&
    extJSON.video.value &&
    (['bilibili', 'youtube'].includes(extJSON.video.type) || extJSON.video.type === 'online')
  );
  const hasMedia = imgs.length > 0 || hasVideo;

  // 安全提取纯文本，防止 HTML 或 Markdown 标签导致文字丢失
  let plainText = (memo.content || '')
    .replace(/!\[.*?\]\(.*?\)/g, '') // 去除 Markdown 图片
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 替换 Markdown 链接为其文本
    .replace(/<[^>]+>/g, '') // 去除 HTML 标签
    .replace(/[#*`~>-]/g, '') // 去除一些 Markdown 格式符
    .trim();

  // 添加兜底逻辑：处理视频和外部链接，避免纯媒体动态无任何描述
  if (!plainText && extJSON.externalTitle) {
    plainText = extJSON.externalTitle;
  }
  if (!plainText && hasVideo) {
    plainText = extJSON.video?.title || '分享了视频';
  }
  if (!plainText && (memo.externalUrl || extJSON.externalUrl)) {
    plainText = '分享了链接';
  }

  const isPrivate = memo.showType === 0;
  const handleClick = () => navigate(`/memo/${memo.id}`);

  // 1. 有媒体文件：左侧单张缩略图 + 右侧透明底色文字
  if (hasMedia) {
    const thumbUrl = imgs.length > 0 ? imgs[0] : (extJSON.video?.poster || '');
    return (
      <div className="flex items-start gap-3 sm:gap-4 cursor-pointer group w-full" onClick={handleClick}>
        <div 
          className="w-[76px] h-[76px] sm:w-[90px] sm:h-[90px] shrink-0 bg-neutral-200 dark:bg-neutral-800 relative overflow-hidden rounded-[4px]"
          onClick={(e) => {
            // 如果是纯图片（非视频），点击图片时仅预览，阻止跳转详情页
            if (thumbUrl && !hasVideo) {
              e.stopPropagation();
            }
          }}
        >
          {hasVideo ? (
            <>
              {thumbUrl ? (
                <img src={thumbUrl} className="w-full h-full object-cover group-hover:opacity-95 transition-opacity" alt="thumb" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-neutral-400" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Play className="w-7 h-7 text-white fill-white/80" />
              </div>
            </>
          ) : imgs.length > 0 ? (
            <MyFancyBox>
              <div className={`grid gap-[1px] w-full h-full ${
                imgs.length === 1 ? 'grid-cols-1 grid-rows-1' :
                imgs.length === 2 ? 'grid-cols-2 grid-rows-1' :
                'grid-cols-2 grid-rows-2'
              }`}>
                {imgs.slice(0, 4).map((img, idx) => (
                  <a key={idx} href={img} data-fancybox="gallery" className="w-full h-full block relative overflow-hidden">
                    <img src={img} className="w-full h-full object-cover group-hover:opacity-95 transition-opacity" alt={`thumb-${idx}`} />
                  </a>
                ))}
              </div>
            </MyFancyBox>
          ) : null}
          {isPrivate && (
            <div className="absolute bottom-1 right-1 bg-black/50 p-0.5 rounded-sm">
              <Lock className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 text-[13px] sm:text-[14px] text-neutral-800 dark:text-neutral-200 leading-[1.6] line-clamp-4 break-words pt-0.5">
          {plainText}
        </div>
      </div>
    );
  }

  // 2. 纯文本动态：无图时包裹在一个灰色底色的气泡框中
  return (
    <div className="flex items-start cursor-pointer group w-full" onClick={handleClick}>
      <div className="flex-1 bg-[#f7f7f7] dark:bg-neutral-800/80 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-[4px] group-hover:bg-[#f0f0f0] dark:group-hover:bg-neutral-800 transition-colors relative">
        <div className="text-[13px] sm:text-[14px] text-neutral-800 dark:text-neutral-200 leading-[1.5] line-clamp-4 break-words">
          {plainText || <span className="text-neutral-400 italic">分享了一条动态</span>}
          {isPrivate && (
            <span className="inline-block ml-1.5 align-middle">
              <Lock className="w-3 h-3 text-neutral-400 inline" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
