import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Upload } from 'lucide-react';

export interface FileInputProps {
  accept?: string;
  multiple?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  /** 在线地址值（传入后启用合并模式：左侧上传按钮 + 右侧 URL 输入框） */
  urlValue?: string;
  /** URL 变更回调 */
  onUrlChange?: (value: string) => void;
  /** URL 输入框 placeholder */
  urlPlaceholder?: string;
  /** 预览图地址（通常与 urlValue 相同），传入时在最右侧显示缩略图 */
  previewSrc?: string;
  /** 预览图 className（圆角等） */
  previewClassName?: string;
}

const FileInput: React.FC<FileInputProps> = ({
  accept,
  multiple,
  onChange,
  className,
  urlValue,
  onUrlChange,
  urlPlaceholder = '输入在线地址',
  previewSrc,
  previewClassName,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFileName(
        files.length === 1 ? files[0].name : `已选择 ${files.length} 个文件`
      );
    } else {
      setFileName('');
    }
    onChange?.(e);
  };

  const isComboMode = urlValue !== undefined;

  // 合并模式：上传按钮 + URL 输入框 + 预览图 在同一行
  if (isComboMode) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center h-9 flex-1 min-w-0 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleButtonClick}
            className="inline-flex items-center gap-1 px-2.5 h-full text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-700 rounded-l-md border-r border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors shrink-0 select-none cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            上传
          </button>
          <input
            type="text"
            value={urlValue}
            onChange={(e) => onUrlChange?.(e.target.value)}
            placeholder={urlPlaceholder}
            className="flex-1 min-w-0 h-full px-2.5 text-xs bg-transparent text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none"
          />
        </div>
        {previewSrc && (
          <img
            src={previewSrc}
            alt="预览"
            className={cn(
              'w-9 h-9 shrink-0 border border-neutral-200 dark:border-neutral-700 object-cover bg-neutral-50 dark:bg-neutral-900',
              previewClassName || 'rounded-md p-0.5'
            )}
          />
        )}
      </div>
    );
  }

  // 简单模式：纯文件上传按钮
  return (
    <div
      className={cn(
        'flex items-center h-9 w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 cursor-pointer',
        className
      )}
      onClick={handleButtonClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
      <span className="inline-flex items-center gap-1 px-2.5 h-full text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-700 rounded-l-md border-r border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors shrink-0 select-none">
        <Upload className="w-3.5 h-3.5" />
        选择文件
      </span>
      <span className="flex-1 min-w-0 truncate px-3 text-xs text-neutral-500 dark:text-neutral-400 select-none">
        {fileName || '未选择任何文件'}
      </span>
    </div>
  );
};
FileInput.displayName = 'FileInput';

export { FileInput };
