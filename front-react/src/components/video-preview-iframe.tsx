import React, { useMemo } from 'react';

interface VideoPreviewIframeProps {
  url: string;
}

export const VideoPreviewIframe: React.FC<VideoPreviewIframeProps> = ({ url }) => {
  const videoUrl = useMemo(() => {
    if (!url) return '';
    try {
      const parsedUrl = new URL(url);
      parsedUrl.searchParams.set('autoplay', '0');
      
      // 针对 Bilibili 的移动端/内嵌优化
      if (parsedUrl.hostname.includes('bilibili.com')) {
        parsedUrl.searchParams.set('high_quality', '1');
        parsedUrl.searchParams.set('danmaku', '0');
      }
      
      return parsedUrl.toString();
    } catch (e) {
      return url;
    }
  }, [url]);

  if (!url) return null;

  return (
    <iframe
      src={videoUrl}
      className="w-full aspect-video rounded-xl border-0 shadow-sm bg-neutral-900/5"
      title="Video player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
};
