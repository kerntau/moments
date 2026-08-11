import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-auto p-4" side="top">
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{title}</p>
        <div className="flex gap-2 items-center">
          <Button size="sm" onClick={handleOk}>
            确定
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            取消
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
