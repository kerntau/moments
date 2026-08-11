# Moments 前端重构设计文档：Vue/Nuxt 3 → React 19 / Rsbuild (1:1 完整复刻)

> 文档版本：v1.0  
> 目标：将 `Moments` 极简朋友圈前端由 Vue 3 / Nuxt 3 架构平滑迁移为 React 19 + Rsbuild + React Router v7 + Zustand + shadcn/ui，实现 100% 功能与视觉像素级复刻。

---

## 1. 架构目标与重构原则

1. **功能 100% 像素级复刻**：保留现有 Vue/Nuxt 前端的所有细节逻辑（包含键盘事件、动态图片网格、Fancybox 灯箱、MetingJS 音乐播放器、豆瓣元数据解析、拖拽排序、富文本 Markdown 渲染及高亮等）。
2. **Zero Breaking Change**：Go 后端所有 API 接口与数据结构保持不变，保证后端无需修改即可无缝运行。
3. **极速构建与极致体验**：利用 Rsbuild (Rspack 驱动) 替代 Nuxt/Vite，显著提升 HMR 与构建性能，静态打包产物无缝嵌入 Go 后端 `public/` 资源包。
4. **现代 React 生态系统**：使用 React 19 + TypeScript + React Router v7 + Zustand (persist 中间件) + next-themes + shadcn/ui + TailwindCSS v4。

---

## 2. 技术栈映射对照表

| 层级 | 原 Vue/Nuxt3 栈 | 新 React 19 / Rsbuild 栈 | 版本 | 重构说明与替代方案 |
|---|---|---|---|---|
| **构建工具** | Nuxt 3 / Vite / Rollup | **Rsbuild** | latest | 极速 Rspack 构建，配置路由代理与静态导出 |
| **视图框架** | Vue 3 (Composition API) | **React 19** | 19.x | 函数式组件 + Hook 架构 |
| **单页路由** | Nuxt 文件路由 | **React Router** | v7.x | 集中式与声明式路由定义，支持 useParams/useNavigate |
| **状态管理** | VueUse `useStorage` + Nuxt `useState` | **Zustand** + `persist` 中间件 | latest | 统一管理 userinfo、sysConfig、sidebarOpen 等全局状态 |
| **UI 组件库** | @nuxt/ui (Tailwind) | **shadcn/ui** (Radix UI 驱动) | latest | 搭配 TailwindCSS 提供无障碍、高自定义组件 |
| **样式系统** | TailwindCSS + SCSS | **TailwindCSS** v4 + SCSS | v4 | 完全复用现有 `simple-markdown.scss` 及全局样式 |
| **HTTP 请求** | `$fetch` / `useMyFetch` | 原生 **fetch** 封装 | — | 自动注入 `x-api-token` 头，错误码 3/4 自动退登清 Token |
| **Toast 通知**| `vue-sonner` | **sonner** | latest | 绝佳 React Toast 组件，保持通知样式一致 |
| **Markdown 渲染**| `markdown-it` + `shiki` | **markdown-it** + **shiki** | 复用 | 封装统一 Hook/组件，完全继承代码高亮与复制代码逻辑 |
| **图片灯箱** | `@fancyapps/ui` (Fancybox) | **@fancyapps/ui** | 复用 | React 包装组件 `MyFancyBox`，支持自动绑定组 |
| **日期处理** | `dayjs` / `dayjs-nuxt` / `date-fns` | **dayjs** + `date-fns` | 复用 | 保持 relative time (fromNow) 及标准格式输出 |
| **暗黑模式** | `@nuxtjs/color-mode` | **next-themes** | latest | 支持 `light` / `dark` / `system` 三态无缝切换 |
| **Emoji 选择器**| `Emoji.vue` 自实现组件 | **emoji.tsx** 自实现组件 | — | 复用原 5 大分类 Emoji 图标数组与选项卡UI |
| **文件上传** | `useUpload` 自封装 XHR 逻辑 | **upload.ts** 模块 | — | 包含本地 XHR 进度监控与 S3 预签名上传 |
| **图标库** | `@iconify` (`@nuxt/icon`) | **lucide-react** | latest | Lucide React 标准图标替代 Iconify 图标 |
| **日历组件** | `v-calendar` | **shadcn/ui Calendar** (react-day-picker) | — | 完整复刻范围选择与日期过滤功能 |
| **密码与哈希**| `crypto-js` | **crypto-js** | 复用 | 复用 SHA256 文件哈希与加密计算逻辑 |

---

## 3. 项目工程结构设计

新 React 前端存放于 `front-react/` 目录下（保持原 `front/` 供对比与平滑过渡）：

```
front-react/
├── public/                     # 静态资源 (APlayer, MetingJS, 复制脚本)
│   ├── css/
│   │   └── APlayer.min.css
│   ├── js/
│   │   ├── APlayer.min.js
│   │   ├── Meting.min.js
│   │   └── main.js             # 包含代码块一键复制 copyToClipboard 逻辑
│   └── favicon.png
├── src/
│   ├── components/             # React 业务组件
│   │   ├── ui/                 # shadcn/ui 基础 primitives (Button, Dialog, Popover, Input, DropdownMenu...)
│   │   ├── comment.tsx         # 评论单条展示 (Comment.vue)
│   │   ├── comment-box.tsx     # 评论输入框 (CommentBox.vue)
│   │   ├── confirm.tsx         # 确认二次弹窗 (Confirm.vue)
│   │   ├── date-picker.tsx     # 日期选择器 (DatePicker.vue)
│   │   ├── douban-book-preview.tsx    # 豆瓣图书卡片 (DoubanBookPreview.vue)
│   │   ├── douban-edit.tsx            # 豆瓣引用编辑 (DoubanEdit.vue)
│   │   ├── douban-movie-preview.tsx   # 豆瓣电影卡片 (DoubanMoviePreview.vue)
│   │   ├── emoji.tsx                  # Emoji 分类选择器 (Emoji.vue)
│   │   ├── external-url.tsx           # 外部链接编辑 (ExternalUrl.vue)
│   │   ├── external-url-preview.tsx   # 外部链接预览 (ExternalUrlPreview.vue)
│   │   ├── footer.tsx                 # 页脚备案号与 GitHub Star (Footer.vue)
│   │   ├── header.tsx                 # 页头封面与顶部导航 (Header.vue)
│   │   ├── memo.tsx                   # Memo 单条展示核心组件 (Memo.vue)
│   │   ├── memo-edit.tsx              # Memo 编辑/发布核心组件 (MemoEdit.vue)
│   │   ├── mobile-nav.tsx             # 移动端导航抽屉/弹窗 (MobileNav.vue)
│   │   ├── music.tsx                  # 音乐引用编辑 (Music.vue)
│   │   ├── music-preview.tsx          # 音乐播放器预览 MetingJS (MusicPreview.vue)
│   │   ├── my-fancybox.tsx            # Fancybox 图片灯箱包装 (MyFancyBox.vue)
│   │   ├── upload-image.tsx           # 图片上传组件 (UploadImage.vue)
│   │   ├── upload-image-preview.tsx   # 图片预览网格/拖拽 (UploadImagePreview.vue)
│   │   ├── upload-video.tsx           # 视频引用/上传 (UploadVideo.vue)
│   │   ├── video-preview.tsx          # 原生 HTML5 视频播放 (VideoPreview.vue)
│   │   └── video-preview-iframe.tsx   # B站/YouTube iframe 播放 (VideoPreviewIframe.vue)
│   ├── layouts/
│   │   └── default-layout.tsx         # 全局默认布局 (default.vue)
│   ├── pages/
│   │   ├── home.tsx                   # 首页 Memo 列表 (index.vue)
│   │   ├── new.tsx                    # 新建 Memo 页面 (new.vue)
│   │   ├── edit.tsx                   # 编辑 Memo 页面 (edit/[id].vue)
│   │   ├── memo-detail.tsx            # Memo 详情页 (memo/[id].vue)
│   │   ├── friend.tsx                 # 友情链接页 (friend.vue)
│   │   ├── login.tsx                  # 用户登录页 (user/login.vue)
│   │   ├── register.tsx               # 用户注册页 (user/reg.vue)
│   │   ├── user-settings.tsx          # 用户设置页 (user/settings.vue)
│   │   ├── user-profile.tsx           # 用户个人空间 (user/[id].vue)
│   │   ├── user-calendar.tsx          # 日历与高级检索 (user/calendar.vue)
│   │   ├── sys-settings.tsx           # 系统管理设置 (sys/settings.vue)
│   │   └── tags.tsx                   # 标签筛选页 (tags/[username]/[tag].vue)
│   ├── lib/
│   │   ├── api.ts                     # 原生 Fetch API 封装与拦截器
│   │   ├── upload.ts                  # 本地及 S3 文件上传逻辑
│   │   ├── markdown.ts                # markdown-it 与 shiki 初始化
│   │   └── utils.ts                   # classnames / cn 工具与杂项
│   ├── store/
│   │   └── index.ts                   # Zustand 全局 Store与状态订阅
│   ├── types/
│   │   └── index.ts                   # TypeScript VO / DTO 完整定义
│   ├── styles/
│   │   ├── globals.css                # TailwindCSS v4 引入与组件样式
│   │   └── simple-markdown.scss       # Markdown 样式与代码高亮动画
│   ├── app.tsx                        # App 根组件与 Provider 包裹
│   ├── router.tsx                     # React Router v7 路由定义
│   └── main.tsx                       # 应用入口 DOM 挂载
├── rsbuild.config.ts                  # Rsbuild 配置文件
├── tailwind.config.ts                 # TailwindCSS 配置文件
├── tsconfig.json                      # TypeScript 规则配置
├── package.json                       # 依赖与脚本
└── .env                               # 开发环境变量
```

---

## 4. Open Questions 架构决策与回答

### 问 1：新前端目录放在哪？在 `front-react/` 下新建，还是直接替换 `front/`？
**决议**：
- 在根目录下新增 `front-react/` 目录开发新前端。
- 在 `Makefile` 中新增 `front-react` 编译选项，允许自由切换。在重构完成并通过 100% 测试验收后，可平滑替换 `front/` 目录。

### 问 2：是否保留原 Nuxt 前端代码作为参考？
**决议**：
- 完整保留原 `front/` 目录代码，在重构阶段作为 UI 细节与业务逻辑对比标杆，不影响整体构建流程。

### 问 3：是否需要同时精简 Go 后端依赖？
**决议**：
- 遵循 Chapter 2 `Minimal Change Principle`。本次重构聚焦于前端 Vue -> React 迁移，**Go 后端保持 100% 稳定不动**。API 契约、静态资源嵌入机制 (`public/`) 保持完全兼容。

---

## 5. 核心模块与 1:1 逻辑复刻方案

### 5.1 API 网络请求封装 (`src/lib/api.ts`)
- 替代 Vue 版 `$fetch` / `useMyFetch`。
- 读取 Zustand store 中的 `userinfo.token`，自动注入 HTTP Request Header `x-api-token`。
- Response 校验：
  - 若 `code !== 0` 且 `code === 3 || code === 4`：清空 `userinfo` 状态，触发退登并执行 `window.location.href = "/user/login"`。
  - 若 `code !== 0` 其它错误：抛出 `Error(res.message)`，由 UI 层捕捉并弹出 `toast.error`。

### 5.2 状态管理系统 (`src/store/index.ts`)
基于 Zustand 构建持久化 Store：
1. **Global Store** (`useGlobalStore`)：
   - `userinfo`: 包含 `id`, `username`, `token`。配合 `persist` 存储至 `localStorage('global')`。
   - `sysConfig`: 存储系统配置 `SysConfigVO`。
   - `currentUser`: 当前空间访问的用户基本信息。
   - `sidebarOpen`: 移动端抽屉开关状态。
   - `currentCommentBox`: 当前激活的评论框 ID (`memoId#commentId`)。
2. **事件总线替代**：
   - VueUse `useEventBus` 在 React 中采用轻量订阅器或 Zustand action 自定义事件实现（如 `refreshMemoList()`, `updateMemoItem(id)`）。

### 5.3 Markdown 渲染与 Shiki 代码高亮 (`src/lib/markdown.ts`)
- 配置 `markdown-it`：`html: true, linkify: true, typographer: true, breaks: true`。
- 初始化 `shiki/core` + `@shikijs/markdown-it`：加载 `github-dark` 主题，异步加载 C/CSS/HTML/JS/JSON/Python/Shell/SQL/TSX/XML/YAML/Go 语言支持。
- 代码块复制功能：在 React `useEffect` 中完成全局内联 `main.js` 或脚本挂载，自动在 `.markdown-content > pre.shiki` 内部挂载 `copyBtn` 复制按钮。

### 5.4 图片灯箱 (`src/components/my-fancybox.tsx`)
- 封装 React `MyFancyBox` 组件，使用 `useRef` 挂载 DOM 节点。
- `useEffect` 中生成唯一 `gallery-${randomId}` 属性，调用 `Fancybox.bind` 与 `Fancybox.destroy`，保证页面切换时内存不泄露。

### 5.5 拖拽排序与上传 (`src/components/upload-image-preview.tsx` & `upload-image.tsx`)
- 使用 `sortablejs` 替代 `@vueuse/integrations/useSortable`，在 React 组件挂载后对多图节点初始化拖拽排序，排序变动时回调通知父组件更新 `state.imgs`。
- 文件上传集成：在 `upload.ts` 中封装原生 `XMLHttpRequest` 回调，实时计算并更新上传百分比进度条（支持多文件列表逐一上传与 S3 预签名直传）。

---

## 6. 页面与组件映射清单 (23 个组件 + 12 个页面)

### 6.1 布局与导航
- `src/layouts/default-layout.tsx`：居中容器 `w-full md:w-[567px]`，桌面端右侧固定工具栏、移动端右下角浮动按钮、回到顶部图标。
- `src/components/header.tsx`：顶部封面背景图、用户头像、昵称、签名状态，非首页滚动背景变暗与返回导航。
- `src/components/mobile-nav.tsx`：移动端 Modal 侧滑菜单，集成暗黑模式切换、发表、日历、友链、设置入口。
- `src/components/footer.tsx`：备案号呈现与 GitHub Star 徽章。

### 6.2 Memo 核心组件
- `src/components/memo.tsx`：
  - 点赞状态本地 `localStorage` 防重复与 Google reCAPTCHA 交互。
  - 动态计算内容高度 `memoMaxHeight`，触发“全文/收起”状态。
  - 集成操作工具栏（赞、评论、详情）与管理员 Modal（置顶、编辑、删除）。
- `src/components/memo-edit.tsx`：
  - 编辑/新增状态切换，包含外部链接、多图上传、音乐引用、视频引用、豆瓣图书/电影解析、自定义时间 Picker、标签 ContextMenu 快捷选择、公开/私密切换。
- `src/components/comment.tsx` & `comment-box.tsx`：
  - 嵌套评论、回复目标（`replyTo`）、评论回复框显隐状态控制、字数校验。

### 6.3 预览扩展组件
- `douban-book-preview.tsx` / `douban-movie-preview.tsx`：豆瓣海报、评分、演职员/作者简介及 3D 翻转卡片悬停动画。
- `music-preview.tsx`：自动挂载自定义 WebComponent `<meting-js>`。
- `video-preview.tsx` / `video-preview-iframe.tsx`：HTML5 视频控件与 B站/YouTube 嵌入适配。
- `external-url-preview.tsx`：Favicon + 网页标题预览外链。
- `emoji.tsx`：5 大分类常用 Emoji 标签页。

---

## 7. 构建与嵌入 Go 后端方案

### 7.1 Rsbuild 配置 (`rsbuild.config.ts`)
```ts
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    template: './public/index.html',
    title: 'Moments',
  },
  output: {
    distPath: {
      root: '../backend/public', // 直接输出至后端 embed 静态资源目录
    },
    assetPrefix: '/',
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:37892',
      '/upload': 'http://localhost:37892',
      '/rss': 'http://localhost:37892',
      '/swagger': 'http://localhost:37892',
    },
  },
});
```

### 7.2 Makefile 集成
更新根目录 `Makefile` 自动化构建脚本：
```makefile
WORK_DIR_FRONTEND_REACT := $(CURRENT_DIR)/front-react

frontend-react-install:
	cd $(WORK_DIR_FRONTEND_REACT) && pnpm i

frontend-react-build:
	cd $(WORK_DIR_FRONTEND_REACT) && pnpm run build
```

---

## 8. Task 拆解与实施计划 (Implementation Plan)

- [ ] **Task 1: 初始化 React 19 + Rsbuild 项目骨架**
  - 创建 `front-react/` 目录，安装 React 19, React Router v7, Zustand, TailwindCSS v4, shadcn/ui, Lucide Icons, Sonner 等依赖。
  - 配置 `rsbuild.config.ts` 与开发代理。
- [ ] **Task 2: 类型定义与网络层/状态层封装**
  - 迁移 `types/index.ts`。
  - 封装 `lib/api.ts` (原生 fetch 拦截器) 与 `lib/upload.ts`。
  - 建立 Zustand store (支持 Token 持久化与全局配置管理)。
- [ ] **Task 3: 布局与通用组件开发**
  - 实现 `DefaultLayout`、`Header`、`Footer`、`MobileNav`、`Confirm`。
  - 集成 `next-themes` 实现暗黑模式三态切换。
- [ ] **Task 4: Markdown & 媒体预览组件迁移**
  - 配置 `markdown-it` + `shiki` 代码高亮，迁移 `simple-markdown.scss`。
  - 迁移 `MyFancyBox`, `MusicPreview`, `DoubanBookPreview`, `DoubanMoviePreview`, `VideoPreview`, `ExternalUrlPreview`。
- [ ] **Task 5: Memo 展示与评论系统复刻**
  - 1:1 实现 `Memo` 核心组件、`Comment` 嵌套列表与 `CommentBox` 评论框。
  - 验证点赞防重、Google reCAPTCHA、全文/收起折叠逻辑。
- [ ] **Task 6: Memo 编辑与交互组件复刻**
  - 1:1 实现 `MemoEdit`、`Emoji` 选择器、`UploadImage` (Sortable.js 拖拽排序)、`Music` 编辑、`DoubanEdit`、`UploadVideo`、`DatePicker`。
- [ ] **Task 7: 页面路由与业务页面组装**
  - 配置 React Router v7 路由 (`/`, `/new`, `/edit/:id`, `/memo/:id`, `/friend`, `/user/login`, `/user/reg`, `/user/settings`, `/user/:id`, `/user/calendar`, `/sys/settings`, `/tags/:username/:tag`)。
  - 组装并验证全部 12 个页面逻辑。
- [ ] **Task 8: 生产构建与 Go 后端嵌入集成验证**
  - 配置 Rsbuild 导出至 Go `backend/public`。
  - 运行 Go 后端服务，全面验证功能与静态资源服务。

---

## 9. 验证方案 (Verification Plan)

### 自动化与构建验证
1. 执行 `pnpm build` 或 `rsbuild build` 确认零 TypeScript / 打包错误。
2. 验证产物在 Go 后端 `-tags prod` 模式下编译并能正常启动运行。

### 功能与 UI 手动对比校验
- **响应式布局**：桌面端（`md:w-[567px]` 居中 + 右侧工具栏）与移动端（浮动操作按钮 + 侧滑 Drawer）自适应对比。
- **暗黑模式**：跟随系统 / 亮色 / 暗色三态无缝切换。
- **Memo 交互**：列表自动加载更多、手动加载、删除/编辑/置顶事件响应、评论与回复、点赞及 Google reCAPTCHA 触发。
- **媒体渲染**：Markdown 复杂代码块高亮及复制、图片 Fancybox 放大、B站/YouTube 视频嵌入、MetingJS 音乐卡片、豆瓣悬停 3D 卡片。
- **管理功能**：系统配置修改保存、S3/本地上传切换、清理未关联文件 Modal。
