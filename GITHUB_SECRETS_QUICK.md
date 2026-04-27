# GitHub Secrets 快速配置卡片

## 3 步快速配置

### 步骤 1：打开 Settings
GitHub 仓库主页 → 点击 **Settings**

### 步骤 2：进入 Secrets
左侧菜单 → **Secrets and variables** → **Actions**

### 步骤 3：添加 3 个密钥

逐个点击 **New repository secret** 按钮，分别添加：

| # | Name | Secret 值 |
|---|------|----------|
| 1️⃣ | `ALIYUN_HOST` | `8.136.151.205` |
| 2️⃣ | `ALIYUN_USER` | `root` |
| 3️⃣ | `ALIYUN_PASSWORD` | `Wangxuezhishi32!` |

---

## 完成后的样子

```
Repository secrets (3)

Name                 Updated
──────────────────────────────────────────
✓ ALIYUN_HOST          Just now
✓ ALIYUN_USER          Just now  
✓ ALIYUN_PASSWORD      Just now
```

---

## 测试部署

配置完成后，随时可以通过以下方式触发部署：

### 方式 A：Merge PR（推荐）
1. 创建功能分支
2. 推送代码
3. 创建 PR 到 main
4. Merge PR → 自动部署

### 方式 B：直接推送
```bash
git push origin main
```

### 方式 C：手动触发
GitHub Actions 页面 → Deploy 工作流 → Run workflow

---

## 查看部署状态

1. 打开仓库 → **Actions** 标签
2. 点击 "Deploy to Aliyun" 工作流
3. 查看 deploy 任务日志

✅ 绿色 = 成功  
❌ 红色 = 失败  
⏳ 黄色 = 进行中

---

## 部署完成后访问

| 服务 | 网址 |
|------|------|
| 🖥️ 前端 | http://8.136.151.205:1420 |
| 🔧 API | http://8.136.151.205:8000 |
| 🤖 Ollama | http://8.136.151.205:11434 |
| 📊 ChromaDB | http://8.136.151.205:8001 |

---

## 需要帮助？

📖 完整指南：`GITHUB_SECRETS_SETUP.md`  
📄 部署文档：`DEPLOYMENT.md`  
⚙️ 工作流配置：`.github/workflows/deploy.yml`
