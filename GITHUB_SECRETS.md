# GitHub Secrets 配置指南

## 快速配置（3 步）

### 1️⃣ 打开 Settings
GitHub 仓库主页 → 点击 **Settings**

### 2️⃣ 进入 Secrets
左侧菜单 → **Secrets and variables** → **Actions**

### 3️⃣ 添加 3 个密钥

| # | Name | Secret 值 |
|---|------|----------|
| 1️⃣ | `ALIYUN_HOST` | `8.136.151.205` |
| 2️⃣ | `ALIYUN_USER` | `root` |
| 3️⃣ | `ALIYUN_PASSWORD` | `Wangxuezhishi32!` |

点击 **New repository secret** 逐个添加。

---

## 详细步骤（图文版）

### 第 1 步：打开仓库设置

1. 打开你的 GitHub 仓库主页
2. 点击顶部菜单中的 **Settings**（设置）

```
菜单位置：
[Code] [Issues] [Pull requests] [Actions] [Projects] [Wiki] [Security] [Insights] [Settings]
                                                                                      ↑
```

### 第 2 步：进入 Secrets 管理

1. 左侧菜单 → **Security** 部分 → **Secrets and variables**
2. 选择 **Actions** 标签

### 第 3 步：添加密钥

点击 **New repository secret**，逐个添加：

**密钥 1: ALIYUN_HOST**
```
Name: ALIYUN_HOST
Secret: 8.136.151.205
```

**密钥 2: ALIYUN_USER**
```
Name: ALIYUN_USER
Secret: root
```

**密钥 3: ALIYUN_PASSWORD**
```
Name: ALIYUN_PASSWORD
Secret: Wangxuezhishi32!
```

### 第 4 步：验证

完成后应该看到：
```
Repository secrets (3)

Name                 Updated
──────────────────────────────────────────
✓ ALIYUN_HOST          Just now
✓ ALIYUN_USER          Just now  
✓ ALIYUN_PASSWORD      Just now
```

---

## 什么是 GitHub Secrets？

GitHub Secrets 是安全密钥管理系统，用于存储敏感信息（密码、API 密钥等），这些信息：
- **不会被暴露**在仓库代码中
- **只在 GitHub Actions 运行时可用**
- **不会被记录在日志中**（被 GitHub 自动隐藏）

---

## 测试部署

### 触发部署的方式

**方式 A：Merge PR（推荐）**
1. 创建功能分支
2. 推送代码
3. 创建 PR 到 main
4. Merge PR → 自动部署

**方式 B：直接推送**
```bash
git push origin main
```

**方式 C：手动触发**
GitHub Actions 页面 → Deploy 工作流 → Run workflow

### 查看部署状态

1. 打开仓库 → **Actions** 标签
2. 点击 "Deploy to Aliyun" 工作流
3. 查看 deploy 任务日志

状态指示：
- ✅ 绿色 = 成功  
- ❌ 红色 = 失败  
- ⏳ 黄色 = 进行中

---

## 部署后访问应用

| 服务 | 网址 |
|------|------|
| 🖥️ 前端 | http://8.136.151.205:1420 |
| 🔧 API | http://8.136.151.205:8000 |
| 📊 ChromaDB | http://8.136.151.205:8001 |

---

## 常见问题

### Q1：如何修改密钥值？

1. 进入 Secrets 列表
2. 找到要修改的密钥，点击右侧的 **...** 菜单
3. 选择 **Update secret**
4. 输入新值并确认

**注意**：修改后，下次工作流运行会使用新的密钥值。

### Q2：如何删除密钥？

1. 进入 Secrets 列表
2. 找到要删除的密钥，点击右侧的 **...** 菜单
3. 选择 **Delete secret**
4. 确认删除

### Q3：密钥泄露了怎么办？

如果怀疑密钥泄露：

1. **立即修改服务器密码**
   ```bash
   sshpass -p "旧密码" ssh root@8.136.151.205
   passwd
   ```

2. **更新 GitHub 密钥**
   - 在 Secrets 中更新 `ALIYUN_PASSWORD` 为新密码

3. **检查服务器访问日志**
   ```bash
   cat /var/log/auth.log  # 查看登录记录
   ```

### Q4：工作流运行中密钥会被显示在日志中吗？

**不会**。GitHub 会自动隐藏日志中的密钥值，显示为 `***`。

### Q5：本地开发时如何使用这些密钥？

本地开发不需要使用这些密钥。只有 GitHub Actions 工作流运行时才会使用。

如果需要本地测试部署，创建本地 `.env` 文件：
```env
ALIYUN_HOST=8.136.151.205
ALIYUN_USER=root
ALIYUN_PASSWORD=Wangxuezhishi32!
```

**重要**：把 `.env` 添加到 `.gitignore`，防止提交到仓库。

---

## 工作流中的使用

在 `.github/workflows/deploy.yml` 中这样使用：

```yaml
env:
  ALIYUN_HOST: ${{ secrets.ALIYUN_HOST }}
  ALIYUN_USER: ${{ secrets.ALIYUN_USER }}
  ALIYUN_PASSWORD: ${{ secrets.ALIYUN_PASSWORD }}
```

---

## 安全建议

1. **定期更新密码**：建议每 3 个月更改一次服务器密码
2. **使用 SSH 密钥认证**（更安全）：
   - 生成 SSH 密钥对
   - 添加公钥到服务器
   - 使用私钥替代密码认证
3. **审计访问日志**：定期检查服务器登录记录
4. **限制 IP 访问**：配置服务器防火墙只允许特定 IP
5. **使用强密码**：确保服务器密码足够复杂

---

## 参考链接

- [GitHub Secrets 官方文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Actions 工作流语法](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [本项目 CI/CD 配置](.github/workflows/deploy.yml)
- [部署指南](./DEPLOYMENT.md)
