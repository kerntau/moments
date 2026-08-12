import React, { useState } from 'react';
import { toast } from 'sonner';
import { Image as ImageIcon, Plus, X } from 'lucide-react';
import { ResponsivePopover, ResponsivePopoverContent, ResponsivePopoverTrigger } from '@/components/ui/responsive-popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileInput } from '@/components/ui/file-input';
import { useUpload } from '@/lib/upload';

interface UploadImageProps {
  imgs: string;
  onChange: (newImgs: string) => void;
}

export const UploadImage: React.FC<UploadImageProps> = ({ imgs, onChange }) => {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filename, setFilename] = useState('');
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(0);
  const [imgUrlToAdd, setImgUrlToAdd] = useState('');

  const imgList = imgs.split(',').filter(Boolean);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const containsOtherFile = Array.from(files).some((file) => !file.type.startsWith('image/'));
    if (containsOtherFile) {
      toast.error('只能上传图片');
      return;
    }

    try {
      const result = await useUpload(files, (totalSize, index, name, p) => {
        setProgress(Math.round(p * 100));
        setFilename(name);
        setTotal(totalSize);
        setCurrent(index);
      });

      if (result && result.length) {
        toast.success('上传成功');
        const updated = [...imgList, ...result].filter(Boolean).join(',');
        onChange(updated);
        setProgress(0);
        setFilename('');
      }
    } catch (err: any) {
      toast.error(err?.message || '上传异常');
    }
  };

  const addImg = () => {
    if (!imgUrlToAdd.trim()) return;
    const updated = [...imgList, imgUrlToAdd.trim()].filter(Boolean).join(',');
    onChange(updated);
    setImgUrlToAdd('');
  };

  const removeImg = (index: number) => {
    const updatedList = [...imgList];
    updatedList.splice(index, 1);
    onChange(updatedList.join(','));
  };

  const clear = () => {
    onChange('');
    setOpen(false);
  };

  return (
    <ResponsivePopover open={open} onOpenChange={setOpen}>
      <ResponsivePopoverTrigger asChild>
        <ImageIcon className="cursor-pointer w-6 h-6 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition" />
      </ResponsivePopoverTrigger>
      <ResponsivePopoverContent className="w-full sm:w-[540px] p-4.5 flex flex-col gap-3.5" side="top" title="上传图片">
        <div className="text-xs text-neutral-500 font-medium px-0.5">本地上传图片</div>
        <FileInput accept="image/*" multiple onChange={handleUpload} />

        {imgList.map((img, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input className="flex-1" value={img} readOnly />
            <X className="w-5 h-5 cursor-pointer text-neutral-400 hover:text-red-500 shrink-0 transition" onClick={() => removeImg(i)} />
          </div>
        ))}

        <div className="flex items-center gap-2">
          <Input
            placeholder="输入图片外链 URL"
            className="flex-1"
            value={imgUrlToAdd}
            onChange={(e) => setImgUrlToAdd(e.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-10 px-3 rounded-xl border-neutral-200 dark:border-neutral-700 text-xs font-medium shrink-0"
            onClick={addImg}
          >
            添加外链
          </Button>
        </div>

        {filename && (
          <div className="text-xs text-neutral-400 space-y-1.5 p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
            <p className="font-medium text-neutral-600 dark:text-neutral-300">正在上传({current}/{total})</p>
            <p className="truncate text-[11px] text-neutral-400">{filename}</p>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-sky-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2 mt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-10 rounded-xl border-none bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-medium text-sm"
            onClick={clear}
          >
            清空关闭
          </Button>
          <Button
            size="sm"
            className="flex-1 h-10 rounded-xl border-none bg-sky-500 hover:bg-sky-600 text-white font-medium shadow-sm text-sm"
            onClick={() => setOpen(false)}
          >
            确定
          </Button>
        </div>
      </ResponsivePopoverContent>
    </ResponsivePopover>
  );
};
