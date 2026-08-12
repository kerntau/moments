import React from 'react';
import { useGlobalStore } from '@/store';

export const Footer: React.FC = () => {
  const sysConfig = useGlobalStore((state) => state.sysConfig);

  return (
    <div className="footer p-4 flex justify-center items-center text-xs">
      <div className="flex flex-col gap-1 items-center">
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
