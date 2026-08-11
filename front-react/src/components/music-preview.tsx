import React from 'react';
import type { MetingJSDTO } from '@/types';

export const MusicPreview: React.FC<MetingJSDTO> = ({ id, server, type, api }) => {
  if (!id || !server || !type || !api) return null;

  return React.createElement('meting-js', {
    id,
    server,
    type,
    api,
  });
};
