# GitHub 密钥配置详细指南

## 什么是 GitHub Secrets？

GitHub Secrets 是 GitHub 提供的安全密钥管理系统，用于存储敏感信息（如密码、API 密钥等），这些信息：
- **不会被暴露**在仓库代码中
- **只在 GitHub Actions 运行时可用**
- **不会被记录在日志中**（被 GitHub 自动隐藏）

## 配置步骤（图文版）

### 第 1 步：打开仓库设置

1. 打开你的 GitHub 仓库主页
   - 网址：https://github.com/nohair-coder/hik_agent

2. 点击顶部菜单栏中的 **Settings**（设置）按钮

```
仓库主页菜单位置：
[Code] [Issues] [Pull requests] [Actions] [Projects] [Wiki] [Security] [Insights] [Settings]
                                                                                        ↑
                                                                                    点击这里
```

### 第 2 步：进入 Secrets 管理界面

1. 在左侧导航菜单中找到 **Security** 部分
2. 点击 **Secrets and variables**
3. 选择 **Actions** 选项卡

```
左侧菜单导航：
├── General
├── Security
│   ├── Secrets and variables  ← 点击这里
│   │   ├── Actions            ← 选择这个标签
│   │   ├── Codespaces
│   │   └── Dependabot
│   ├── Code security and analysis
│   └── ...
```

### 第 3 步：添加第一个密钥 (ALIYUN_HOST)

1. 点击页面右上方的 **New repository secret** 绿色按钮

2. 在 **Name** 字段输入：
   ```
   ALIYUN_HOST
   ```

3. 在 **Secret** 字段输入：
   ```
   8.136.151.205
   ```

4. 点击 **Add secret** 按钮

```
表单示例：
┌─────────────────────────────────────────┐
│ New secret                              │
├─────────────────────────────────────────┤
│ Name *                                  │
│ ┌─────────────────────────────────────┐ │
│ │ ALIYUN_HOST                         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Secret *                                │
│ ┌─────────────────────────────────────┐ │
│ │ 8.136.151.205                       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Add secret] [Cancel]                   │
└─────────────────────────────────────────┘
```

### 第 4 步：添加第二个密钥 (ALIYUN_USER)

1. 再次点击 **New repository secret** 按钮

2. 在 **Name** 字段输入：
   ```
   ALIYUN_USER
   ```

3. 在 **Secret** 字段输入：
   ```
   root
   ```

4. 点击 **Add secret** 按钮

### 第 5 步：添加第三个密钥 (ALIYUN_PASSWORD)

1. 再次点击 **New repository secret** 按钮

2. 在 **Name** 字段输入：
   ```
   ALIYUN_PASSWORD
   ```

3. 在 **Secret** 字段输入：
   ```
   Wangxuezhishi32!
   ```

4. 点击 **Add secret** 按钮

### 第 6 步：验证配置

添加完所有三个密钥后，你应该看到一个列表：

```
Repository secrets (3)

Name                 Updated
──────────────────────────────────────────
ALIYUN_HOST          Just now
ALIYUN_USER          Just now
ALIYUN_PASSWORD      Just now
```

## 完整的密钥对照表

| 名称 | 值 | 说明 |
|------|-----|------|
| **ALIYUN_HOST** | `8.136.151.205` | 阿里云服务器的公网 IP 地址 |
| **ALIYUN_USER** | `root` | 服务器登录用户名 |
| **ALIYUN_PASSWORD** | `Wangxuezhishi32!` | 服务器登录密码 |

## 这些密钥在 CI/CD 中的作用

当你的代码 merge 到 main 分支时，`.github/workflows/deploy.yml` 工作流会使用这些密钥：

```yaml
# 工作流文件中的使用方式
env:
  ALIYUN_HOST: ${{ secrets.ALIYUN_HOST }}          # 8.136.151.205
  ALIYUN_USER: ${{ secrets.ALIYUN_USER }}          # root
  ALIYUN_PASSWORD: ${{ secrets.ALIYUN_PASSWORD }}  # Wangxuezhishi32!
```

## 查看密钥是否生效

### 方式 1：查看工作流运行日志

1. 在仓库主页点击 **Actions** 标签
2. 选择最新的工作流运行
3. 点击 **deploy** 任务查看日志

```
Actions 标签位置：
仓库主页菜单 → [Actions] ← 点击这里
```

### 方式 2：检查部署状态

在 Actions 页面查看：
- ✅ **绿色勾号** = 部署成功
- ❌ **红色 X** = 部署失败（查看日志了解原因）
- ⏳ **黄色圆圈** = 正在部署中

## 常见问题

### Q1：如何修改密钥值？

如果需要修改某个密钥（如更改密码）：

1. 进入 Secrets 列表
2. 找到要修改的密钥，点击右侧的 **...** 菜单
3. 选择 **Update secret**
4. 输入新值
5. 点击 **Update secret**

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
   # SSH 连接到服务器
   sshpass -p "旧密码" ssh root@8.136.151.205
   
   # 修改密码
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

```
示例日志输出：
Run ./deploy.sh "8.136.151.205" "root" "***"
```

### Q5：本地开发时如何使用这些密钥？

本地开发不需要使用这些密钥。只有 GitHub Actions 工作流运行时才会使用。

如果需要本地测试部署，创建本地 `.env` 文件：
```env
ALIYUN_HOST=8.136.151.205
ALIYUN_USER=root
ALIYUN_PASSWORD=Wangxuezhishi32!
```

**重要**：把 `.env` 添加到 `.gitignore`，防止提交到仓库。

## 下一步

配置完成所有三个密钥后：

1. ✅ GitHub Secrets 已准备好
2. ⏳ 等待首次部署测试

### 触发首次部署

任选一种方式：

**方式 1：通过 PR（推荐）**
```bash
# 本地
git checkout -b test-deployment
git push origin test-deployment

# 在 GitHub 上创建 PR 到 main
# Merge PR 后自动触发部署
```

**方式 2：直接推送到 main**
```bash
git push origin main
```

**方式 3：手动触发工作流**
在 GitHub Actions 页面可以手动点击触发。

## 查看部署日志

部署触发后：

1. 打开仓库 → **Actions** 标签
2. 点击最新的 "Deploy to Aliyun" 工作流
3. 点击 "deploy" 任务查看实时日志

```
日志示例输出：
✓ Checkout code
✓ Setup Node.js 18
✓ Install dependencies
✓ Build backend
✓ Build frontend
✓ Install sshpass
✓ Run deployment
  → 开始部署到 8.136.151.205...
  → 上传代码...
  → 启动服务...
  → ✓ 后端服务已启动
  → ✓ 前端服务已启动
  → ✓ 部署成功！
```

## 安全建议

1. **定期更新密码**：建议每 3 个月更改一次服务器密码
2. **使用 SSH 密钥认证**（更安全）：
   - 生成 SSH 密钥对
   - 添加公钥到服务器
   - 使用私钥替代密码认证
3. **审计访问日志**：定期检查服务器登录记录
4. **限制 IP 访问**：配置服务器防火墙只允许特定 IP
5. **使用强密码**：确保服务器密码足够复杂

## 参考链接

- [GitHub Secrets 官方文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Actions 工作流语法](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [本项目 CI/CD 配置](.github/workflows/deploy.yml)
