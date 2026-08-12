import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router';
import { MapPin } from 'lucide-react';
import { Header } from '@/components/header';
import { Memo } from '@/components/memo';
import { useGlobalStore } from '@/store';
import { useMyFetch } from '@/lib/api';
import type { MemoVO, UserVO } from '@/types';

// 高德地图 SDK 动态加载函数
const loadAmapSDK = (key: string, securityCode?: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).AMap) {
      resolve((window as any).AMap);
      return;
    }
    if (securityCode) {
      (window as any)._AMapSecurityConfig = { securityJsCode: securityCode };
    }
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.PlaceSearch,AMap.Geolocation,AMap.Geocoder`;
    script.onerror = reject;
    script.onload = () => resolve((window as any).AMap);
    document.head.appendChild(script);
  });
};

export const LocationPage: React.FC = () => {
  const params = useParams();
  const username = params.username || '';
  const locationName = params.location || '';

  const sysConfig = useGlobalStore((state) => state.sysConfig);
  const amapKey = sysConfig.enableAmap && sysConfig.amapKey ? sysConfig.amapKey : '';
  const amapSecurityCode = sysConfig.amapSecurityJsCode;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const amapInstanceRef = useRef<any>(null);

  const memoReloadTrigger = useGlobalStore((state) => state.memoReloadTrigger);
  const memoChangedId = useGlobalStore((state) => state.memoChangedId);

  const [user, setUser] = useState<UserVO | null>(null);
  const [memos, setMemos] = useState<MemoVO[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadMoreEleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (username) {
        try {
          const res = await useMyFetch<UserVO>(`/user/profile/${encodeURIComponent(username)}`);
          setUser(res);
        } catch (e) {}
      }
    };
    fetchUser();
  }, [username]);

  const reload = useCallback(async () => {
    if (!locationName) return;
    setPage(1);
    try {
      const res = await useMyFetch<{
        list: MemoVO[];
        total: number;
        hasNext: boolean;
      }>('/memo/list', { page: 1, size: 10, location: locationName });

      setMemos(res.list || []);
      setHasNext(res.hasNext);
    } catch (err) {
      console.error('获取地理位置 Memo 列表失败:', err);
    }
  }, [locationName]);

  const loadMore = useCallback(async () => {
    if (loading || !hasNext || !locationName) return;
    setLoading(true);
    const nextPage = page + 1;
    try {
      const res = await useMyFetch<{
        list: MemoVO[];
        total: number;
        hasNext: boolean;
      }>('/memo/list', { page: nextPage, size: 10, location: locationName });

      setMemos((prev) => [...prev, ...(res.list || [])]);
      setPage(nextPage);
      setHasNext(res.hasNext);
    } catch (err) {
      console.error('加载更多失败:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasNext, locationName, page]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (memoReloadTrigger > 0) reload();
  }, [memoReloadTrigger, reload]);

  useEffect(() => {
    if (memoChangedId > 0) {
      useMyFetch<MemoVO>(`/memo/get?latest=1&id=${memoChangedId}`).then((res) => {
        if (res) {
          setMemos((prev) =>
            prev.map((item) => (item.id === memoChangedId ? res : item))
          );
        }
      });
    }
  }, [memoChangedId]);

  useEffect(() => {
    if (!hasNext || !loadMoreEleRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreEleRef.current);
    return () => observer.disconnect();
  }, [hasNext, loadMore]);

  // OpenStreetMap Nominatim 兜底
  const mapUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`;
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  // 地理编码解析与高德/OpenStreetMap 地图渲染
  useEffect(() => {
    if (!locationName) return;

    if (amapKey) {
      loadAmapSDK(amapKey, amapSecurityCode)
        .then((AMap) => {
          AMap.plugin(['AMap.Geocoder'], () => {
            const geocoder = new AMap.Geocoder();
            geocoder.getLocation(locationName, (status: string, result: any) => {
              if (status === 'complete' && result.geocodes.length) {
                const loc = result.geocodes[0].location;
                setCoords({ lat: loc.lat, lng: loc.lng });
                if (mapContainerRef.current) {
                  const map = new AMap.Map(mapContainerRef.current, {
                    center: [loc.lng, loc.lat],
                    zoom: 14,
                  });
                  new AMap.Marker({
                    position: [loc.lng, loc.lat],
                    map: map,
                    title: locationName,
                  });
                  amapInstanceRef.current = map;
                }
              }
            });
          });
        })
        .catch(() => {});
    } else {
      fetch(mapUrl)
        .then(r => r.json())
        .then(data => {
          if (data && data.length > 0) {
            setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
          }
        })
        .catch(() => {});
    }
  }, [locationName, amapKey, amapSecurityCode, mapUrl]);

  const embedMapUrl = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.02}%2C${coords.lat - 0.02}%2C${coords.lng + 0.02}%2C${coords.lat + 0.02}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`
    : '';

  return (
    <>
      {user && <Header user={user} />}
      
      {/* 顶部地图或地址信息展示 */}
      <div className="p-4 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
        <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 bg-gradient-to-br from-sky-50/80 via-neutral-50 to-sky-100/50 dark:from-neutral-800 dark:to-neutral-900 shadow-sm flex items-center justify-center">
          {amapKey ? (
            <div ref={mapContainerRef} className="w-full h-full" />
          ) : (
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-10 h-10 rounded-full bg-sky-500/15 flex items-center justify-center text-sky-500 mb-2 shadow-xs">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-base font-bold text-neutral-800 dark:text-neutral-100">{locationName}</span>
              <span className="text-xs text-neutral-400 mt-0.5">自定义地理位置</span>
            </div>
          )}
          
          {amapKey && (
            <div className="absolute top-3 left-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md text-neutral-800 dark:text-neutral-100 px-3 py-1.5 rounded-xl shadow-md border border-neutral-200/80 dark:border-neutral-700/80 flex items-center gap-1.5 z-10">
              <MapPin className="w-4 h-4 text-sky-500" />
              <span className="text-sm font-bold">{locationName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col divide-y divide-[#C0BEBF]/20 min-h-[400px]">
        {memos.map((m) => (
          <Memo key={m.id} memo={m} />
        ))}
        {memos.length === 0 && !loading && (
          <div className="text-center py-10 text-neutral-500 text-sm">
            该地点暂无动态
          </div>
        )}
      </div>
      
      {hasNext ? (
        <div
          ref={loadMoreEleRef}
          className="text-xs text-center text-neutral-500 py-4 cursor-pointer hover:text-neutral-800 dark:hover:text-neutral-200 transition"
          onClick={loadMore}
        >
          {loading ? '加载中...' : '点击加载更多'}
        </div>
      ) : (
        memos.length > 0 && <div className="text-xs text-center text-neutral-400 py-4">已经到底啦</div>
      )}
    </>
  );
};
