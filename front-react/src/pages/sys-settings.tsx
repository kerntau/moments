import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { Header } from '@/components/header';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileInput } from '@/components/ui/file-input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useGlobalStore } from '@/store';
import { useMyFetch } from '@/lib/api';
import { useUpload } from '@/lib/upload';
import type { SysConfigVO, UserVO } from '@/types';

const OAUTH_PROVIDERS = [
  { id: 'github', name: 'GitHub' },
  { id: 'google', name: 'Google' },
];

const OAuthAccountBinding: React.FC = () => {
  const [boundMap, setBoundMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const loadBoundList = async () => {
    try {
      const res = await useMyFetch<Record<string, boolean>>('/oauth/bound');
      if (res) setBoundMap(res);
    } catch (e) {
      console.error('获取 OAuth 绑定列表失败:', e);
    }
  };

  useEffect(() => {
    loadBoundList();
  }, []);

  const handleBind = async (provider: string) => {
    try {
      const res = await useMyFetch<{ url: string }>(`/oauth/${provider}/redirect`);
      if (res && res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      toast.error(err?.message || '获取绑定链接失败');
    }
  };

  const handleUnbind = async (provider: string) => {
    setLoading(true);
    try {
      await useMyFetch('/oauth/unbind', { provider });
      toast.success('解绑成功');
      loadBoundList();
    } catch (err: any) {
      toast.error(err?.message || '解绑失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-700/60 mt-3">
      <label className="font-bold text-xs text-neutral-700 dark:text-neutral-300 mb-2 block">
        管理员社交账号绑定 (OAuth)
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {OAUTH_PROVIDERS.map((p) => {
          const isBound = Boolean(boundMap[p.id]);
          return (
            <div
              key={p.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-700/80 bg-neutral-50/50 dark:bg-neutral-800/40"
            >
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {p.name}
              </span>
              {isBound ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                    已绑定
                  </span>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleUnbind(p.id)}
                    className="text-xs text-rose-500 hover:underline cursor-pointer"
                  >
                    解绑
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleBind(p.id)}
                  className="text-xs font-medium text-sky-500 hover:underline cursor-pointer"
                >
                  去绑定
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SysSettingsPage: React.FC = () => {
  const currentUser = useGlobalStore((state) => state.currentUser as UserVO);
  const setCurrentUser = useGlobalStore((state) => state.setCurrentUser);
  const setSysConfig = useGlobalStore((state) => state.setSysConfig);

  const [version, setVersion] = useState('');
  const [commitId, setCommitId] = useState('');
  const [showCleanFileModal, setShowCleanFileModal] = useState(false);
  const [showAmapKey, setShowAmapKey] = useState(false);
  const [showAmapSecurityCode, setShowAmapSecurityCode] = useState(false);

  // 管理员个人 Profile 表达状态
  const [profileState, setProfileState] = useState({
    username: '',
    nickname: '',
    slogan: '',
    avatarUrl: '',
    coverUrl: '',
    password: '',
  });

  // 系统全量 Config 表达状态
  const [formState, setFormState] = useState<SysConfigVO>({
    enableGoogleRecaptcha: false,
    googleSiteKey: '',
    googleSecretKey: '',
    enableAutoLoadNextPage: true,
    enableComment: true,
    enableRegister: true,
    maxCommentLength: 120,
    memoMaxHeight: 300,
    commentOrder: 'desc',
    timeFormat: 'timeAgo',
    adminUserName: 'admin',
    title: '极简朋友圈',
    favicon: '/favicon.ico',
    beiAnNo: '',
    css: '',
    js: '',
    rss: '',
    enableS3: false,
    s3: {
      domain: '',
      bucket: '',
      region: '',
      accessKey: '',
      secretKey: '',
      endpoint: '',
      thumbnailSuffix: '',
    },
    enableAmap: false,
    amapKey: '',
    amapSecurityJsCode: '',
    enableOAuth: false,
    enableEmail: false,
    smtpHost: '',
    smtpPort: '',
    smtpUsername: '',
    smtpPassword: '',
  } as any);

  useEffect(() => {
    if (currentUser) {
      setProfileState((prev) => ({
        ...prev,
        username: currentUser.username || '',
        nickname: currentUser.nickname || '',
        slogan: currentUser.slogan || '',
        avatarUrl: currentUser.avatarUrl || '',
        coverUrl: currentUser.coverUrl || '',
      }));
    }
  }, [currentUser]);

  const reload = async () => {
    try {
      const res = await useMyFetch<any>('/sysConfig/getFull');
      if (res) {
        setFormState((prev) => ({
          ...prev,
          ...res,
          adminUserName: res.adminUserName || currentUser?.username || 'admin',
        }));
        setVersion(res.version || '');
        setCommitId(res.commitId || '');
      }
    } catch (err: any) {
      toast.error(err?.message || '获取系统配置失败');
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const save = async () => {
    try {
      const sysPayload = {
        ...formState,
        adminUserName: formState.adminUserName || currentUser?.username || 'admin',
      };

      // 同步保存系统设置与管理员个人 Profile
      await Promise.all([
        useMyFetch('/sysConfig/save', sysPayload),
        useMyFetch('/user/saveProfile', profileState),
      ]);

      toast.success('保存成功');
      setSysConfig(sysPayload);
      const updatedProfile = await useMyFetch<UserVO>('/user/profile');
      if (updatedProfile) setCurrentUser(updatedProfile);

      window.location.reload();
    } catch (err: any) {
      toast.error(err?.message || '保存系统设置与个人资料失败');
    }
  };

  const uploadAvatarUrl = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      if (!files[i].type.includes('image')) {
        toast.error('只能上传图片');
        return;
      }
    }

    try {
      const result = await useUpload(files);
      if (result && result.length) {
        toast.success('头像上传成功');
        setProfileState((prev) => ({ ...prev, avatarUrl: result[0] }));
      }
    } catch (err: any) {
      toast.error(err?.message || '上传头像失败');
    }
  };

  const uploadCoverUrl = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      if (!files[i].type.includes('image')) {
        toast.error('只能上传图片');
        return;
      }
    }

    try {
      const result = await useUpload(files);
      if (result && result.length) {
        toast.success('封面图片上传成功');
        setProfileState((prev) => ({ ...prev, coverUrl: result[0] }));
      }
    } catch (err: any) {
      toast.error(err?.message || '上传封面失败');
    }
  };

  const uploadFavicon = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      if (!files[i].type.includes('image')) {
        toast.error('只能上传图片');
        return;
      }
    }

    try {
      const result = await useUpload(files);
      if (result && result.length) {
        toast.success('上传成功');
        setFormState((prev) => ({ ...prev, favicon: result[0] }));
      }
    } catch (err: any) {
      toast.error(err?.message || '上传 Favicon 失败');
    }
  };

  const cleanFile = async () => {
    try {
      const res = await useMyFetch<{ num: number }>('/file/clean', undefined);
      if (res) {
        toast.success(`成功清理 ${res.num} 个未使用的文件`);
        setShowCleanFileModal(false);
      }
    } catch (err: any) {
      toast.error(err?.message || '清理未关联文件失败');
    }
  };

  return (
    <>
      <Header user={currentUser} />
      <div className="space-y-6 flex flex-col p-4 my-4 bg-white dark:bg-neutral-800 text-xs">


        <div>
          <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">头像</label>
          <FileInput
            accept="image/*"
            onChange={uploadAvatarUrl}
            urlValue={profileState.avatarUrl}
            onUrlChange={(v) => setProfileState({ ...profileState, avatarUrl: v })}
            urlPlaceholder="上传或输入在线地址"
            previewSrc={profileState.avatarUrl}
            previewClassName="rounded-full"
          />
        </div>

        <div>
          <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">顶部图片</label>
          <FileInput
            accept="image/*"
            onChange={uploadCoverUrl}
            urlValue={profileState.coverUrl}
            onUrlChange={(v) => setProfileState({ ...profileState, coverUrl: v })}
            urlPlaceholder="上传或输入在线地址"
          />
          {profileState.coverUrl && (
            <img
              src={profileState.coverUrl}
              className="w-full max-h-36 rounded-md object-cover border border-neutral-200 dark:border-neutral-700 mt-2"
              alt="Cover"
            />
          )}
        </div>

        <div>
          <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">登录名</label>
          <Input value={profileState.username} disabled className="bg-neutral-100 dark:bg-neutral-900" />
        </div>

        <div>
          <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">昵称</label>
          <Input
            value={profileState.nickname}
            onChange={(e) => setProfileState({ ...profileState, nickname: e.target.value })}
          />
        </div>

        <div>
          <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">心情状态</label>
          <Input
            value={profileState.slogan}
            onChange={(e) => setProfileState({ ...profileState, slogan: e.target.value })}
          />
        </div>

        <div>
          <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">密码</label>
          <Input
            type="password"
            placeholder="留空则不修改密码"
            value={profileState.password}
            onChange={(e) => setProfileState({ ...profileState, password: e.target.value })}
          />
        </div>

        {/* 社交账号绑定管理 */}
        <OAuthAccountBinding />

        {/* 站点与系统配置板块 */}
        <div className="space-y-4">
          <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100 pb-2 border-b border-neutral-200/60 dark:border-neutral-700/60">
            全站基础与功能配置
          </div>

          <div>
            <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">管理员账号名</label>
            <Input
              value={formState.adminUserName}
              onChange={(e) => setFormState({ ...formState, adminUserName: e.target.value })}
            />
          </div>

          <div>
            <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">网站标题</label>
            <Input
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
            />
          </div>

          <div>
            <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">Favicon 图标</label>
            <FileInput
              accept="image/*"
              onChange={uploadFavicon}
              urlValue={formState.favicon}
              onUrlChange={(v) => setFormState({ ...formState, favicon: v })}
              urlPlaceholder="上传或输入在线地址"
              previewSrc={formState.favicon}
              previewClassName="rounded-md p-0.5"
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <label className="font-bold text-neutral-700 dark:text-neutral-300">首页是否自动加载下一页</label>
            <Switch
              checked={formState.enableAutoLoadNextPage}
              onChange={(checked) => setFormState({ ...formState, enableAutoLoadNextPage: checked })}
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <label className="font-bold text-neutral-700 dark:text-neutral-300">是否启用评论功能</label>
            <Switch
              checked={formState.enableComment}
              onChange={(checked) => setFormState({ ...formState, enableComment: checked })}
            />
          </div>

          <div>
            <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">备案号</label>
            <Input
              placeholder="没有可以不填写"
              value={formState.beiAnNo}
              onChange={(e) => setFormState({ ...formState, beiAnNo: e.target.value })}
            />
          </div>

          <div>
            <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">自定义 RSS</label>
            <Input
              placeholder="留空使用默认配置"
              value={formState.rss}
              onChange={(e) => setFormState({ ...formState, rss: e.target.value })}
            />
          </div>

          <div>
            <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">评论最大字数</label>
            <Input
              type="number"
              value={formState.maxCommentLength}
              onChange={(e) => setFormState({ ...formState, maxCommentLength: parseInt(e.target.value, 10) || 0 })}
            />
          </div>

          <div>
            <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">
              动态卡片最大高度 (单位 px, 填 0 则不限制高度)
            </label>
            <Input
              type="number"
              value={formState.memoMaxHeight}
              onChange={(e) => setFormState({ ...formState, memoMaxHeight: parseInt(e.target.value, 10) || 0 })}
            />
          </div>

          <div>
            <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">评论排序方式 (按时间)</label>
            <Select
              value={formState.commentOrder}
              onChange={(e) => setFormState({ ...formState, commentOrder: e.target.value as any })}
            >
              <option value="desc">倒序，越晚发布越靠前</option>
              <option value="asc">正序，越早发布越靠前</option>
            </Select>
          </div>

          <div>
            <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">日期显示格式</label>
            <Select
              value={formState.timeFormat}
              onChange={(e) => setFormState({ ...formState, timeFormat: e.target.value as any })}
            >
              <option value="timeAgo">相对时间 (如: 几分钟前)</option>
              <option value="time">标准具体日期时间</option>
            </Select>
          </div>

          <div className="flex items-center justify-between py-1">
            <label className="font-bold text-neutral-700 dark:text-neutral-300">是否启用 Google reCAPTCHA</label>
            <Switch
              checked={formState.enableGoogleRecaptcha}
              onChange={(checked) => setFormState({ ...formState, enableGoogleRecaptcha: checked })}
            />
          </div>

          {formState.enableGoogleRecaptcha && (
            <div className="space-y-3 pl-2 border-l-2 border-amber-500">
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">SiteKey</label>
                <Input
                  value={formState.googleSiteKey}
                  onChange={(e) => setFormState({ ...formState, googleSiteKey: e.target.value })}
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">SecretKey</label>
                <Input
                  value={(formState as any).googleSecretKey || ''}
                  onChange={(e) => setFormState({ ...formState, googleSecretKey: e.target.value } as any)}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between py-1">
            <label className="font-bold text-neutral-700 dark:text-neutral-300">是否启用高德地图定位服务</label>
            <Switch
              checked={Boolean(formState.enableAmap)}
              onChange={(checked) => setFormState({ ...formState, enableAmap: checked })}
            />
          </div>

          {formState.enableAmap && (
            <div className="space-y-3 pl-2 border-l-2 border-sky-500">
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">Web 端 Key</label>
                <div className="relative">
                  <Input
                    type={showAmapKey ? 'text' : 'password'}
                    placeholder="请输入高德地图 Web端(JS API) Key"
                    value={formState.amapKey || ''}
                    onChange={(e) => setFormState({ ...formState, amapKey: e.target.value.trim() })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition cursor-pointer"
                    onClick={() => setShowAmapKey(!showAmapKey)}
                    title={showAmapKey ? '隐藏密钥' : '显示密钥'}
                  >
                    {showAmapKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">安全密钥 (SecurityJsCode)</label>
                <div className="relative">
                  <Input
                    type={showAmapSecurityCode ? 'text' : 'password'}
                    placeholder="请输入高德地图 Web端安全密钥"
                    value={formState.amapSecurityJsCode || ''}
                    onChange={(e) => setFormState({ ...formState, amapSecurityJsCode: e.target.value.trim() })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition cursor-pointer"
                    onClick={() => setShowAmapSecurityCode(!showAmapSecurityCode)}
                    title={showAmapSecurityCode ? '隐藏密钥' : '显示密钥'}
                  >
                    {showAmapSecurityCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 第三方 OAuth 登录配置 */}
          <div className="flex items-center justify-between py-1">
            <label className="font-bold text-neutral-700 dark:text-neutral-300">是否启用第三方 OAuth 快捷登录</label>
            <Switch
              checked={Boolean(formState.enableOAuth)}
              onChange={(checked) => setFormState({ ...formState, enableOAuth: checked })}
            />
          </div>

          {formState.enableOAuth && (
            <div className="space-y-4 pl-3.5 border-l-2 border-emerald-500 dark:border-emerald-400 bg-neutral-50/80 dark:bg-neutral-800/40 p-3.5 rounded-r-xl border border-y-0 border-r-0 border-neutral-100 dark:border-neutral-800">
              {/* GitHub OAuth 配置 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-neutral-800 dark:text-neutral-100">GitHub 登录配置</span>
                  <Switch
                    checked={Boolean(formState.enableGithubOAuth)}
                    onChange={(checked) => setFormState({ ...formState, enableGithubOAuth: checked })}
                  />
                </div>
                {formState.enableGithubOAuth && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1 block">GitHub Client ID</label>
                      <Input
                        placeholder="应用 Client ID"
                        value={formState.githubClientId || ''}
                        onChange={(e) => setFormState({ ...formState, githubClientId: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1 block">GitHub Client Secret</label>
                      <Input
                        type="password"
                        placeholder="应用 Client Secret"
                        value={formState.githubClientSecret || ''}
                        onChange={(e) => setFormState({ ...formState, githubClientSecret: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Google OAuth 配置 */}
              <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-neutral-800 dark:text-neutral-100">Google 登录配置</span>
                  <Switch
                    checked={Boolean(formState.enableGoogleOAuth)}
                    onChange={(checked) => setFormState({ ...formState, enableGoogleOAuth: checked })}
                  />
                </div>
                {formState.enableGoogleOAuth && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1 block">Google Client ID</label>
                      <Input
                        placeholder="Google OAuth Client ID"
                        value={formState.googleClientId || ''}
                        onChange={(e) => setFormState({ ...formState, googleClientId: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1 block">Google Client Secret</label>
                      <Input
                        type="password"
                        placeholder="Google OAuth Client Secret"
                        value={formState.googleClientSecret || ''}
                        onChange={(e) => setFormState({ ...formState, googleClientSecret: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between py-1">
            <label className="font-bold text-neutral-700 dark:text-neutral-300">是否启用 S3 存储</label>
            <Switch
              checked={formState.enableS3}
              onChange={(checked) => setFormState({ ...formState, enableS3: checked })}
            />
          </div>

          {formState.enableS3 && (
            <div className="space-y-3 pl-2 border-l-2 border-blue-500">
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">Bucket 域名</label>
                <Input
                  placeholder="https://..."
                  value={formState.s3?.domain || ''}
                  onChange={(e) =>
                    setFormState({ ...formState, s3: { ...formState.s3, domain: e.target.value } })
                  }
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">Endpoint 地址</label>
                <Input
                  placeholder="https://oss-cn-hangzhou.aliyuncs.com"
                  value={formState.s3?.endpoint || ''}
                  onChange={(e) =>
                    setFormState({ ...formState, s3: { ...formState.s3, endpoint: e.target.value } })
                  }
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">Bucket 名称</label>
                <Input
                  placeholder="moments-bucket"
                  value={formState.s3?.bucket || ''}
                  onChange={(e) =>
                    setFormState({ ...formState, s3: { ...formState.s3, bucket: e.target.value } })
                  }
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">Bucket 地区</label>
                <Input
                  placeholder="oss-cn-hangzhou"
                  value={formState.s3?.region || ''}
                  onChange={(e) =>
                    setFormState({ ...formState, s3: { ...formState.s3, region: e.target.value } })
                  }
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">AccessKey</label>
                <Input
                  value={formState.s3?.accessKey || ''}
                  onChange={(e) =>
                    setFormState({ ...formState, s3: { ...formState.s3, accessKey: e.target.value } })
                  }
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">SecretKey</label>
                <Input
                  type="password"
                  value={formState.s3?.secretKey || ''}
                  onChange={(e) =>
                    setFormState({ ...formState, s3: { ...formState.s3, secretKey: e.target.value } })
                  }
                />
              </div>
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">图片后缀</label>
                <Input
                  value={formState.s3?.thumbnailSuffix || ''}
                  onChange={(e) =>
                    setFormState({ ...formState, s3: { ...formState.s3, thumbnailSuffix: e.target.value } })
                  }
                />
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button variant="destructive" className="flex-1 cursor-pointer" onClick={() => setShowCleanFileModal(true)}>
              清理未关联文件
            </Button>
            <Button className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-medium cursor-pointer" onClick={save}>
              保存全站配置
            </Button>
          </div>
        </div>
      </div>

      {/* 清理文件 Modal */}
      <Dialog open={showCleanFileModal} onOpenChange={setShowCleanFileModal}>
        <DialogContent className="sm:max-w-[400px] rounded-xl bg-white dark:bg-neutral-900 border-none shadow-2xl p-6">
          <p className="text-lg font-bold mb-2 text-red-500">谨慎操作</p>
          <p className="text-neutral-600 dark:text-neutral-300 text-xs mb-4 leading-relaxed">
            确认要清理未使用的文件（图片、视频）吗？清理后，文件将被移动到 &#123;uploadDir&#125;/removed
            目录下，请在检查后手动删除文件以释放空间。
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowCleanFileModal(false)}>
              取消
            </Button>
            <Button size="sm" variant="destructive" onClick={cleanFile}>
              确认清理
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
