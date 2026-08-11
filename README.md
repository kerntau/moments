# Moments - 极简朋友圈 (React 19 / Go)

[![release](https://img.shields.io/badge/release-更新记录-blue)](https://github.com/kerntau/moments/releases)

> Moments 采用 Golang 作为高性能服务端，前端已升级复刻为 React 19 + Rsbuild 现代化架构！包体积更小，渲染性能更佳！

---

## 🌟 技术栈说明

- **后端 (Backend)**：Go 1.23+ / Gin / SQLite / GORM / JWT
- **React 19 前端 (`front-react/`)**：React 19 + Rsbuild (Rspack) + React Router v7 + Zustand + TailwindCSS v4 + PostCSS + Radix UI (shadcn/ui)
- **Vue 3 前端 (`front/`)**：Vue 3 + Nuxt 3 (保留参考)

---

## 📱 功能说明

### 用户系统

- **默认管理员**：`admin/a123456`，登录后可在后台修改密码
- **多用户模式**：可在后台设置是否允许自由注册

### Memo 动态

- 支持使用 **Markdown** 语法编写与实时预览
- 支持修改发布时间（未来时间对游客隐蔽）
- 支持标签关联与右键 `#` 标签快捷插入
- 支持多图拖拽排序 (`sortablejs`) 与全屏图片灯箱预览 (`Fancybox`)
- 支持本地视频上传与 Bilibili / YouTube 视频内嵌播放
- 支持外链引用与 MetingJS 音乐播放器
- 支持豆瓣图书 / 豆瓣电影卡片一键搜索与 3D 悬浮预览
- 支持点赞、评论防重、评论排序及后台评论功能开关

### 文件存储与清理

- **本地存储**：支持存储至 `$UPLOAD_DIR`，内置 SHA256 秒传机制与图片缩略图自动生成；支持清理无关联垃圾文件至 `$UPLOAD_DIR/removed`。
- **S3 存储**：兼容 AWS S3、阿里云 OSS、腾讯云 COS 等对象存储服务，支持自动拼接缩略图后缀。

### 其他特性

- **暗黑模式**：内置系统级 Dark / Light 主题切换
- **日历检索**：支持自定义时间段、关键字、标签、可见性组合检索
- **友情链接**：支持友链申请、后台审核管理
- **RSS 订阅与邮件通知**：支持评论/互动邮件通知及标准 RSS 输出

---

## 🚀 快速上手

### 应用环境变量

| 变量名 | 说明 | 默认值 |
| --- | --- | --- |
| PORT | 监听端口 | 3000 |
| CORS_ORIGIN | 允许的跨域 Origin 列表 | 空，多个 Origin 使用逗号分隔 |
| JWT_KEY | JWT 密钥 | 空（默认随机生成） |
| DB | SQLite 数据库路径 | /app/data/db.sqlite |
| UPLOAD_DIR | 本地上传文件目录 | /app/data/upload |
| LOG_LEVEL | 日志级别 | info |

---

## 🛠️ 本地开发指南

### 1. 使用 Makefile（推荐）

#### 启动后端 API 服务：
```bash
cd moments
make backend-dev
```

#### 启动 React 19 前端（新终端）：
```bash
cd moments
make frontend-react-install
make frontend-react-dev
```
访问前端开发环境：`http://localhost:3000`

---

### 2. 手动启动

#### 后端 (Golang)：
```bash
cd moments/backend
go run .
```

#### React 19 前端：
```bash
cd moments/front-react
pnpm install
pnpm run dev
```

---

## 📦 生产打包构建

一键编译 React 静态产物并嵌入 Go 后端单可执行文件：

```bash
# 1. 编译 React 19 前端产物至 backend/public
cd moments/front-react
pnpm run build

# 2. 编译 Go 嵌入式单二进制文件
cd ../backend
go build -tags prod -o dist/moments.exe .
```

---

## 📄 开源许可

本项目遵循 MIT 许可证。欢迎提交 Issue 与 Pull Request！
