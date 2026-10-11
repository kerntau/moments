<div align="center">

# MOMENTS // 极简朋友圈

**Go + React 的自托管动态与媒体空间**<br>
*Self-hosted memos with media, comments, and location.*

[![Go](https://img.shields.io/badge/Go-1.23%2B-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=111111)](https://react.dev)
[![SQLite](https://img.shields.io/badge/SQLite-Embedded-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![License](https://img.shields.io/badge/License-MIT-555555?style=for-the-badge)](LICENSE.txt)

</div>

---

## 01. THE PURPOSE // 项目本源

Moments 是一个轻量自托管朋友圈（Memo）应用，支持 Markdown 动态、媒体、评论、点赞、位置搜索与后台升级。

[Repository](https://github.com/kerntau/moments)

## 02. CORE ARCHITECTURE // 核心架构

~~~mermaid
graph LR
  W[React + Rsbuild] --> API[Go Echo API]
  API --> DB[(SQLite/GORM)]
  API --> FS[Upload directory]
  API -. optional .-> OBJ[S3/OSS/COS]
  API --> MAP[Gaode / OpenStreetMap]
~~~

前端构建产物可嵌入后端二进制；上传文件与 SQLite 数据库应持久化到独立数据目录。

## 03. TECHNICAL MATRIX // 技术矩阵

| 层 | 技术 | 说明 |
| --- | --- | --- |
| Backend | Go 1.23、Echo v4、GORM | API、鉴权与升级 |
| Frontend | React 19、Rsbuild、Zustand | 动态、评论和媒体 |
| Storage | SQLite、文件目录、可选对象存储 | 数据与上传 |
| Location | 高德 JS API、OpenStreetMap | 定位和 POI |
| Build | pnpm、Go build | 开发与单二进制发布 |

## 04. REPOSITORY TOPOLOGY // 源码拓扑

~~~text
backend/             # Go API、数据库、服务入口
front-react/         # React 前端
backend/public/      # 生产嵌入的静态产物
install.sh           # Linux 部署脚本
docs/                # 运维与部署说明
~~~

## 05. CLONE & QUICK START // 极速开始

需要 Go 1.23+、Node.js 和 pnpm。

~~~bash
git clone https://github.com/kerntau/moments.git
cd moments
cd backend
go run .
~~~

另开终端启动前端：

~~~bash
cd front-react
pnpm install
pnpm dev
~~~

## 06. DEPLOYMENT & VERIFICATION // 部署与验证

Linux 可审阅 install.sh 后执行。生产构建：

~~~bash
cd front-react && pnpm build
cd ../backend && go build -tags prod -ldflags="-s -w" -o dist/moments .
~~~

发布前验证登录、动态发布、媒体上传、评论、地图降级和数据备份。JWT_KEY、对象存储凭据、地图 API Key 与数据目录必须由部署平台保护。

## 07. ENGINEERING CONTRACT // 工程契约

- 升级和迁移必须保留 SQLite 与上传目录。
- 文件上传需校验类型、大小、路径和权限。
- 外部地图/对象存储不可用时提供明确降级或错误提示。
- 后端 API 与前端类型变更需同步验证。

## 08. ROADMAP // 演进路线

- [x] 动态、媒体、评论、点赞和位置
- [x] SQLite 持久化与可选对象存储
- [ ] 更细粒度的媒体权限
- [ ] 可选的多用户与通知模块

## 09. LICENSE // 许可证

遵循 [MIT](LICENSE.txt)。
