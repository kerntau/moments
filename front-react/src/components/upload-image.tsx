import React, { useState } from 'react';
import { toast } from 'sonner';
import { Image as ImageIcon, Plus, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ImageIcon className="cursor-pointer w-6 h-6 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition" />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 flex flex-col gap-3" side="top">
        <div className="text-xs text-neutral-500 font-medium">本地上传图片</div>
        <Input type="file" accept="image/*" multiple onChange={handleUpload} className="text-xs cursor-pointer" />

        {imgList.map((img, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input className="flex-1 text-xs h-8" value={img} readOnly />
            <X className="w-5 h-5 cursor-pointer text-neutral-400 hover:text-red-500" onClick={() => removeImg(i)} />
          </div>
        ))}

        <div className="flex items-center gap-2">
          <Input
            placeholder="输入图片外链 URL"
            className="flex-1 text-xs h-8"
            value={imgUrlToAdd}
            onChange={(e) => setImgUrlToAdd(e.target.value)}
          />
          <Plus className="w-5 h-5 cursor-pointer text-neutral-400 hover:text-neutral-700 dark:hover:text-white" onClick={addImg} />
        </div>

        {filename && (
          <div className="text-xs text-neutral-400 space-y-1">
            <p>正在上传({current}/{total})</p>
            <p className="truncate">{filename}</p>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#9fc84a] h-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end mt-2">
          <Button size="sm" onClick={() => setOpen(false)}>
            确定
          </Button>
          <Button size="sm" variant="outline" onClick={clear}>
            清空并关闭
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
