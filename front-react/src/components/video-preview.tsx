import React from 'react';

interface VideoPreviewProps {
  url: string;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ url }) => {
  if (!url) return null;

  return (
    <video
      className="rounded object-scale-down w-2/3 max-h-[360px]"
      controls
      src={url}
      preload="metadata"
    />
  );
};
