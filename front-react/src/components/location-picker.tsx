import React, { useState, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { MapPin, Navigation, Search, Check, Ban, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGlobalStore } from '@/store';

interface LocationPickerProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
}

interface POIItem {
  id: string;
  name: string; // 主地名
  address: string; // 详细地址/行政区
  rawLocation: string; // 存储字段 (如 "深圳市 腾讯大厦")
  lat?: number;
  lng?: number;
}

// 微信朋友圈式预设热门 POI 列表
const DEFAULT_POIS: POIItem[] = [
  {
    id: 'city-sz',
    name: '深圳市',
    address: '广东省 · 深圳市',
    rawLocation: '深圳市',
  },
  {
    id: 'poi-tencent',
    name: '腾讯大厦',
    address: '广东省深圳市南山区深南大道9988号',
    rawLocation: '深圳市 腾讯大厦',
  },
  {
    id: 'poi-mixc',
    name: '万象城',
    address: '广东省深圳市罗湖区嘉宾路2001号',
    rawLocation: '深圳市 万象城',
  },
  {
    id: 'poi-sanlitun',
    name: '三里屯太古里',
    address: '北京市朝阳区三里屯路19号',
    rawLocation: '北京市 三里屯太古里',
  },
  {
    id: 'poi-xihu',
    name: '西湖风景名胜区',
    address: '浙江省杭州市西湖区龙井路1号',
    rawLocation: '杭州市 西湖景区',
  },
  {
    id: 'poi-zhujiang',
    name: '珠江新城',
    address: '广东省广州市天河区华夏路',
    rawLocation: '广州市 珠江新城',
  },
  {
    id: 'poi-taikooli',
    name: '成都远洋太古里',
    address: '四川省成都市锦江区中纱帽街8号',
    rawLocation: '成都市 太古里',
  },
];

// 高德地图 SDK 动态加载单例
let amapPromise: Promise<any> | null = null;
let amapLoadFailed = false;

const loadAmapSDK = (key: string, securityCode?: string): Promise<any> => {
  if (amapLoadFailed) {
    return Promise.reject(new Error('高德地图网络连接失败'));
  }
  if ((window as any).AMap) {
    return Promise.resolve((window as any).AMap);
  }
  if (amapPromise) {
    return amapPromise;
  }

  amapPromise = new Promise((resolve, reject) => {
    if (securityCode) {
      (window as any)._AMapSecurityConfig = { securityJsCode: securityCode };
    }
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.PlaceSearch,AMap.Geolocation,AMap.Geocoder`;
    script.onerror = (err) => {
      amapLoadFailed = true;
      amapPromise = null;
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      reject(err);
    };
    script.onload = () => {
      resolve((window as any).AMap);
    };
    document.head.appendChild(script);
  });

  return amapPromise;
};

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  onConfirm,
}) => {
  const sysConfig = useGlobalStore((state) => state.sysConfig);
  const amapKey = sysConfig.enableAmap && sysConfig.amapKey ? sysConfig.amapKey : '';
  const amapSecurityCode = sysConfig.amapSecurityJsCode;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const amapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<POIItem[]>([]);
  const [nearbyPois, setNearbyPois] = useState<POIItem[]>([]);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>({
    lat: 39.9042,
    lng: 116.4074,
  });

  // 高德矢量地图初始化、坐标移动与点击选点写入
  useEffect(() => {
    if (amapKey && mapContainerRef.current && coords) {
      loadAmapSDK(amapKey, amapSecurityCode)
        .then((AMap) => {
          if (!amapInstanceRef.current) {
            const isDark = document.documentElement.classList.contains('dark');
            const mapStyle = isDark ? 'amap://styles/dark' : 'amap://styles/fresh';

            const map = new AMap.Map(mapContainerRef.current, {
              center: [coords.lng, coords.lat],
              zoom: 15,
              mapStyle: mapStyle,
              viewMode: '2D',
            });

            const markerContent = document.createElement('div');
            markerContent.innerHTML = `
              <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div style="position: absolute; bottom: 0px; width: 14px; height: 4px; background: rgba(0,0,0,0.2); border-radius: 50%; filter: blur(1.5px);"></div>
                <div style="position: absolute; width: 26px; height: 26px; background: rgba(14, 165, 233, 0.25); border-radius: 50%; animation: map-pulse 2s infinite ease-out;"></div>
                <div style="position: relative; width: 20px; height: 20px; background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%); border: 2px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 10px rgba(2, 132, 199, 0.4); display: flex; align-items: center; justify-content: center; margin-bottom: 6px;">
                  <div style="width: 5px; height: 5px; background: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
                </div>
              </div>
            `;

            const marker = new AMap.Marker({
              position: [coords.lng, coords.lat],
              map: map,
              content: markerContent,
              offset: new AMap.Pixel(-10, -20),
            });
            amapInstanceRef.current = map;
            markerInstanceRef.current = marker;

            // 高德地图点击选点
            map.on('click', (e: any) => {
              const { lng, lat } = e.lnglat;
              setCoords({ lat, lng });
              marker.setPosition([lng, lat]);
            });
          } else {
            amapInstanceRef.current.setCenter([coords.lng, coords.lat]);
            markerInstanceRef.current.setPosition([coords.lng, coords.lat]);
          }
        })
        .catch(() => {
          // 静默降级，避免网络断连时控制台高频刷屏
        });
    }
  }, [amapKey, amapSecurityCode, coords]);

  // 当地图坐标 coords 改变时，自动反查高德周边 500 米热点 POI 并联动刷新下方列表
  useEffect(() => {
    if (!coords) return;
    const { lng, lat } = coords;

    if (amapKey) {
      loadAmapSDK(amapKey, amapSecurityCode)
        .then((AMap) => {
          AMap.plugin(['AMap.PlaceSearch', 'AMap.Geocoder'], () => {
            // 1. 周边 POI 检索 (扩大至 20 条记录)
            const placeSearch = new AMap.PlaceSearch({
              pageSize: 20,
              pageIndex: 1,
            });
            placeSearch.searchNearBy('', [lng, lat], 500, (status: string, result: any) => {
              if (status === 'complete' && result.poiList && result.poiList.pois) {
                const pois: POIItem[] = result.poiList.pois.map((poi: any, idx: number) => {
                  const rawLoc = `${poi.cityname || poi.pname || ''} · ${poi.name}`;
                  return {
                    id: `nearby-${poi.id || idx}`,
                    name: poi.name,
                    address: poi.address || `${poi.pname || ''}${poi.cityname || ''}${poi.adname || ''}`,
                    rawLocation: rawLoc,
                    lat: poi.location ? poi.location.lat : undefined,
                    lng: poi.location ? poi.location.lng : undefined,
                  };
                });
                setNearbyPois(pois);
              }
            });

            // 2. 逆地理编码获得当前点精密地名并写入
            const geocoder = new AMap.Geocoder();
            geocoder.getAddress([lng, lat], (status: string, result: any) => {
              if (status === 'complete' && result.regeocode) {
                const addr = result.regeocode.addressComponent;
                const formatted = [
                  addr.city || addr.province,
                  addr.district,
                  addr.township || addr.street || result.regeocode.formattedAddress?.split(addr.district)[1] || '',
                ]
                  .filter(Boolean)
                  .join(' ');
                const mainName = formatted || result.regeocode.formattedAddress;
                if (mainName) {
                  onChangeRef.current(mainName);
                }
              }
            });
          });
        })
        .catch(() => {});
    }
  }, [coords, amapKey, amapSecurityCode]);

  // 防抖并发起真实地图 POI 检索 (支持高德官方与 OpenStreetMap)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchOsmPoi = async (query: string): Promise<POIItem[]> => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&accept-language=zh-CN&addressdetails=1&limit=10`
        );
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((item: any, idx: number) => {
            const addr = item.address || {};
            const city = addr.city || addr.town || addr.province || addr.state || addr.country || '';
            const district = addr.suburb || addr.district || addr.county || '';
            const mainName = item.name || item.display_name.split(',')[0];
            const rawLoc = [city, district, mainName].filter(Boolean).join(' ');

            return {
              id: `osm-${item.place_id || idx}`,
              name: mainName,
              address: item.display_name,
              rawLocation: rawLoc,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            };
          });
        }
      } catch (e) {
        console.error('OpenStreetMap POI 检索失败:', e);
      }
      return [];
    };

    const timer = setTimeout(async () => {
      setSearching(true);
      if (amapKey) {
        try {
          const AMap = await loadAmapSDK(amapKey, amapSecurityCode);
          AMap.plugin(['AMap.PlaceSearch'], () => {
            const placeSearch = new AMap.PlaceSearch({ pageSize: 20 });
            placeSearch.search(searchQuery.trim(), async (status: string, result: any) => {
              if (status === 'complete' && result.poiList && result.poiList.pois && result.poiList.pois.length > 0) {
                const pois: POIItem[] = result.poiList.pois.map((poi: any, idx: number) => {
                  const rawLoc = [poi.cityname || poi.pname, poi.adname, poi.name].filter(Boolean).join(' ');
                  return {
                    id: `amap-${poi.id || idx}`,
                    name: poi.name,
                    address: poi.address || `${poi.pname || ''}${poi.cityname || ''}${poi.adname || ''}`,
                    rawLocation: rawLoc,
                    lat: poi.location ? poi.location.lat : undefined,
                    lng: poi.location ? poi.location.lng : undefined,
                  };
                });
                setSearchResults(pois);
                setSearching(false);
              } else {
                // 高德仅支持国内/港澳台；对海外搜索或无高德数据时，自动降级切换 OpenStreetMap 全球搜索
                const osmPois = await searchOsmPoi(searchQuery.trim());
                setSearchResults(osmPois);
                setSearching(false);
              }
            });
          });
        } catch (e) {
          console.error('高德 POI 检索失败:', e);
          const osmPois = await searchOsmPoi(searchQuery.trim());
          setSearchResults(osmPois);
          setSearching(false);
        }
      } else {
        // 无高德 Key 时，直接使用 OpenStreetMap 全球地图检索
        const osmPois = await searchOsmPoi(searchQuery.trim());
        setSearchResults(osmPois);
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, amapKey, amapSecurityCode]);

  // GPS 自动定位与逆地理编码
  const handleGetCurrentLocation = () => {
    const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    setLocating(true);
    toast.info(isHttps ? '正在获取当前地理位置...' : '正在尝试定位（移动端建议在 HTTPS 协议下访问）...');

    if (amapKey) {
      loadAmapSDK(amapKey, amapSecurityCode)
        .then((AMap) => {
          AMap.plugin(['AMap.Geolocation'], () => {
            const geolocation = new AMap.Geolocation({
              enableHighAccuracy: true,
              timeout: 10000,
            });
            geolocation.getCurrentPosition((status: string, result: any) => {
              setLocating(false);
              if (status === 'complete' && result.position) {
                const lat = result.position.lat;
                const lng = result.position.lng;
                setCoords({ lat, lng });
                const addr = result.addressComponent || {};
                const formatted = [
                  addr.city || addr.province,
                  addr.district,
                  addr.township || addr.street || result.formattedAddress?.split(addr.district)[1] || '',
                ]
                  .filter(Boolean)
                  .join(' ');
                if (formatted) {
                  onChangeRef.current(formatted);
                  toast.success('已使用高德地图精准定位');
                } else if (result.formattedAddress) {
                  onChangeRef.current(result.formattedAddress);
                  toast.success('已获取定位');
                }
              } else {
                if (!isHttps) {
                  toast.error('定位失败：移动端浏览器需在 HTTPS 安全协议下并开启位置访问权限');
                } else {
                  toast.error('高德定位失败，请检查浏览器位置访问权限');
                }
              }
            });
          });
        })
        .catch(() => {
          setLocating(false);
          toast.error('高德 SDK 加载失败');
        });
      return;
    }

    // OpenStreetMap GPS 定位兜底
    if (!navigator.geolocation) {
      toast.error('当前浏览器不支持 GPS 定位');
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=zh-CN`
          );
          const data = await res.json();

          if (data && data.address) {
            const addr = data.address;
            const city = addr.city || addr.town || addr.province || addr.state || '城市';
            const district = addr.suburb || addr.district || addr.county || addr.borough || '';
            const road = addr.road || addr.pedestrian || addr.amenity || addr.building || '';

            const formatted = [city, district, road].filter(Boolean).join(' ');
            if (formatted) {
              onChange(formatted);
              toast.success('已定位并填充当前位置');
            } else if (data.display_name) {
              onChange(data.display_name.split(',')[0]);
              toast.success('已获取定位');
            }
          } else {
            toast.warning('获取定位成功，但未能解析具体地名');
          }
        } catch (e) {
          toast.error('逆地理解析失败，请手动输入');
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('未授权获取位置信息');
        } else {
          toast.error('获取定位失败，请检查网络权限');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // 根据搜索关键字过滤列表或优先展示高德地图选点周边的 POI 列表
  const activePois = useMemo(() => {
    if (searchQuery.trim() && searchResults.length > 0) {
      return searchResults;
    }
    if (!searchQuery.trim() && nearbyPois.length > 0) {
      return nearbyPois;
    }
    if (!searchQuery.trim()) return DEFAULT_POIS;
    const q = searchQuery.trim().toLowerCase();
    return DEFAULT_POIS.filter(
      (item) => item.name.toLowerCase().includes(q) || item.address.toLowerCase().includes(q)
    );
  }, [searchQuery, searchResults, nearbyPois]);

  // 判断自定义创建选项
  const isCustomInputAvailable =
    searchQuery.trim().length > 0 &&
    !activePois.some((item) => item.name === searchQuery.trim() || item.rawLocation === searchQuery.trim());

  const handleSelectLocation = (item: POIItem | { rawLocation: string; lat?: number; lng?: number }, autoConfirm = false) => {
    onChangeRef.current(item.rawLocation);
    if (item.lat && item.lng) {
      setCoords({ lat: item.lat, lng: item.lng });
    }
    if (autoConfirm) {
      onConfirmRef.current();
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full select-none pb-2">
      {/* 微信风搜索框（顶级极简置顶） */}
      <div className="relative">
        <Search className={`w-4 h-4 text-neutral-400 absolute left-3.5 top-3 ${searching ? 'animate-spin text-sky-500' : ''}`} />
        <Input
          placeholder="搜索地点或直接输入自定义位置..."
          className="text-sm h-10 rounded-xl pl-10 pr-9 bg-neutral-100 dark:bg-neutral-800/80 border-transparent focus:bg-white dark:focus:bg-neutral-800 focus:border-sky-500/30 focus:ring-2 focus:ring-sky-500/15 transition-all placeholder:text-neutral-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="absolute right-3.5 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition"
            onClick={() => setSearchQuery('')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 高德地图预览卡片 (只有开启时才渲染，避免无谓占用) */}
      {amapKey && (
        <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/60 shadow-xs">
          <div ref={mapContainerRef} className="w-full h-full" />
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={locating}
            className="absolute bottom-2.5 right-2.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md text-neutral-800 dark:text-neutral-100 text-[11px] font-medium px-3 py-1 rounded-full shadow-sm border border-black/5 dark:border-white/10 flex items-center gap-1 active:scale-95 transition-all cursor-pointer z-10"
          >
            <Navigation className={`w-3 h-3 text-sky-500 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? '定位中' : '重新定位'}</span>
          </button>
          <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs border border-white/10 z-10">
            <MapPin className="w-3 h-3 text-sky-400" />
            <span>高德地图服务</span>
          </div>
        </div>
      )}

      {/* 微信 / iOS 极简无界列表 */}
      <div className="flex flex-col rounded-2xl border border-neutral-100 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 max-h-[360px] sm:max-h-[380px] overflow-y-auto px-3 py-1">
        {/* 1. 不显示位置 */}
        <div
          className="flex items-center justify-between py-3 cursor-pointer border-b border-neutral-100 dark:border-neutral-800/60 active:bg-neutral-50 dark:active:bg-neutral-800/50 transition-colors"
          onClick={() => handleSelectLocation({ rawLocation: '' }, true)}
        >
          <div className="flex items-center gap-2.5">
            <Ban className="w-4 h-4 text-neutral-400" />
            <span className="text-[15px] font-normal text-neutral-800 dark:text-neutral-200">不显示位置</span>
          </div>
          {!value && <Check className="w-4 h-4 text-sky-500 font-bold" />}
        </div>

        {/* 2. 搜索框输入的专属“创建自定义位置”入口 (极浅、突出) */}
        {isCustomInputAvailable && (
          <div
            className="flex items-center justify-between py-3 cursor-pointer border-b border-neutral-100 dark:border-neutral-800/60 active:bg-neutral-50 dark:active:bg-neutral-800/50 transition-colors"
            onClick={() => handleSelectLocation({ rawLocation: searchQuery.trim() }, true)}
          >
            <div className="flex flex-col min-w-0 pr-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-500 shrink-0">自定义</span>
                <span className="text-[15px] font-medium text-sky-600 dark:text-sky-400 truncate">
                  {searchQuery.trim()}
                </span>
              </div>
              <span className="text-xs text-neutral-400 mt-0.5">创建并使用此自定义位置</span>
            </div>
            <Plus className="w-4 h-4 text-sky-500 shrink-0" />
          </div>
        )}

        {/* 3. 真实 / 热门 POI 列表 (原生微信朋友圈排版) */}
        {activePois.map((item, idx) => {
          const isSelected = value === item.rawLocation || value === item.name;
          const isLast = idx === activePois.length - 1;
          return (
            <div
              key={item.id}
              className={`flex items-center justify-between py-2.5 cursor-pointer active:bg-neutral-50 dark:active:bg-neutral-800/50 transition-colors ${
                !isLast ? 'border-b border-neutral-100 dark:border-neutral-800/60' : ''
              }`}
              onClick={() => handleSelectLocation(item, true)}
            >
              <div className="flex flex-col min-w-0 pr-3">
                <span
                  className={`text-[15px] font-normal truncate ${
                    isSelected ? 'text-sky-500 font-medium' : 'text-neutral-900 dark:text-neutral-100'
                  }`}
                >
                  {item.name}
                </span>
                <span className="text-xs text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
                  {item.address}
                </span>
              </div>
              {isSelected && <Check className="w-4 h-4 text-sky-500 font-bold shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* 底部功能按钮 */}
      <div className="flex gap-3 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-10 rounded-xl border-none bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-600 dark:text-neutral-300 font-medium text-sm transition-all active:scale-95"
          onClick={() => handleSelectLocation({ rawLocation: '' }, true)}
        >
          清除位置
        </Button>
        <Button
          size="sm"
          className="flex-1 h-10 rounded-xl border-none bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm shadow-xs transition-all active:scale-95"
          onClick={() => {
            if (searchQuery.trim() && !value) {
              onChange(searchQuery.trim());
            }
            onConfirm();
          }}
        >
          确定
        </Button>
      </div>
    </div>
  );
};
