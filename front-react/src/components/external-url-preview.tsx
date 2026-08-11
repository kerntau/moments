import React from 'react';

interface ExternalUrlPreviewProps {
  url: string;
  title: string;
  favicon: string;
}

export const ExternalUrlPreview: React.FC<ExternalUrlPreviewProps> = ({
  url,
  title,
  favicon,
}) => {
  if (!url) return null;

  return (
    <div className="flex flex-row gap-2 my-2 bg-[#f7f7f7] dark:bg-[#212121] items-center dark:border-gray-700/50 p-2 border rounded">
      {favicon && <img className="w-8 h-8 object-contain" src={favicon} alt="icon" />}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#576b95] font-medium hover:underline text-sm truncate"
      >
        {title}
      </a>
    </div>
  );
};
