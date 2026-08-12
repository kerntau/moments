import React, { useState } from 'react';
import { ResponsivePopover, ResponsivePopoverContent, ResponsivePopoverTrigger } from '@/components/ui/responsive-popover';
import { Button } from '@/components/ui/button';

interface ConfirmProps {
  children: React.ReactNode;
  title?: string;
  onOk: () => void;
  onCancel?: () => void;
}

export const Confirm: React.FC<ConfirmProps> = ({
  children,
  title = '你确定要删除吗?',
  onOk,
  onCancel,
}) => {
  const [open, setOpen] = useState(false);

  const handleOk = () => {
    setOpen(false);
    onOk();
  };

  const handleCancel = () => {
    setOpen(false);
    if (onCancel) onCancel();
  };

  return (
    <ResponsivePopover open={open} onOpenChange={setOpen}>
      <ResponsivePopoverTrigger asChild>{children}</ResponsivePopoverTrigger>
      <ResponsivePopoverContent className="w-full sm:w-[420px] p-4.5 flex flex-col gap-3.5" side="top" title="操作确认">
        <p className="text-neutral-700 dark:text-neutral-200 text-sm font-medium leading-relaxed">{title}</p>
        <div className="flex gap-2.5 items-center pt-1">
          <Button size="sm" variant="outline" className="flex-1 h-9 rounded-xl border-none bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 text-xs font-medium" onClick={handleCancel}>
            取消
          </Button>
          <Button size="sm" className="flex-1 h-9 rounded-xl border-none bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium shadow-xs" onClick={handleOk}>
            确定
          </Button>
        </div>
      </ResponsivePopoverContent>
    </ResponsivePopover>
  );
};
