# 工程文档生成助手

> 🚀 **一键启动**：`make start` → 访问 **http://localhost:1420**

> 💡 **第一次使用?** 查看 [QUICKSTART.md](./QUICKSTART.md) | [PLATFORM.md](./PLATFORM.md)

---

## 技术栈

| 层 | 技术 |
|---|---|
| 后端框架 | Node.js + Hono v4 |
| AI 框架 | LangChain.js v1 (LCEL) |
| 本地大模型 | Ollama + Qwen2.5-7B |
| 向量数据库 | ChromaDB |
| 中文 Embedding | bge-m3（通过 Ollama） |
| 前端 | React 18 + Ant Design 5 + Tauri v2 |

---

## 前置要求

### 1. 安装 Ollama 并拉取模型

```bash
# 安装 Ollama: https://ollama.ai

# 拉取 LLM 模型（约 4.7GB）
ollama pull qwen2.5:7b

# 拉取 Embedding 模型（约 1.2GB，与 Python 版本完全一致）
ollama pull bge-m3

# 确认模型已就绪
ollama list
```

### 2. 启动 ChromaDB

```bash
# 方式一：pip 安装后直接运行
pip install chromadb
chroma run --host localhost --port 8001 --path ./data/chroma_db

# 方式二：Docker（推荐）
docker run -p 8001:8000 -v $(pwd)/data/chroma_db:/chroma/chroma chromadb/chroma
```

---

## 🚀 快速启动

```bash
cd ~/Desktop/hik_agent
make start                  # 一键启动所有服务
make help                   # 查看所有命令
make status                 # 检查服务状态
make stop                   # 停止所有服务
```

📖 详见 [QUICKSTART.md](./QUICKSTART.md) 了解启动选项、故障排查及平台特定配置

---

## 使用流程

1. **导入历史文档**：拖拽上传 .docx/.pdf/.txt 文件
   - **技术知识库**：技术规范、施工方案等参考资料
   - **风格样本库**：您自己写的历史文档（建议 10 份以上）

2. **生成文档**：选择文档类型 → 描述需求 → 点击生成

3. **导出**：点击「导出 Word」保存为 .docx 文件

---

## 目录结构

```
hik_agent/
├── backend/                  # TypeScript 后端
│   ├── src/
│   │   ├── index.ts          # Hono 应用入口
│   │   ├── config.ts         # 配置（可用 .env 覆盖）
│   │   ├── chains/
│   │   │   └── ragChain.ts   # LangChain.js LCEL RAG 链
│   │   ├── embeddings/
│   │   │   └── stores.ts     # ChromaDB + OllamaEmbeddings 单例
│   │   ├── loaders/
│   │   │   └── pipeline.ts   # 文档解析与入库
│   │   ├── prompts/
│   │   │   └── templates.ts  # Prompt 模板
│   │   ├── exporters/
│   │   │   └── wordExporter.ts  # Markdown → Word
│   │   └── routes/
│   │       ├── generate.ts   # SSE 流式生成
│   │       ├── ingest.ts     # 文档上传导入
│   │       ├── collections.ts # 文档库管理
│   │       └── export.ts     # Word 导出
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React + Tauri 前端
└── data/
    ├── chroma_db/            # ChromaDB 持久化
    └── exports/              # 导出文件
```

---

---

## 📚 文档导航

| 文档 | 内容 |
|------|------|
| [QUICKSTART.md](./QUICKSTART.md) | 启动方式、Makefile 命令、故障排查 |
| [PLATFORM.md](./PLATFORM.md) | macOS/Windows/Linux 特定配置、GPU 加速 |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | CI/CD 部署到阿里云 |
| [GITHUB_SECRETS.md](./GITHUB_SECRETS.md) | GitHub Actions 密钥配置 |
| [docs/plans/](./docs/plans/) | 项目规划和技术设计
