import React, { useState } from 'react';
import { useGlobalStore } from '@/store';

export const Footer: React.FC = () => {
  const sysConfig = useGlobalStore((state) => state.sysConfig);
  const [starsLoadFailed, setStarsLoadFailed] = useState(false);

  return (
    <div className="footer p-4 flex justify-center items-center text-xs">
      <div className="flex flex-col gap-1 items-center">
        {!starsLoadFailed && (
          <a
            href="https://github.com/kingwrcy/moments"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://img.shields.io/github/stars/kingwrcy/moments"
              className="h-6 inline-block mr-1"
              alt="github"
              onError={() => setStarsLoadFailed(true)}
            />
          </a>
        )}
        {sysConfig.beiAnNo && (
          <a
            className="my-2 text-gray-500 hover:underline"
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {sysConfig.beiAnNo}
          </a>
        )}
      </div>
    </div>
  );
};
