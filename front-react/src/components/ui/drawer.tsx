import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface DrawerContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DrawerContext = React.createContext<DrawerContextValue>({
  open: false,
  setOpen: () => {},
});

/* ── Drawer Root ── */
interface DrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ open: controlledOpen, onOpenChange, children }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) setInternalOpen(value);
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );

  return (
    <DrawerContext.Provider value={{ open, setOpen }}>
      {children}
    </DrawerContext.Provider>
  );
};

/* ── DrawerTrigger ── */
interface DrawerTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

export const DrawerTrigger: React.FC<DrawerTriggerProps> = ({ asChild, children }) => {
  const { setOpen } = React.useContext(DrawerContext);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        handleClick(e);
        (children as React.ReactElement<any>).props.onClick?.(e);
      },
    });
  }

  return <button type="button" onClick={handleClick}>{children}</button>;
};

/* ── DrawerContent ── */
interface DrawerContentProps {
  className?: string;
  children: React.ReactNode;
  title?: string;
}

export const DrawerContent: React.FC<DrawerContentProps> = ({ className, children, title }) => {
  const { open, setOpen } = React.useContext(DrawerContext);
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // 触摸下拉关闭手势
  const touchStartY = useRef(0);
  const touchDeltaY = useRef(0);
  const isDragging = useRef(false);

  const ANIMATION_DURATION = 280;

  const doClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setMounted(false);
      setOpen(false);
    }, ANIMATION_DURATION);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      // 禁止背景滚动
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open && mounted && !closing) {
      setMounted(false);
    }
  }, [open, mounted, closing]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !panelRef.current) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    touchDeltaY.current = delta;
    if (delta > 0) {
      panelRef.current.style.transform = `translateY(${delta}px)`;
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (!panelRef.current) return;

    if (touchDeltaY.current > 80) {
      // 下拉距离够，关闭
      doClose();
    } else {
      // 弹回
      panelRef.current.style.transform = '';
    }
    touchDeltaY.current = 0;
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/40"
        style={{
          animation: closing
            ? `drawer-overlay-out ${ANIMATION_DURATION}ms ease-out forwards`
            : `drawer-overlay-in ${ANIMATION_DURATION}ms ease-out forwards`,
        }}
        onClick={doClose}
      />

      {/* 抽屉面板 */}
      <div
        ref={panelRef}
        className={cn(
          'absolute bottom-0 left-0 right-0 w-full max-w-none bg-white dark:bg-neutral-900 rounded-t-2xl border-t border-neutral-200/60 dark:border-neutral-800 shadow-[0_-8px_32px_rgba(0,0,0,0.16)] max-h-[85vh] overflow-y-auto flex flex-col',
          className
        )}
        style={{
          animation: closing
            ? `drawer-slide-out ${ANIMATION_DURATION}ms ease-out forwards`
            : `drawer-slide-in ${ANIMATION_DURATION}ms cubic-bezier(0.32, 0.72, 0, 1) forwards`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 顶部拖拽提手区 */}
        <div className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing">
          <div className="w-8 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600 opacity-60" />
        </div>

        {/* 标题栏 */}
        {title && (
          <div className="px-5 pt-0.5 pb-1 text-center">
            <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight">
              {title}
            </span>
          </div>
        )}

        {/* 内容区 */}
        <div className="px-5 pt-1 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col gap-2.5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
