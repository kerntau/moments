import React, { useEffect, useRef } from 'react';
import { Fancybox } from '@fancyapps/ui/dist/index.esm.js';
import '@fancyapps/ui/dist/fancybox/fancybox.css';

interface MyFancyBoxProps {
  children: React.ReactNode;
  options?: Record<string, any>;
}

function randomHexStr(len = 16, chars = '0123456789abcdefghijklmnopqrstuvwxyz') {
  let str = '';
  let length = chars.length;
  while (len > 0) {
    str += chars[Math.floor(Math.random() * length)];
    len--;
  }
  return str;
}

export const MyFancyBox: React.FC<MyFancyBoxProps> = ({ children, options }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const randomIdRef = useRef<string>(randomHexStr());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const galleryId = `gallery-${randomIdRef.current}`;
    const childrenElements = Array.from(container.children);
    childrenElements.forEach((el) => {
      el.setAttribute('data-fancybox', galleryId);
    });

    Fancybox.bind(`[data-fancybox="${galleryId}"]`, {
      Thumbs: {
        type: 'modern',
      },
      ...(options || {}),
    });

    return () => {
      Fancybox.unbind(`[data-fancybox="${galleryId}"]`);
    };
  }, [options, children]);

  return <div ref={containerRef}>{children}</div>;
};
