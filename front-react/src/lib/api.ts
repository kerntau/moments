import type { ResultVO } from '@/types';
import { useGlobalStore } from '@/store';
import { toast } from 'sonner';

export const useMyFetch = async <T>(url: string, data?: any): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const userinfo = useGlobalStore.getState().userinfo;
  if (userinfo && userinfo.token) {
    headers['x-api-token'] = userinfo.token;
  }

  const response = await fetch(`/api${url}`, {
    method: 'POST',
    body: data !== undefined ? JSON.stringify(data) : null,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const res: ResultVO<T> = await response.json();

  if (!res || res.code !== 0) {
    if (!res) {
      throw new Error('请求失败');
    }

    if (res.code === 3 || res.code === 4) {
      useGlobalStore.getState().setUserinfo({});
      throw new Error(res.message || '未授权登录');
    }

    throw new Error(res.message || '请求失败');
  }

  return res.data;
};
