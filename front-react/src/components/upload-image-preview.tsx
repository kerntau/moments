import React, { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router';
import Sortable from 'sortablejs';
import { Trash2 } from 'lucide-react';
import { MyFancyBox } from '@/components/my-fancybox';

interface ImgConfig {
  id: string;
  url: string;
  thumbUrl: string;
}

interface UploadImagePreviewProps {
  imgs?: string;
  imgConfigs?: { url: string; thumbUrl: string }[];
  onRemoveImage?: (index: number) => void;
  onDragImage?: (newImgs: string[]) => void;
}

export const UploadImagePreview: React.FC<UploadImagePreviewProps> = ({
  imgs = '',
  imgConfigs = [],
  onRemoveImage,
  onDragImage,
}) => {
  const location = useLocation();
  const sortableContainerRef = useRef<HTMLDivElement>(null);

  const isEditMode =
    location.pathname.startsWith('/new') || location.pathname.startsWith('/edit');

  const imagesList = useMemo<ImgConfig[]>(() => {
    return imgs
      .split(',')
      .filter(Boolean)
      .map((url, i) => ({
        id: `${url}-${i}`,
        url,
        thumbUrl: url,
      }));
  }, [imgs]);

  const configsList = useMemo<ImgConfig[]>(() => {
    return imgConfigs.map((config, i) => ({
      id: `${config.url}-${i}`,
      url: config.url,
      thumbUrl: config.thumbUrl || config.url,
    }));
  }, [imgConfigs]);

  const activeConfigs = configsList.length > 0 ? configsList : imagesList;

  useEffect(() => {
    if (!isEditMode || !sortableContainerRef.current || imagesList.length === 0) return;

    const sortable = Sortable.create(sortableContainerRef.current, {
      animation: 150,
      onEnd: () => {
        if (!sortableContainerRef.current) return;
        const currentElements = Array.from(sortableContainerRef.current.children);
        const newUrls = currentElements
          .map((el) => el.getAttribute('data-url'))
          .filter((url): url is string => Boolean(url));

        if (onDragImage) {
          onDragImage(newUrls);
        }
      },
    });

    return () => {
      sortable.destroy();
    };
  }, [isEditMode, imagesList, onDragImage]);

  const gridStyle = useMemo(() => {
    const count = isEditMode ? imagesList.length : activeConfigs.length;
    let base = 'max-width:100%; display:grid; gap: 0.5rem; align-items: start;';
    switch (count) {
      case 1:
        return { display: 'grid', gap: '0.5rem', gridTemplateColumns: '1fr', maxWidth: '60%' };
      case 2:
        return { display: 'grid', gap: '0.5rem', gridTemplateColumns: '1fr 1fr', aspectRatio: '2 / 1' };
      case 3:
        return { display: 'grid', gap: '0.5rem', gridTemplateColumns: '1fr 1fr 1fr', aspectRatio: '3 / 1' };
      case 4:
        return { display: 'grid', gap: '0.5rem', gridTemplateColumns: '1fr 1fr', aspectRatio: '1 / 1' };
      default:
        return { display: 'grid', gap: '0.5rem', gridTemplateColumns: '1fr 1fr 1fr' };
    }
  }, [isEditMode, imagesList.length, activeConfigs.length]);

  if (isEditMode && imagesList.length > 0) {
    return (
      <div ref={sortableContainerRef} style={gridStyle} className="my-2">
        {imagesList.map((img, index) => (
          <div
            key={img.id}
            data-url={img.url}
            className={`relative group ${
              imagesList.length === 1 ? 'w-fit max-h-[300px]' : 'w-full aspect-square max-h-[300px]'
            }`}
          >
            <img
              src={img.url}
              alt=""
              className="cursor-move rounded w-full h-full object-cover border border-neutral-200 dark:border-neutral-800"
            />
            {onRemoveImage && (
              <div
                className="absolute top-1 right-1 p-1 bg-white/90 dark:bg-neutral-900/90 rounded hover:text-red-500 cursor-pointer shadow"
                onClick={() => onRemoveImage(index)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (activeConfigs.length > 0) {
    return (
      <MyFancyBox>
        <div style={gridStyle} className="my-2">
          {activeConfigs.map((imgConfig) => (
            <a
              key={imgConfig.id}
              href={imgConfig.url}
              className={`block overflow-hidden rounded ${
                activeConfigs.length === 1 ? 'w-fit max-h-[300px]' : 'w-full aspect-square max-h-[300px]'
              }`}
            >
              <img
                src={imgConfig.thumbUrl}
                alt=""
                className="cursor-zoom-in rounded w-full h-full object-cover transition-transform hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = imgConfig.url;
                }}
              />
            </a>
          ))}
        </div>
      </MyFancyBox>
    );
  }

  return null;
};
