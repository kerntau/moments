import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { toast } from 'sonner';
import {
  ChevronLeft,
  Pin,
  Lock,
  Heart,
  MessageSquare,
  Eye,
  Trash2,
  Edit,
  MapPin,
  MoreHorizontal,
  Users,
} from 'lucide-react';
import { Confirm } from '@/components/confirm';
import { Comment } from '@/components/comment';
import { CommentBox } from '@/components/comment-box';
import { ExternalUrlPreview } from '@/components/external-url-preview';
import { UploadImagePreview } from '@/components/upload-image-preview';
import { MusicPreview } from '@/components/music-preview';
import { DoubanBookPreview } from '@/components/douban-book-preview';
import { DoubanMoviePreview } from '@/components/douban-movie-preview';
import { VideoPreview } from '@/components/video-preview';
import { VideoPreviewIframe } from '@/components/video-preview-iframe';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useGlobalStore } from '@/store';
import { useMyFetch } from '@/lib/api';
import { renderMarkdown } from '@/lib/markdown';
import type { ExtDTO, MemoVO } from '@/types';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

interface MemoProps {
  memo: MemoVO;
}

declare const grecaptcha: any;

export const Memo: React.FC<MemoProps> = ({ memo }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const userinfo = useGlobalStore((state) => state.userinfo);
  const sysConfig = useGlobalStore((state) => state.sysConfig);
  const currentCommentBox = useGlobalStore((state) => state.currentCommentBox);
  const setCurrentCommentBox = useGlobalStore((state) => state.setCurrentCommentBox);
  const reloadMemos = useGlobalStore((state) => state.reloadMemos);

  const [showMore, setShowMore] = useState(false);
  const [showMoreClicked, setShowMoreClicked] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [moreToolbar, setMoreToolbar] = useState(false);
  const [liked, setLiked] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const contentRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const isDetailPage = location.pathname.startsWith('/memo/');

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    try {
      const likes = JSON.parse(localStorage.getItem('likeMemos') || '[]') as number[];
      setLiked(likes.includes(memo.id));
    } catch (e) {}

    if (!isDetailPage && contentRef.current && sysConfig.memoMaxHeight) {
      const maxHeight = sysConfig.memoMaxHeight;
      setTimeout(() => {
        if (contentRef.current && contentRef.current.scrollHeight > maxHeight) {
          setShowMore(true);
        }
      }, 50);
    }
  }, [memo.id, isDetailPage, sysConfig.memoMaxHeight]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowToolbar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const extJSON = useMemo(() => {
    try {
      return JSON.parse(memo.ext || '{}') as ExtDTO;
    } catch (e) {
      return {} as ExtDTO;
    }
  }, [memo.ext]);

  const parsedLocation = useMemo(() => {
    return (memo.location || '').replaceAll(' ', ' · ');
  }, [memo.location]);

  const tags = useMemo(() => {
    if (!memo.tags) return [];
    let tagsStr = memo.tags;
    if (tagsStr.endsWith(',')) {
      tagsStr = tagsStr.slice(0, -1);
    }
    return tagsStr.split(',').filter(Boolean);
  }, [memo.tags]);

  const htmlContent = useMemo(() => {
    return renderMarkdown(memo.content);
  }, [memo.content]);

  const getMemoMaxHeightStyle = (): React.CSSProperties => {
    if (isDetailPage || showMoreClicked) return {};
    if (sysConfig.memoMaxHeight) {
      return { maxHeight: `${sysConfig.memoMaxHeight}px`, overflow: 'hidden' };
    }
    return {};
  };

  const doComment = () => {
    const value = `${memo.id}#0`;
    if (currentCommentBox === value) {
      setCurrentCommentBox('');
    } else {
      setCurrentCommentBox(value);
    }
    setShowToolbar(false);
  };

  const doLike = async (id: number, token: string = '') => {
    try {
      const likes = JSON.parse(localStorage.getItem('likeMemos') || '[]') as number[];
      await useMyFetch(`/memo/like?id=${id}&token=${token}`);
      toast.success('点赞成功!');
      likes.push(id);
      localStorage.setItem('likeMemos', JSON.stringify(likes));
      setLiked(true);
      reloadMemos();
    } catch (err: any) {
      toast.error(err?.message || '点赞失败');
    }
  };

  const likeMemo = async (id: number) => {
    setShowToolbar(false);
    const likes = JSON.parse(localStorage.getItem('likeMemos') || '[]') as number[];
    if (likes.includes(id)) {
      toast.warning('您已经点赞过了!');
      return;
    }

    if (sysConfig.enableGoogleRecaptcha && typeof grecaptcha !== 'undefined') {
      grecaptcha.ready(() => {
        grecaptcha
          .execute(sysConfig.googleSiteKey, { action: 'newComment' })
          .then(async (token: string) => {
            await doLike(id, token);
          });
      });
    } else {
      await doLike(id);
    }
  };

  const removeMemo = async (id: number) => {
    try {
      await useMyFetch(`/memo/remove?id=${id}`);
      toast.success('删除成功!');
      setShowToolbar(false);
      setMoreToolbar(false);
      if (isDetailPage) {
        navigate('/');
      } else {
        reloadMemos();
      }
    } catch (err: any) {
      toast.error(err?.message || '删除失败');
    }
  };

  const setPinned = async (id: number) => {
    try {
      await useMyFetch(`/memo/setPinned?id=${id}`);
      toast.success('操作成功!');
      setMoreToolbar(false);
      if (isDetailPage) {
        navigate('/');
      } else {
        reloadMemos();
      }
    } catch (err: any) {
      toast.error(err?.message || '置顶状态变更失败');
    }
  };

  return (
    <div>


      <div
        className={`relative flex gap-3 sm:gap-3.5 text-sm p-3 sm:p-4 dark:bg-neutral-800 border-b border-black/[0.06] dark:border-white/[0.08] ${
          memo.pinned ? 'bg-slate-100 dark:bg-neutral-700/60' : ''
        }`}
      >
        <div 
          className="avatar flex-shrink-0 pt-[1px] cursor-pointer active:opacity-80 transition-opacity"
          onClick={() => navigate('/profile')}
        >
          <img
            src={memo.user.avatarUrl}
            alt="Avatar"
            className="w-[42px] h-[42px] rounded-[6px] object-cover"
          />
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <div className="username text-[#576b95] dark:text-[#7d90b8] mb-0.5 font-semibold text-[15px] leading-snug flex justify-between items-center select-none">
            <span 
              className="cursor-pointer hover:underline"
              onClick={() => navigate('/profile')}
            >
              {memo.user.nickname}
            </span>
            <div className="flex items-center">
              {memo.pinned && <Pin className="w-4 h-4 text-amber-500" />}
              {memo.showType === 0 && <Lock className="w-4 h-4 text-red-500 ml-2 dark:text-neutral-300" />}
            </div>
          </div>

          <div className="mb-1">
            <div style={getMemoMaxHeightStyle()}>
              <div
                ref={contentRef}
                className="markdown-content text-[#111111] dark:text-neutral-100 text-[15px] leading-[1.4]"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>

            {showMore && (
              <div
                className="text-[#576b95] dark:text-[#7d90b8] text-sm my-0.5 cursor-pointer font-medium hover:opacity-80"
                onClick={() => setShowMoreClicked(!showMoreClicked)}
              >
                {showMoreClicked ? '收起' : '全文'}
              </div>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1 mb-0.5">
                {tags.map((tag, idx) => (
                  <Link key={idx} to={`/tags/${memo.user.username}/${tag}`}>
                    <span className="text-[#576b95] dark:text-[#7d90b8] text-[14px] hover:opacity-80 font-normal">
                      #{tag}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 嵌套多媒体扩展预览 */}
          <div className="flex flex-col gap-1.5">
            {memo.externalFavicon && memo.externalTitle && memo.externalUrl && (
              <ExternalUrlPreview
                favicon={memo.externalFavicon}
                title={memo.externalTitle}
                url={memo.externalUrl}
              />
            )}

            <UploadImagePreview
              imgs={memo.imgs}
              imgConfigs={memo.imgConfigs}
            />

            {extJSON.music && extJSON.music.id && (
              <MusicPreview
                id={extJSON.music.id}
                server={extJSON.music.server}
                type={extJSON.music.type}
                api={extJSON.music.api}
              />
            )}
            {extJSON.doubanBook && extJSON.doubanBook.title && <DoubanBookPreview book={extJSON.doubanBook} />}
            {extJSON.doubanMovie && extJSON.doubanMovie.title && <DoubanMoviePreview movie={extJSON.doubanMovie} />}

            {extJSON.video && ['bilibili', 'youtube'].includes(extJSON.video.type) && extJSON.video.value && (
              <VideoPreviewIframe url={extJSON.video.value} />
            )}
            {extJSON.video && extJSON.video.type === 'online' && extJSON.video.value && (
              <VideoPreview url={extJSON.video.value} />
            )}
          </div>

          {parsedLocation && (
            <Link to={`/location/${memo.user.username}/${encodeURIComponent(memo.location)}`}>
              <div className="text-[#576b95] dark:text-[#7d90b8] font-medium text-xs mt-1.5 mb-0.5 select-none flex items-center gap-1 hover:opacity-80 cursor-pointer">
                <MapPin className="w-3.5 h-3.5" />
                <span>{parsedLocation}</span>
              </div>
            </Link>
          )}

          <div className="flex justify-between items-center relative mt-1.5 mb-1">
            <div className="flex items-center gap-1.5 text-[13px] leading-none text-[#b2b2b2] dark:text-neutral-500 font-normal">
              <span className="leading-none flex items-center">
                {sysConfig.timeFormat === 'timeAgo'
                  ? dayjs(memo.createdAt).fromNow()
                  : dayjs(memo.createdAt).format('YYYY-MM-DD HH:mm')}
                {dayjs(memo.createdAt).isAfter(dayjs()) ? '，未到发布时间，仅自己可见' : ''}
              </span>

              {(userinfo.id === 1 || userinfo.id === memo.userId) && (
                <Confirm title="确定要删除这条动态吗？" onOk={() => removeMemo(memo.id)}>
                  <span
                    title="删除动态"
                    className="cursor-pointer text-[#576b95] dark:text-[#7d90b8] hover:text-red-500 transition-colors inline-flex items-center justify-center ml-0.5 mt-[1.5px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </span>
                </Confirm>
              )}
            </div>

            <div
              onClick={() => setShowToolbar(!showToolbar)}
              className="toolbar-icon px-2 py-0.5 bg-[#f7f7f7] dark:bg-neutral-800 hover:bg-[#dedede] dark:hover:bg-neutral-700 cursor-pointer rounded flex items-center justify-center transition relative z-10 select-none"
            >
              <span className="text-[#576b95] font-bold tracking-widest text-xs">••</span>
            </div>

            {/* 弹出操作小气泡 */}
            {showToolbar && (
              <div
                ref={toolbarRef}
                className="absolute top-[-8px] right-[32px] bg-[#4c4c4c] rounded text-white p-2 shadow-xl z-20"
              >
                <div className="flex flex-row items-center divide-x divide-[#6b7280] text-xs">
                  <div
                    className="flex flex-row gap-1 cursor-pointer items-center px-3 hover:opacity-80"
                    onClick={() => likeMemo(memo.id)}
                  >
                    <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                    <span>赞</span>
                  </div>

                  {sysConfig.enableComment && (
                    <div
                      className="flex flex-row gap-1 cursor-pointer items-center px-3 hover:opacity-80"
                      onClick={doComment}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>评论</span>
                    </div>
                  )}

                  {userinfo.id === memo.userId && (
                    <div
                      className="flex flex-row gap-1 cursor-pointer items-center px-3 hover:opacity-80"
                      onClick={() => {
                        setShowToolbar(false);
                        navigate(`/edit/${memo.id}`);
                      }}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>编辑</span>
                    </div>
                  )}

                  {(userinfo.id === 1 || userinfo.id === memo.userId) && (
                    <Confirm title="确定要删除这条动态吗？" onOk={() => removeMemo(memo.id)}>
                      <div
                        className="flex flex-row gap-1 cursor-pointer items-center px-3 hover:opacity-80 text-red-300 hover:text-red-400"
                        onClick={() => setShowToolbar(false)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>删除</span>
                      </div>
                    </Confirm>
                  )}

                  {location.pathname !== `/memo/${memo.id}` && (
                    <div
                      className="flex flex-row gap-1 cursor-pointer items-center px-3 hover:opacity-80"
                      onClick={() => navigate(`/memo/${memo.id}`)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>详情</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 赞与评论卡片区块 (复刻微信灰底 rounded-[6px] bg-[#f3f3f5]) */}
          {(memo.favCount > 0 || (sysConfig.enableComment && memo.comments && memo.comments.length > 0)) && (
            <div className="rounded-[6px] bg-[#f3f3f5] dark:bg-[#2c2c2e] px-3 py-1.5 mt-1.5 text-[14px]">
              {memo.favCount > 0 && (
                <div
                  className={`flex flex-row items-center gap-1.5 text-[14px] text-[#576b95] dark:text-[#7d90b8] font-medium ${
                    sysConfig.enableComment && memo.comments && memo.comments.length > 0
                      ? 'pb-1.5 border-b border-black/[0.06] dark:border-white/10 mb-1.5'
                      : ''
                  }`}
                >
                  <Heart className="w-[15px] h-[15px] text-[#576b95] dark:text-[#7d90b8] stroke-[1.8]" />
                  <span>{memo.favCount}位访客点赞</span>
                </div>
              )}

              {sysConfig.enableComment && (
                <div>
                  <CommentBox commentId={0} memoId={memo.id} />
                  {memo.comments && memo.comments.length > 0 && (
                    <div className="space-y-1">
                      {memo.comments.map((c) => (
                        <Comment
                          key={c.id}
                          comment={c}
                          memoId={memo.id}
                          memoUserId={memo.user.id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 管理员/作者 Modal 操作 */}
      <Dialog open={moreToolbar} onOpenChange={setMoreToolbar}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl bg-white dark:bg-neutral-900 border-none shadow-2xl">
          <div className="flex items-center justify-center pt-2 text-gray-700 dark:text-neutral-200 font-semibold text-base">
            基本操作
          </div>
          <div className="flex items-center justify-center gap-8 p-6 text-neutral-600 dark:text-neutral-300">
            {userinfo.id === 1 && (
              <div
                className="flex flex-col gap-1 cursor-pointer items-center group"
                onClick={() => setPinned(memo.id)}
              >
                <span className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-3 rounded-full group-hover:bg-amber-100 dark:group-hover:bg-neutral-700 transition">
                  <Pin className="w-6 h-6 text-amber-500" />
                </span>
                <span className="text-xs mt-1">{memo.pinned ? '取消置顶' : '置顶'}</span>
              </div>
            )}

            {userinfo.id === memo.userId && (
              <div
                className="flex flex-col gap-1 cursor-pointer items-center group"
                onClick={() => {
                  setMoreToolbar(false);
                  navigate(`/edit/${memo.id}`);
                }}
              >
                <span className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-3 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-neutral-700 transition">
                  <Edit className="w-6 h-6 text-blue-500" />
                </span>
                <span className="text-xs mt-1">编辑</span>
              </div>
            )}

            {(userinfo.id === 1 || userinfo.id === memo.userId) && (
              <Confirm onOk={() => removeMemo(memo.id)}>
                <div className="flex flex-col gap-1 cursor-pointer items-center group">
                  <span className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-3 rounded-full group-hover:bg-red-100 dark:group-hover:bg-neutral-700 transition">
                    <Trash2 className="w-6 h-6 text-red-500" />
                  </span>
                  <span className="text-xs mt-1">删除</span>
                </div>
              </Confirm>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
