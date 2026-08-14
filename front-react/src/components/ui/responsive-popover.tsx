import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Drawer, DrawerTrigger, DrawerContent } from '@/components/ui/drawer';

/* ── useMediaQuery hook ── */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/* ── ResponsivePopover ── */
interface ResponsivePopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const ResponsivePopover: React.FC<ResponsivePopoverProps> = ({
  open,
  onOpenChange,
  children,
}) => {
  const isDesktop = useMediaQuery('(min-width: 640px)');

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {children}
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {children}
    </Drawer>
  );
};

/* ── ResponsivePopoverTrigger ── */
interface ResponsivePopoverTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export const ResponsivePopoverTrigger: React.FC<ResponsivePopoverTriggerProps> = ({
  asChild,
  children,
}) => {
  const isDesktop = useMediaQuery('(min-width: 640px)');

  if (isDesktop) {
    return <DialogTrigger asChild={asChild}>{children}</DialogTrigger>;
  }

  return <DrawerTrigger asChild={asChild}>{children}</DrawerTrigger>;
};

/* ── 清理 Drawer class ── */
function getDrawerClassName(className?: string): string {
  if (!className) return '';
  return className
    .split(/\s+/)
    .filter((c) => {
      if (c.startsWith('w-') || c.startsWith('max-w-') || c.startsWith('min-w-')) return false;
      if (c.startsWith('p-') || c.startsWith('px-') || c.startsWith('py-') || c.startsWith('padding')) return false;
      return true;
    })
    .join(' ');
}

/* ── ResponsivePopoverContent ── */
interface ResponsivePopoverContentProps {
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  title?: string;
  children: React.ReactNode;
}

export const ResponsivePopoverContent: React.FC<ResponsivePopoverContentProps> = ({
  className,
  title,
  children,
}) => {
  const isDesktop = useMediaQuery('(min-width: 640px)');

  if (isDesktop) {
    return (
      <DialogContent
        className={`rounded-2xl border border-neutral-100 dark:border-neutral-800/80 shadow-2xl bg-white dark:bg-neutral-900 p-5 sm:max-w-[360px] ${
          className || ''
        }`}
      >
        {title && (
          <DialogHeader className="pb-2 mb-1 border-b border-neutral-100/80 dark:border-neutral-800/60">
            <DialogTitle className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {title}
            </DialogTitle>
          </DialogHeader>
        )}
        <div className="space-y-3">{children}</div>
      </DialogContent>
    );
  }

  const drawerClass = getDrawerClassName(className);

  return (
    <DrawerContent title={title} className={drawerClass}>
      {children}
    </DrawerContent>
  );
};


