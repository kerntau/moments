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
      return parsedUrl.toString();
    } catch (e) {
      return url;
    }
  }, [url]);

  if (!url) return null;

  return (
    <iframe
      src={videoUrl}
      className="w-full aspect-video rounded border-0 shadow-sm"
      title="Video player iframe"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
};
