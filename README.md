# Moments - 极简朋友圈 (React 19 / Go)

[![release](https://img.shields.io/badge/release-v0.2.1-blue)](https://gitee.com/kerntau/moments)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE.txt)

> **Moments** 是一款采用 Golang (Echo) 作为高性能服务端，前端采用 **React 19 + Rsbuild (Rspack)** 打造的极简朋友圈应用！具备极致的加载速度、媲美原生的交互体验以及极高的轻量化部署优势。

---

## 🌟 核心特性

### 📱 朋友圈动态 (Memo)
- **Markdown 引擎**：支持 Markdown 实时渲染、语法高亮与 `#` 标签快捷插入
- **丰富媒体支撑**：支持多图拖拽排序、全屏图片灯箱预览、本地视频上传及 Bilibili / YouTube 视频嵌入
- **卡片扩展**：支持豆瓣图书 / 电影卡片一键检索与 3D 悬浮预览，支持 MetingJS 音乐播放器
- **互动机制**：支持动态点赞、防重复评论、评论排序及后台评论功能开关
- **地理位置**：内置**高德地图 JS API** 与 **OpenStreetMap (Nominatim)** 双地图引擎，支持精准定位、周边 POI 检索、国外地点自动降级搜索与自定义位置创建

### ⚙️ 后台与系统服务
- **数据与文件安全**：自动按日期分目录归档上传，内置 SHA256 秒传机制与图片缩略图自动生成；支持 S3 (AWS/OSS/COS) 对象存储扩展
- **一键平滑升级**：支持后台直接一键检查并在线同步 Git 仓库更新，编译替换后端二进制并平滑重启服务
- **数据全量保护**：重新部署或安装时，自动保留 SQLite 数据库、上传资源文件与系统配置，零数据丢失风险
- **权限自动纠偏**：部署与服务启动时自动修复全量文件及 `.git` 目录写权限，完美防止只读锁定

---

## 🛠️ 技术栈说明

- **后端 (Backend)**：Golang 1.23+ / Echo v4 / SQLite (GORM) / Zerolog / Cleanenv
- **前端 (Frontend)**：React 19 / Rsbuild (Rspack) / React Router v7 / Zustand / TailwindCSS v4 / Radix UI (shadcn/ui) / Lucide Icons

---

## 🚀 快速部署指南

### 1. Linux 一键自动部署（推荐）

在 Linux 服务器上执行一键部署脚本：

```bash
# 下载安装脚本并执行
curl -fsSL https://gitee.com/kerntau/moments/raw/main/install.sh | bash
```

> **重新部署/升级说明**：
> 再次运行部署脚本时，会自动安全停止旧服务，清除旧的临时编译缓存，**全量保留你的 SQLite 数据库与上传图片**，并自动矫正文件读写权限。

---

### 2. 环境变量说明

| 变量名 | 说明 | 默认值 |
| --- | --- | --- |
| `PORT` | 服务监听端口 | `37892` |
| `SERVICE_HOST` | 监听绑定地址 | `0.0.0.0` |
| `JWT_KEY` | JWT 鉴权密钥 | 随机生成 32 位字符串 |
| `DB` | SQLite 数据库存储路径 | `/app/data/db.sqlite` |
| `UPLOAD_DIR` | 本地媒体文件存储目录 | `/app/data/upload` |
| `LOG_LEVEL` | 日志打印级别 (`INFO`/`DEBUG`/`WARN`) | `INFO` |

---

## 🗺️ 地理定位与高德地图配置说明

1. **移动端 GPS 定位要求**：
   - 现代移动端浏览器（Safari、微信内置浏览器、Chrome Mobile）强制要求网页必须在 **HTTPS 协议** 下（或 `localhost`）才允许调取 GPS 定位权限。如在 HTTP 协议下访问，定位会自动降级并给予用户清晰提示。
2. **高德地图与海外地点搜索**：
   - 高德地图 API 仅涵盖中国大陆及港澳台数据。针对海外城市或搜索无高德 POI 的地点，系统会自动降级无缝切换为 **OpenStreetMap 全球检索**，确保国内外地点均可灵活搜索与添加。

---

## 💻 本地开发与打包

### 1. 本地开发环境

```bash
# 克隆仓库
git clone https://gitee.com/kerntau/moments.git
cd moments

# 启动后端 (Golang)
cd backend
go run .

# 启动前端 React (新终端)
cd ../front-react
pnpm install
pnpm run dev
```

### 2. 生产单二进制编译

```bash
# 1. 编译 React 静态产物至 backend/public
cd front-react
pnpm run build

# 2. 编译 Golang 单二进制文件 (prod 模式)
cd ../backend
go build -tags prod -ldflags="-s -w" -o dist/moments .
```

---

## 📄 开源许可

本项目遵循 [MIT 许可证](LICENSE.txt)。
