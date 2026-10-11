# Moments

一个轻量的自托管朋友圈（Memo）应用：Go/Echo 后端负责 API 与数据，React 19 前端提供动态发布、媒体浏览和互动。

## 功能

- Markdown 动态、标签、评论和点赞
- 多图拖拽排序、图片灯箱、本地视频
- Bilibili / YouTube 嵌入与音乐卡片
- SQLite 数据库存储，按日期归档上传文件
- SHA-256 秒传、缩略图和可选 S3/OSS/COS 存储
- 高德地图与 OpenStreetMap 双地图搜索
- 后台在线升级、配置备份和权限修复

## 技术栈

- 后端：Go 1.23+、Echo v4、GORM、SQLite、Zerolog、Cleanenv
- 前端：React 19、Rsbuild、React Router 7、Zustand、Tailwind CSS 4、Radix UI

## 快速部署

Linux 服务器可使用仓库中的 install.sh。运行前请审阅脚本内容并确认目标目录、权限和备份策略。

~~~bash
git clone https://github.com/kerntau/moments.git
cd moments
bash install.sh
~~~

主要环境变量：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| PORT | 37892 | 服务端口 |
| SERVICE_HOST | 0.0.0.0 | 监听地址 |
| JWT_KEY | 启动时随机生成 | JWT 密钥 |
| DB | /app/data/db.sqlite | SQLite 文件 |
| UPLOAD_DIR | /app/data/upload | 媒体目录 |
| LOG_LEVEL | INFO | 日志级别 |

## 本地开发

需要 Go 1.23+、Node.js 和 pnpm。

~~~bash
cd backend
go run .

# 新终端
cd front-react
pnpm install
pnpm dev
~~~

生产构建：

~~~bash
cd front-react
pnpm build
cd ../backend
go build -tags prod -ldflags="-s -w" -o dist/moments .
~~~

HTTPS、JWT 密钥、对象存储凭据和地图 API Key 应通过部署平台的密钥管理提供。

## 许可证

MIT，详见 LICENSE.txt。
