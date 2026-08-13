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
    return (imgs || '')
      .split(',')
      .filter(Boolean)
      .map((url, i) => ({
        id: `${url}-${i}`,
        url,
        thumbUrl: url,
      }));
  }, [imgs]);

  const configsList = useMemo<ImgConfig[]>(() => {
    return (imgConfigs || []).map((config, i) => ({
      id: `${config?.url || ''}-${i}`,
      url: config?.url || '',
      thumbUrl: config?.thumbUrl || config?.url || '',
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
    switch (count) {
      case 1:
        return { display: 'grid', gap: '0.25rem', gridTemplateColumns: '1fr', maxWidth: '82%' };
      case 2:
        return { display: 'grid', gap: '0.25rem', gridTemplateColumns: '1fr 1fr', maxWidth: '90%' };
      case 3:
        return { display: 'grid', gap: '0.25rem', gridTemplateColumns: '1fr 1fr 1fr' };
      case 4:
        return { display: 'grid', gap: '0.25rem', gridTemplateColumns: '1fr 1fr', maxWidth: '85%' };
      default:
        return { display: 'grid', gap: '0.25rem', gridTemplateColumns: '1fr 1fr 1fr' };
    }
  }, [isEditMode, imagesList.length, activeConfigs.length]);

  if (isEditMode && imagesList.length > 0) {
    return (
      <div ref={sortableContainerRef} style={gridStyle} className="mt-1 mb-0.5">
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
              className="cursor-move rounded-[6px] w-full h-full object-cover border border-black/5 dark:border-white/10"
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

  if (activeConfigs.length === 1 && !isEditMode) {
    const imgConfig = activeConfigs[0];
    return (
      <MyFancyBox>
        <div className="mt-1 mb-0.5">
          <a
            href={imgConfig.url}
            data-src={imgConfig.url}
            className="inline-block overflow-hidden rounded-[6px] max-w-[85%] sm:max-w-[70%]"
          >
            <img
              src={imgConfig.thumbUrl}
              alt=""
              className="cursor-zoom-in rounded-[6px] w-auto h-auto max-h-[260px] sm:max-h-[300px] object-cover transition-transform hover:scale-[1.02]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = imgConfig.url;
              }}
            />
          </a>
        </div>
      </MyFancyBox>
    );
  }

  if (activeConfigs.length > 0) {
    return (
      <MyFancyBox>
        <div style={gridStyle} className="mt-1 mb-0.5">
          {activeConfigs.map((imgConfig) => (
            <a
              key={imgConfig.id}
              href={imgConfig.url}
              data-src={imgConfig.url}
              className="block overflow-hidden rounded-[6px] w-full aspect-square max-h-[300px]"
            >
              <img
                src={imgConfig.thumbUrl}
                alt=""
                className="cursor-zoom-in rounded-[6px] w-full h-full object-cover transition-transform hover:scale-105"
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
