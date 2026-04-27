# 🎉 启动系统概览

已为您创建完整的自动化启动系统。

## ⚡ 立即开始

```bash
cd ~/Desktop/hik_agent
make start
```

然后访问 **http://localhost:1420**

---

## 📋 快速命令

```bash
make help           # 显示所有命令
make status         # 检查服务状态
make logs           # 查看日志
make stop           # 停止服务
```

---

## 📦 核心文件

| 文件 | 说明 |
|------|------|
| `start-all.sh` | 一键启动脚本 |
| `Makefile` | 命令接口（推荐） |
| `docker-compose.yml` | Docker 容器编排 |
| `scripts/` | 单独服务脚本 |

---

## 📚 详细文档

- **[QUICKSTART.md](./QUICKSTART.md)** - 启动方式、故障排查、诊断工具
- **[PLATFORM.md](./PLATFORM.md)** - macOS/Windows/Linux 特定配置
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - 部署到阿里云
- **[README.md](./README.md)** - 项目概览

---

## 🎯 常见任务

| 任务 | 命令 |
|------|------|
| 启动所有服务 | `make start` |
| 检查服务状态 | `make status` |
| 查看日志 | `make logs` |
| 停止服务 | `make stop` |
| 创建快捷别名 | 见 [QUICKSTART.md](./QUICKSTART.md) |

---

详见 [QUICKSTART.md](./QUICKSTART.md) 了解更多。
