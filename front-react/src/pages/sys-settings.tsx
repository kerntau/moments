import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/header';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGlobalStore } from '@/store';
import { useMyFetch } from '@/lib/api';
import { useUpload } from '@/lib/upload';
import type { SysConfigVO, UserVO } from '@/types';

export const SysSettingsPage: React.FC = () => {
  const currentUser = useGlobalStore((state) => state.currentUser as UserVO);
  const setSysConfig = useGlobalStore((state) => state.setSysConfig);

  const [version, setVersion] = useState('');
  const [commitId, setCommitId] = useState('');
  const [showCleanFileModal, setShowCleanFileModal] = useState(false);

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
    enableEmail: false,
    smtpHost: '',
    smtpPort: '',
    smtpUsername: '',
    smtpPassword: '',
  } as any);

  const reload = async () => {
    try {
      const res = await useMyFetch<any>('/sysConfig/getFull');
      if (res) {
        setFormState(res);
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
      await useMyFetch('/sysConfig/save', formState);
      toast.success('保存成功');
      setSysConfig(formState);
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.message || '保存系统配置失败');
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
      <div className="space-y-4 flex flex-col p-4 my-4 bg-white dark:bg-neutral-800 text-xs">
        <div className="flex flex-col items-end text-xs text-neutral-400">
          {version && <div>版本号: {version}</div>}
          {commitId && <div>commitId: {commitId}</div>}
        </div>

        <div>
          <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">管理员账号</label>
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
          <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">Favicon</label>
          <Input type="file" accept="image/*" className="text-xs cursor-pointer" onChange={uploadFavicon} />
          <div className="text-neutral-500 text-xs my-1">或者输入在线地址</div>
          <Input
            value={formState.favicon}
            onChange={(e) => setFormState({ ...formState, favicon: e.target.value })}
            className="mb-2"
          />
          {formState.favicon && (
            <img src={formState.favicon} alt="" className="w-8 h-8 rounded border object-contain" />
          )}
        </div>

        <div className="flex items-center justify-between py-1">
          <label className="font-bold text-neutral-700 dark:text-neutral-300">首页是否自动加载下一页</label>
          <input
            type="checkbox"
            className="w-4 h-4 accent-[#9fc84a] cursor-pointer"
            checked={formState.enableAutoLoadNextPage}
            onChange={(e) => setFormState({ ...formState, enableAutoLoadNextPage: e.target.checked })}
          />
        </div>

        <div className="flex items-center justify-between py-1">
          <label className="font-bold text-neutral-700 dark:text-neutral-300">是否启用评论</label>
          <input
            type="checkbox"
            className="w-4 h-4 accent-[#9fc84a] cursor-pointer"
            checked={formState.enableComment}
            onChange={(e) => setFormState({ ...formState, enableComment: e.target.checked })}
          />
        </div>

        <div className="flex items-center justify-between py-1">
          <label className="font-bold text-neutral-700 dark:text-neutral-300">是否开启注册用户</label>
          <input
            type="checkbox"
            className="w-4 h-4 accent-[#9fc84a] cursor-pointer"
            checked={formState.enableRegister}
            onChange={(e) => setFormState({ ...formState, enableRegister: e.target.checked })}
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
          <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">自定义CSS</label>
          <textarea
            rows={5}
            className="w-full rounded-md border border-input p-2 text-xs bg-transparent dark:bg-neutral-900"
            value={formState.css}
            onChange={(e) => setFormState({ ...formState, css: e.target.value })}
          />
        </div>

        <div>
          <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">自定义JS</label>
          <textarea
            rows={5}
            className="w-full rounded-md border border-input p-2 text-xs bg-transparent dark:bg-neutral-900"
            value={formState.js}
            onChange={(e) => setFormState({ ...formState, js: e.target.value })}
          />
        </div>

        <div>
          <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">自定义RSS</label>
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
            发言最大高度(单位px,填0时则不限制高度)
          </label>
          <Input
            type="number"
            value={formState.memoMaxHeight}
            onChange={(e) => setFormState({ ...formState, memoMaxHeight: parseInt(e.target.value, 10) || 0 })}
          />
        </div>

        <div>
          <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">评论排序方式(按日期)</label>
          <select
            className="w-full h-8 text-xs border rounded px-2 bg-transparent dark:bg-neutral-900"
            value={formState.commentOrder}
            onChange={(e) => setFormState({ ...formState, commentOrder: e.target.value as any })}
          >
            <option value="desc">倒序,越晚发布越靠前</option>
            <option value="asc">正序,越早发布越靠前</option>
          </select>
        </div>

        <div>
          <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">日期格式</label>
          <select
            className="w-full h-8 text-xs border rounded px-2 bg-transparent dark:bg-neutral-900"
            value={formState.timeFormat}
            onChange={(e) => setFormState({ ...formState, timeFormat: e.target.value as any })}
          >
            <option value="timeAgo">几分钟前</option>
            <option value="time">标准时间格式</option>
          </select>
        </div>

        <div className="flex items-center justify-between py-1">
          <label className="font-bold text-neutral-700 dark:text-neutral-300">是否启用Google Recaptcha</label>
          <input
            type="checkbox"
            className="w-4 h-4 accent-[#9fc84a] cursor-pointer"
            checked={formState.enableGoogleRecaptcha}
            onChange={(e) => setFormState({ ...formState, enableGoogleRecaptcha: e.target.checked })}
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
          <label className="font-bold text-neutral-700 dark:text-neutral-300">是否启用S3存储</label>
          <input
            type="checkbox"
            className="w-4 h-4 accent-[#9fc84a] cursor-pointer"
            checked={formState.enableS3}
            onChange={(e) => setFormState({ ...formState, enableS3: e.target.checked })}
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

        <div className="flex items-center justify-between py-1">
          <label className="font-bold text-neutral-700 dark:text-neutral-300">是否启用邮件通知</label>
          <input
            type="checkbox"
            className="w-4 h-4 accent-[#9fc84a] cursor-pointer"
            checked={formState.enableEmail}
            onChange={(e) => setFormState({ ...formState, enableEmail: e.target.checked })}
          />
        </div>

        {formState.enableEmail && (
          <div className="space-y-3 pl-2 border-l-2 border-purple-500">
            <div>
              <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">smtp 服务器</label>
              <Input
                placeholder="smtp.qq.com"
                value={formState.smtpHost || ''}
                onChange={(e) => setFormState({ ...formState, smtpHost: e.target.value })}
              />
            </div>
            <div>
              <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">smtp 端口</label>
              <Input
                placeholder="465"
                value={formState.smtpPort || ''}
                onChange={(e) => setFormState({ ...formState, smtpPort: e.target.value })}
              />
            </div>
            <div>
              <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">smtp 用户名</label>
              <Input
                placeholder="******@qq.com"
                value={formState.smtpUsername || ''}
                onChange={(e) => setFormState({ ...formState, smtpUsername: e.target.value })}
              />
            </div>
            <div>
              <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">smtp 密码/授权码</label>
              <Input
                type="password"
                value={formState.smtpPassword || ''}
                onChange={(e) => setFormState({ ...formState, smtpPassword: e.target.value })}
              />
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <Button variant="destructive" className="flex-1" onClick={() => setShowCleanFileModal(true)}>
            清理已上传的文件
          </Button>
          <Button className="flex-1 bg-[#9fc84a] hover:bg-[#8eb83f]" onClick={save}>
            保存配置
          </Button>
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
