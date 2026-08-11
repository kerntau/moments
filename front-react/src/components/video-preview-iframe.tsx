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
      className="w-full h-[250px] rounded border-0"
      title="Video player iframe"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
};
