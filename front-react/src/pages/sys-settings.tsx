import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Eye, EyeOff, RefreshCw, Download, CheckCircle, XCircle, Loader2, GitBranch, Settings2,
  User, Sliders, Puzzle, Cpu, Shield, Globe, HardDrive, Sparkles, Terminal, Trash2, Save, KeyRound
} from 'lucide-react';
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
import type { SysConfigVO, UserVO, UpdateCheckResult, UpdateStatus, UpdateConfig } from '@/types';

import { OAuthAccountBinding } from '@/components/oauth-account-binding';


const STAGE_LABELS: Record<string, string> = {
  idle: '空闲',
  starting: '准备中',
  pulling: '拉取代码',
  building_frontend: '编译前端',
  building_backend: '编译后端',
  replacing: '替换文件',
  done: '更新完成',
  failed: '更新失败',
};

const SystemUpdateSection: React.FC = () => {
  const [checkResult, setCheckResult] = useState<UpdateCheckResult | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [updateConfig, setUpdateConfig] = useState<UpdateConfig>({ repoUrl: '', branch: '' });
  const [checking, setChecking] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const isUpdating = updateStatus && !['idle', 'done', 'failed'].includes(updateStatus.stage);

  // 加载更新配置
  const loadConfig = useCallback(async () => {
    try {
      const res = await useMyFetch<UpdateConfig>('/update/config/get');
      if (res) setUpdateConfig(res);
    } catch (e: any) {
      console.error('获取更新配置失败:', e);
    }
  }, []);

  // 检查更新
  const handleCheck = async () => {
    setChecking(true);
    try {
      const res = await useMyFetch<UpdateCheckResult>('/update/check');
      setCheckResult(res);
      if (res && !res.hasUpdate) {
        toast.success('当前已是最新版本');
      }
    } catch (e: any) {
      toast.error(e?.message || '检查更新失败');
    } finally {
      setChecking(false);
    }
  };

  // 执行更新
  const handleDoUpdate = async () => {
    setShowConfirmUpdate(false);
    try {
      await useMyFetch('/update/do');
      toast.success('更新已开始');
      startPolling();
    } catch (e: any) {
      toast.error(e?.message || '启动更新失败');
    }
  };

  // 轮询状态
  const pollStatus = useCallback(async () => {
    try {
      const res = await useMyFetch<UpdateStatus>('/update/status');
      if (res) {
        setUpdateStatus(res);
        if (res.stage === 'done' || res.stage === 'failed') {
          stopPolling();
          if (res.stage === 'done') {
            toast.success('更新完成，请手动重启服务');
          } else {
            toast.error('更新失败，请查看日志');
          }
        }
      }
    } catch (e: any) {
      console.error('查询更新状态失败:', e);
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollStatus();
    pollingRef.current = setInterval(pollStatus, 2000);
  }, [pollStatus]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // 保存配置
  const saveConfig = async () => {
    try {
      await useMyFetch('/update/config/save', updateConfig);
      toast.success('更新配置已保存');
      setShowConfig(false);
    } catch (e: any) {
      toast.error(e?.message || '保存配置失败');
    }
  };

  useEffect(() => {
    loadConfig();
    // 初始查询一次状态，如果正在更新中则开始轮询
    (async () => {
      try {
        const res = await useMyFetch<UpdateStatus>('/update/status');
        if (res) {
          setUpdateStatus(res);
          if (res.stage && !['idle', 'done', 'failed'].includes(res.stage)) {
            startPolling();
          }
        }
      } catch (_) { /* ignore */ }
    })();
    return () => stopPolling();
  }, []);

  // 日志自动滚动到底部
  useEffect(() => {
    if (showLogs && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [updateStatus?.logs?.length, showLogs]);

  const stageIcon = (stage: string) => {
    switch (stage) {
      case 'done': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'idle': return <RefreshCw className="w-4 h-4 text-neutral-400" />;
      default: return <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* 检查与日志控制 */}
      <div className="flex items-center justify-between gap-3">
        <Button
          size="sm"
          className="bg-sky-500 hover:bg-sky-600 text-white font-medium cursor-pointer shadow-sm"
          disabled={checking || !!isUpdating}
          onClick={handleCheck}
        >
          {checking ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          )}
          {checking ? '正在检测远程仓库...' : '检查版本更新'}
        </Button>
        <div className="flex items-center gap-2">
          {updateStatus && updateStatus.stage !== 'idle' && (
            <button
              type="button"
              onClick={() => setShowLogs(!showLogs)}
              className="text-xs font-medium text-sky-500 hover:underline cursor-pointer flex items-center gap-1"
            >
              <Terminal className="w-3.5 h-3.5" />
              {showLogs ? '隐藏构建日志' : '查看构建日志'}
            </button>
          )}
          <button
            type="button"
            onClick={() => { setShowConfig(!showConfig); if (!showConfig) loadConfig(); }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 transition cursor-pointer"
            title="仓库与更新配置"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 更新配置面板 */}
      {showConfig && (
        <div className="space-y-3 p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 bg-white dark:bg-neutral-900 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="font-semibold text-xs text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-sky-500" />
            Git 远程更新配置
          </div>
          <div>
            <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">
              远程仓库地址 (Remote Repo)
            </label>
            <Input
              placeholder="留空默认使用 git remote origin 地址"
              value={updateConfig.repoUrl}
              onChange={(e) => setUpdateConfig({ ...updateConfig, repoUrl: e.target.value })}
            />
            <p className="text-[10px] text-neutral-400 mt-1">
              可填任意 Gitee、GitHub、GitLab 等源码仓库 HTTPS/SSH 链接
            </p>
          </div>
          <div>
            <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">
              目标分支 (Branch)
            </label>
            <Input
              placeholder="留空使用当前分支"
              value={updateConfig.branch}
              onChange={(e) => setUpdateConfig({ ...updateConfig, branch: e.target.value })}
            />
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              className="bg-sky-500 hover:bg-sky-600 text-white font-medium cursor-pointer"
              onClick={saveConfig}
            >
              保存更新配置
            </Button>
          </div>
        </div>
      )}



      {/* 检查结果 */}
      {checkResult && (
        <div className={`p-3.5 rounded-xl border transition-all ${
          checkResult.hasUpdate
            ? 'border-amber-500/40 bg-amber-500/5'
            : 'border-neutral-200/80 dark:border-neutral-700/70 bg-neutral-50/50 dark:bg-neutral-900/50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {checkResult.hasUpdate ? (
                <Download className="w-4 h-4 text-amber-500" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              )}
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                {checkResult.hasUpdate ? '发现可用新版本' : '系统当前已是最新状态'}
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-200/50 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 font-mono border border-neutral-200/60 dark:border-neutral-700/60">
              {checkResult.currentBranch}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400 font-mono mt-2 pt-2 border-t border-neutral-200/40 dark:border-neutral-800/40">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-neutral-500">当前 Commit:</span>
              <code className="bg-neutral-200/60 dark:bg-neutral-800/80 px-1.5 py-0.5 rounded text-[11px] font-mono text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60">
                {checkResult.currentCommit?.substring(0, 8) || 'unknown'}
              </code>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-neutral-500">最新 Commit:</span>
              <code className="bg-neutral-200/60 dark:bg-neutral-800/80 px-1.5 py-0.5 rounded text-[11px] font-mono text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60">
                {checkResult.latestCommit?.substring(0, 8) || 'unknown'}
              </code>
            </div>
          </div>
          {checkResult.hasUpdate && checkResult.logs && checkResult.logs.length > 0 && (
            <div className="mt-2 pt-2 border-t border-amber-200/70 dark:border-amber-800/50">
              <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200 mb-1">
                更新提交历史 ({checkResult.logs.length} 条 Commit)
              </p>
              <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                {checkResult.logs.map((log, i) => (
                  <p key={i} className="text-[11px] text-amber-800/90 dark:text-amber-300/90 font-mono leading-relaxed truncate">
                    {log}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 执行更新按钮 */}
          {checkResult.hasUpdate && (
            <div className="mt-3">
              <Button
                size="sm"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium cursor-pointer shadow-sm"
                disabled={!!isUpdating}
                onClick={() => setShowConfirmUpdate(true)}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                立即拉取代码并构建更新
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 更新进度 */}
      {updateStatus && updateStatus.stage !== 'idle' && (
        <div className={`p-3.5 rounded-xl border transition-all ${
          updateStatus.stage === 'failed'
            ? 'border-red-300/80 dark:border-red-600/70 bg-red-50/70 dark:bg-red-950/30'
            : updateStatus.stage === 'done'
              ? 'border-emerald-300/80 dark:border-emerald-600/70 bg-emerald-50/70 dark:bg-emerald-950/30'
              : 'border-sky-300/80 dark:border-sky-600/70 bg-sky-50/70 dark:bg-sky-950/30'
        }`}>
          <div className="flex items-center gap-2 mb-1.5">
            {stageIcon(updateStatus.stage)}
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              {STAGE_LABELS[updateStatus.stage] || updateStatus.stage}
            </span>
          </div>
          {updateStatus.message && (
            <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {updateStatus.message}
            </p>
          )}

          {/* 进度条 */}
          {isUpdating && (
            <div className="mt-2.5 h-1.5 bg-neutral-200/80 dark:bg-neutral-700/80 rounded-full overflow-hidden">
              <div className="h-full bg-sky-500 rounded-full animate-pulse transition-all duration-300" style={{ width: '100%' }} />
            </div>
          )}
        </div>
      )}

      {/* 构建日志 */}
      {showLogs && updateStatus?.logs && updateStatus.logs.length > 0 && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 max-h-60 overflow-y-auto shadow-inner">
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-neutral-400 mb-2 pb-1 border-b border-neutral-800">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            构建控制台日志 (Build Log)
          </div>
          <div className="space-y-0.5">
            {updateStatus.logs.map((log, i) => (
              <p key={i} className="text-[10px] text-neutral-300 font-mono leading-relaxed break-all">
                {log}
              </p>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* 确认更新弹窗 */}
      <Dialog open={showConfirmUpdate} onOpenChange={setShowConfirmUpdate}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl bg-white dark:bg-neutral-900 border-none shadow-2xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Download className="w-5 h-5 text-amber-500" />
            <p className="text-base font-bold text-neutral-900 dark:text-neutral-100">确认执行系统更新</p>
          </div>
          <p className="text-neutral-600 dark:text-neutral-300 text-xs mb-3 leading-relaxed">
            系统将自动在服务器后台顺序执行以下升级步骤：
          </p>
          <ol className="text-neutral-600 dark:text-neutral-400 text-xs space-y-1.5 list-decimal pl-4 mb-4 font-medium">
            <li>拉取 Git 远程仓库最新代码</li>
            <li>安装前端 pnpm 依赖并完成打包编译</li>
            <li>编译后端 Go 原生可执行文件</li>
            <li>自动替换当前程序（旧文件将自动备份）</li>
          </ol>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
            提醒：更新完成后需重启 Moments 服务以使新代码生效。请确认服务器已具备 Go、Node.js 与 pnpm 编译工具。
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <Button variant="outline" size="sm" onClick={() => setShowConfirmUpdate(false)}>
              取消
            </Button>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium cursor-pointer shadow-sm"
              onClick={handleDoUpdate}
            >
              确认开始更新
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const SysSettingsPage: React.FC = () => {
  const currentUser = useGlobalStore((state) => state.currentUser as UserVO);
  const setCurrentUser = useGlobalStore((state) => state.setCurrentUser);
  const setSysConfig = useGlobalStore((state) => state.setSysConfig);

  const [version, setVersion] = useState('');
  const [commitId, setCommitId] = useState('');
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
      const finalAdminName = formState.adminUserName || currentUser?.username || 'admin';
      const sysPayload = {
        ...formState,
        adminUserName: finalAdminName,
      };
      const profilePayload = {
        ...profileState,
        username: finalAdminName,
      };

      // 保证系统配置与管理员 Profile 的账号名称绝对一致
      await Promise.all([
        useMyFetch('/sysConfig/save', sysPayload),
        useMyFetch('/user/saveProfile', profilePayload),
      ]);

      toast.success('保存成功');
      setSysConfig(sysPayload);
      localStorage.setItem('sys_config_cache', JSON.stringify(sysPayload));

      if (sysPayload.title) {
        document.title = sysPayload.title;
      }
      if (sysPayload.favicon) {
        const existingLinks = document.querySelectorAll("link[rel*='icon']");
        existingLinks.forEach((el) => el.parentNode?.removeChild(el));

        const link = document.createElement('link');
        link.rel = 'icon';
        const lowerUrl = sysPayload.favicon.toLowerCase();
        if (lowerUrl.endsWith('.ico')) {
          link.type = 'image/x-icon';
        } else if (lowerUrl.endsWith('.png')) {
          link.type = 'image/png';
        } else if (lowerUrl.endsWith('.svg')) {
          link.type = 'image/svg+xml';
        } else if (lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg')) {
          link.type = 'image/jpeg';
        }
        link.href = sysPayload.favicon;
        document.head.appendChild(link);
      }
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
      const file = files[i];
      const isImage = file.type.includes('image') || file.name.toLowerCase().endsWith('.ico');
      if (!isImage) {
        toast.error('只能上传图片或 .ico 图标');
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

  return (
    <>
      <Header user={currentUser} />
      <div className="space-y-6 flex flex-col p-4 my-4 bg-white dark:bg-neutral-800 text-xs">
        {/* 1. 管理员个人资料与账号安全 */}
        <div className="space-y-4">
          <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100 pb-2 border-b border-neutral-200/60 dark:border-neutral-700/60">
            管理员个人资料
          </div>

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
            <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">顶部封面图片</label>
            <FileInput
              accept="image/*"
              onChange={uploadCoverUrl}
              urlValue={profileState.coverUrl}
              onUrlChange={(v) => setProfileState({ ...profileState, coverUrl: v })}
              urlPlaceholder="上传或输入在线地址"
              previewSrc={profileState.coverUrl}
              previewClassName="rounded-md"
            />
          </div>

          <div>
            <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">管理员账号名</label>
            <Input
              value={formState.adminUserName}
              onChange={(e) => {
                const val = e.target.value;
                setFormState({ ...formState, adminUserName: val });
                setProfileState((prev) => ({ ...prev, username: val }));
              }}
            />
          </div>

          <div>
            <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">显示昵称</label>
            <Input
              value={profileState.nickname}
              onChange={(e) => setProfileState({ ...profileState, nickname: e.target.value })}
            />
          </div>

          <div>
            <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">个性签名 / 心情状态</label>
            <Input
              value={profileState.slogan}
              onChange={(e) => setProfileState({ ...profileState, slogan: e.target.value })}
            />
          </div>

          <div>
            <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">修改密码</label>
            <Input
              type="password"
              placeholder="留空则保持原密码不变"
              value={profileState.password}
              onChange={(e) => setProfileState({ ...profileState, password: e.target.value })}
            />
          </div>

          {/* 社交账号绑定 */}
          <OAuthAccountBinding
            title="管理员社交账号绑定 (OAuth)"
            className="pt-2 border-t border-neutral-100 dark:border-neutral-700/60 mt-3"
          />
        </div>

        {/* 2. 站点基础与外观设置 */}
        <div className="space-y-4 pt-2">
          <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100 pb-2 border-b border-neutral-200/60 dark:border-neutral-700/60">
            站点基础与外观
          </div>

          <div>
            <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">网站标题</label>
            <Input
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
            />
          </div>

          <div>
            <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">Favicon 图标 (.ico / .png)</label>
            <FileInput
              accept="image/*"
              onChange={uploadFavicon}
              urlValue={formState.favicon}
              onUrlChange={(v) => setFormState({ ...formState, favicon: v })}
              urlPlaceholder="上传或输入在线图标地址"
              previewSrc={formState.favicon}
              previewClassName="rounded-md p-0.5"
            />
          </div>

          <div>
            <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">ICP 备案号</label>
            <Input
              placeholder="没有可以留空"
              value={formState.beiAnNo}
              onChange={(e) => setFormState({ ...formState, beiAnNo: e.target.value })}
            />
          </div>

          <div>
            <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">自定义 RSS 路径</label>
            <Input
              placeholder="留空使用系统默认配置"
              value={formState.rss}
              onChange={(e) => setFormState({ ...formState, rss: e.target.value })}
            />
          </div>
        </div>

        {/* 3. 交互与显示偏好 */}
        <div className="space-y-4 pt-2">
          <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100 pb-2 border-b border-neutral-200/60 dark:border-neutral-700/60">
            交互与显示偏好
          </div>

          <div className="flex items-center justify-between py-1">
            <label className="font-bold text-neutral-700 dark:text-neutral-300">首页是否自动加载下一页</label>
            <Switch
              checked={formState.enableAutoLoadNextPage}
              onChange={(checked) => setFormState({ ...formState, enableAutoLoadNextPage: checked })}
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <label className="font-bold text-neutral-700 dark:text-neutral-300">是否开启评论功能</label>
            <Switch
              checked={formState.enableComment}
              onChange={(checked) => setFormState({ ...formState, enableComment: checked })}
            />
          </div>

          <div>
            <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">评论最大字数限制</label>
            <Input
              type="number"
              value={formState.maxCommentLength}
              onChange={(e) => setFormState({ ...formState, maxCommentLength: parseInt(e.target.value, 10) || 0 })}
            />
          </div>

          <div>
            <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">
              动态卡片最大高度 (单位 px, 填 0 则不限制)
            </label>
            <Input
              type="number"
              value={formState.memoMaxHeight}
              onChange={(e) => setFormState({ ...formState, memoMaxHeight: parseInt(e.target.value, 10) || 0 })}
            />
          </div>

          <div>
            <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">评论时间排序方式</label>
            <Select
              value={formState.commentOrder}
              onChange={(e) => setFormState({ ...formState, commentOrder: e.target.value as any })}
            >
              <option value="desc">倒序（晚发布的靠前）</option>
              <option value="asc">正序（早发布的靠前）</option>
            </Select>
          </div>

          <div>
            <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">日期时间显示格式</label>
            <Select
              value={formState.timeFormat}
              onChange={(e) => setFormState({ ...formState, timeFormat: e.target.value as any })}
            >
              <option value="timeAgo">相对时间 (如: 几分钟前)</option>
              <option value="time">标准具体日期时间</option>
            </Select>
          </div>
        </div>

        {/* 4. 第三方服务扩展集成 */}
        <div className="space-y-4 pt-2">
          <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100 pb-2 border-b border-neutral-200/60 dark:border-neutral-700/60">
            第三方服务扩展集成
          </div>

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
              {/* GitHub OAuth */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-neutral-800 dark:text-neutral-100">GitHub 登录配置</span>
                  <Switch
                    checked={Boolean(formState.enableGithubOAuth)}
                    onChange={(checked) => setFormState({ ...formState, enableGithubOAuth: checked })}
                  />
                </div>
                {formState.enableGithubOAuth && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1 block">GitHub Client ID</label>
                      <Input
                        placeholder="应用 Client ID"
                        value={formState.githubClientId || ''}
                        onChange={(e) => setFormState({ ...formState, githubClientId: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1 block">GitHub Client Secret</label>
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

              {/* Google OAuth */}
              <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-neutral-800 dark:text-neutral-100">Google 登录配置</span>
                  <Switch
                    checked={Boolean(formState.enableGoogleOAuth)}
                    onChange={(checked) => setFormState({ ...formState, enableGoogleOAuth: checked })}
                  />
                </div>
                {formState.enableGoogleOAuth && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1 block">Google Client ID</label>
                      <Input
                        placeholder="Google Client ID"
                        value={formState.googleClientId || ''}
                        onChange={(e) => setFormState({ ...formState, googleClientId: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1 block">Google Client Secret</label>
                      <Input
                        type="password"
                        placeholder="Google Client Secret"
                        value={formState.googleClientSecret || ''}
                        onChange={(e) => setFormState({ ...formState, googleClientSecret: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 高德地图 */}
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
                    placeholder="请输入高德地图 Web端 Key"
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

          {/* Google reCAPTCHA */}
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

          {/* S3 对象存储 */}
          <div className="flex items-center justify-between py-1">
            <label className="font-bold text-neutral-700 dark:text-neutral-300">是否启用 S3 外部云存储</label>
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
                  value={formState.s3?.domain || ''}
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
                <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">图片缩略图后缀</label>
                <Input
                  value={formState.s3?.thumbnailSuffix || ''}
                  onChange={(e) =>
                    setFormState({ ...formState, s3: { ...formState.s3, thumbnailSuffix: e.target.value } })
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* 5. 系统版本与代码更新 */}
        <div className="space-y-4 pt-2">
          <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100 pb-2 border-b border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span>系统版本与代码更新</span>
            </div>
          </div>

          <SystemUpdateSection />
        </div>

        {/* 底部全站操作按钮 (底栏留出 pb-12 防悬浮按钮遮挡) */}
        <div className="pt-4 pb-12 border-t border-neutral-100 dark:border-neutral-700/50">
          <Button className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-2.5 rounded-xl cursor-pointer shadow-md shadow-sky-500/10 active:scale-[0.99] transition-all" onClick={save}>
            保存全站配置与个人资料
          </Button>
        </div>
      </div>
    </>
  );
};
