import { toast } from 'sonner';
import { useGlobalStore } from '@/store';
import { useMyFetch } from './api';

type OnProgressCallback = (progress: number) => void;

export type OnTotalProgressCallback = (
  totalCount: number,
  currentCount: number,
  name: string,
  progress: number
) => void;

const upload2S3WithProgress = async (
  preSignedUrl: string,
  file: File,
  onProgress: OnProgressCallback
): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.addEventListener('load', () => resolve());
    xhr.addEventListener('error', () => reject(new Error('File upload failed')));
    xhr.addEventListener('abort', () => reject(new Error('File upload aborted')));
    xhr.upload.addEventListener('progress', (e) => onProgress(e.loaded / e.total));

    xhr.open('PUT', preSignedUrl, true);
    xhr.send(file);
  });

const upload2S3 = async (
  files: FileList | File[],
  onProgress?: OnTotalProgressCallback
): Promise<string[]> => {
  const result: string[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const file = files[i];
      const res = await useMyFetch<{
        preSignedUrl: string;
        imageUrl: string;
      }>('/file/s3PreSigned', {
        contentType: file.type,
      });

      if (!res || !res.preSignedUrl) {
        toast.error('获取 S3 上传地址失败');
        continue;
      }

      await upload2S3WithProgress(res.preSignedUrl, file, (progress) => {
        if (onProgress) {
          onProgress(files.length, i + 1, file.name, progress);
        }
      });
      result.push(res.imageUrl);
    } catch (err) {
      toast.error(`上传文件到 S3 失败, ${err}`);
    }
  }

  return result;
};

const uploadFile2ServerWithProgress = (
  url: string,
  file: File,
  onProgress: OnProgressCallback
): Promise<string[]> =>
  new Promise<string[]>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.addEventListener('load', () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (!res || res.code !== 0) {
          return reject(new Error(`${res?.message || '请求失败'}`));
        }
        resolve(res.data || []);
      } catch (e) {
        reject(new Error('解析响应失败'));
      }
    });
    xhr.addEventListener('error', () => reject(new Error('File upload failed')));
    xhr.addEventListener('abort', () => reject(new Error('File upload aborted')));
    xhr.upload.addEventListener('progress', (e) => onProgress(e.loaded / e.total));

    xhr.open('POST', url, true);

    const userinfo = useGlobalStore.getState().userinfo;
    if (userinfo && userinfo.token) {
      xhr.setRequestHeader('x-api-token', userinfo.token);
    }

    const formData = new FormData();
    formData.append('files', file);

    xhr.send(formData);
  });

const uploadFile2Server = async (
  files: FileList | File[],
  onProgress?: OnTotalProgressCallback
): Promise<string[]> => {
  const result: string[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const file = files[i];
      if (onProgress) {
        onProgress(files.length, i + 1, file.name, 0);
      }

      const urlList = await uploadFile2ServerWithProgress(
        '/api/file/upload',
        file,
        (progress) => {
          if (onProgress) {
            onProgress(files.length, i + 1, file.name, progress);
          }
        }
      );

      if (!urlList.length) {
        toast.error('上传文件到服务器失败');
        continue;
      }

      result.push(...urlList);
    } catch (e) {
      toast.error(`上传文件到服务器失败, ${e}`);
    }
  }

  return result;
};

export const useUpload = async (
  files: FileList | File[],
  onProgress?: OnTotalProgressCallback
): Promise<string[]> => {
  if (!files || files.length === 0) {
    toast.error('没有选择文件');
    return [];
  }

  const sysConfig = useGlobalStore.getState().sysConfig;
  if (sysConfig && sysConfig.enableS3) {
    return upload2S3(files, onProgress);
  }

  return uploadFile2Server(files, onProgress);
};
