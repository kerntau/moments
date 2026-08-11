import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Header } from '@/components/header';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGlobalStore } from '@/store';
import { useMyFetch } from '@/lib/api';
import type { Friend, UserVO } from '@/types';

export const FriendPage: React.FC = () => {
  const currentUser = useGlobalStore((state) => state.currentUser as UserVO);
  const userinfo = useGlobalStore((state) => state.userinfo);

  const [friendList, setFriendList] = useState<Friend[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [friendIdToDelete, setFriendIdToDelete] = useState(0);
  const [hoverFriendId, setHoverFriendId] = useState(0);

  const [newFriend, setNewFriend] = useState({
    name: '',
    icon: '',
    url: '',
    desc: '',
  });

  const getFriendList = async () => {
    try {
      const res = await useMyFetch<{ list: Friend[] }>('/friend/list');
      setFriendList(res.list || []);
    } catch (e) {
      setFriendList([]);
    }
  };

  useEffect(() => {
    getFriendList();
  }, []);

  const addFriend = async () => {
    if (!newFriend.name.trim()) {
      toast.warning('名称不能为空');
      return;
    }
    if (!newFriend.icon.trim()) {
      toast.warning('图标地址不能为空');
      return;
    }
    if (!newFriend.url.trim()) {
      toast.warning('网址不能为空');
      return;
    }
    if (!/^https?:\/\//.test(newFriend.url) || !/^https?:\/\//.test(newFriend.icon)) {
      toast.warning('地址必须以 http 或 https 开头');
      return;
    }

    try {
      await useMyFetch('/friend/add', newFriend);
      toast.success('友情链接添加成功');
      await getFriendList();
      setShowAddModal(false);
      setNewFriend({ name: '', icon: '', url: '', desc: '' });
    } catch (err: any) {
      toast.error(err?.message || '添加友情链接失败');
    }
  };

  const deleteFriend = async (id: number) => {
    try {
      await useMyFetch(`/friend/delete?id=${id}`);
      toast.success('友情链接删除成功');
      await getFriendList();
      setShowDeleteModal(false);
    } catch (err: any) {
      toast.error(err?.message || '删除友情链接失败');
    }
  };

  return (
    <>
      <Header user={currentUser} onAddFriend={() => setShowAddModal(true)} />
      <div className="bg-white dark:bg-neutral-800 min-h-[400px]">
        <div className="grid sm:grid-cols-2 grid-cols-1 gap-4 p-4">
          {friendList.map((friend) => (
            <div
              key={friend.id}
              className="bg-neutral-100 dark:bg-neutral-700 rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 duration-300 relative group"
              onMouseEnter={() => setHoverFriendId(friend.id)}
              onMouseLeave={() => setHoverFriendId(0)}
            >
              <a href={friend.url} target="_blank" rel="noopener noreferrer" className="block p-4">
                <div className="flex items-center gap-2 mb-2">
                  <img src={friend.icon} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                    {friend.name}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                  {friend.desc || '暂无描述'}
                </p>
              </a>

              {userinfo.id === 1 && hoverFriendId === friend.id && (
                <div
                  className="absolute top-2 right-2 p-1 bg-white dark:bg-neutral-900 rounded hover:text-red-500 cursor-pointer shadow"
                  onClick={() => {
                    setFriendIdToDelete(friend.id);
                    setShowDeleteModal(true);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center items-center text-sm text-gray-400 pt-4 pb-10">
          {friendList && friendList.length ? (
            <span>共 {friendList.length} 个朋友</span>
          ) : (
            <span className="text-gray-600 dark:text-gray-300 font-semibold">
              空空如也{userinfo.id === 1 ? '，请点击右上角添加' : ''}
            </span>
          )}
        </div>
      </div>

      {/* 添加 Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[425px] rounded-xl bg-white dark:bg-neutral-900 border-none shadow-2xl p-6">
          <p className="text-center text-lg font-bold mb-4 text-neutral-800 dark:text-neutral-100">
            添加友情链接
          </p>
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">名称 *</label>
              <Input
                value={newFriend.name}
                onChange={(e) => setNewFriend({ ...newFriend, name: e.target.value })}
                placeholder="博客名称"
              />
            </div>
            <div>
              <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">图标 *</label>
              <Input
                value={newFriend.icon}
                onChange={(e) => setNewFriend({ ...newFriend, icon: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">网址 *</label>
              <Input
                value={newFriend.url}
                onChange={(e) => setNewFriend({ ...newFriend, url: e.target.value })}
                placeholder="必须以 http(s):// 开头"
              />
            </div>
            <div>
              <label className="font-bold text-neutral-700 dark:text-neutral-300 mb-1 block">描述</label>
              <Input
                value={newFriend.desc}
                onChange={(e) => setNewFriend({ ...newFriend, desc: e.target.value })}
                placeholder="简短描述"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                取消
              </Button>
              <Button size="sm" onClick={addFriend}>
                确认添加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除 Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[400px] rounded-xl bg-white dark:bg-neutral-900 border-none shadow-2xl p-6">
          <p className="text-center text-lg font-bold mb-2 text-neutral-800 dark:text-neutral-100">
            确认删除
          </p>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 text-center">
            你确定要删除这个友情链接吗？
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowDeleteModal(false)}>
              取消
            </Button>
            <Button size="sm" variant="destructive" onClick={() => deleteFriend(friendIdToDelete)}>
              确认删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
