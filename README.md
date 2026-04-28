# 工程文档生成助手 - 快速启动指南

> 🚀 **一键启动所有服务**（包括 Ollama、ChromaDB、后端、前端）

```bash
cd ~/Desktop/hik_agent && make start
```

就这样！所有服务会在后台启动，访问 **http://localhost:1420** 使用应用。

> 💡 **第一次使用?** 查看 [QUICKSTART.md](./QUICKSTART.md) | [AUTOMATION_SETUP.md](./AUTOMATION_SETUP.md)

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

### 方式 1: 一键启动（推荐）

```bash
# 安装依赖并启动所有服务
make start

# 或查看详细启动选项
make help
```

### 方式 2: 完整启动脚本

```bash
bash start-all.sh
```

### 方式 3: 手动启动（分终端）

**终端 1: Ollama**
```bash
ollama serve
```

**终端 2: ChromaDB**
```bash
docker run -p 8001:8000 -v $(pwd)/data/chroma_db:/chroma/chroma chromadb/chroma
```

**终端 3: 后端**
```bash
cd backend
yarn start
```

**终端 4: 前端**
```bash
cd frontend
yarn dev
```

> 💡 **提示**：详见 [QUICKSTART.md](./QUICKSTART.md) 了解更多启动选项和故障排查

---

## 启动服务详细说明

### 后端（TypeScript + Node.js）

```bash
cd backend
yarn install    # 首次需要
yarn start      # 启动 Hono 服务器，运行在 http://localhost:8000
```

### 前端（React + Vite）

```bash
cd frontend
yarn install    # 首次需要
yarn dev        # 启动开发服务器，访问 http://localhost:1420
```

### Tauri 桌面应用（可选）

```bash
# 需要先安装 Rust: https://rustup.rs
cd frontend
yarn tauri dev
```

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

## 配置（backend/.env）

```env
PORT=8000
OLLAMA_BASE_URL=http://localhost:11434
MODEL_NAME=qwen2.5:7b
EMBEDDING_MODEL=bge-m3
CHROMA_URL=http://localhost:8001
NUM_CTX=8192
TECH_RETRIEVER_K=5
STYLE_RETRIEVER_K=3
```

---

## 常见问题

**Q: ChromaDB 连接失败**
- 确认 ChromaDB 服务正在运行：`curl http://localhost:8001/api/v1/heartbeat`
- 检查端口是否冲突（默认 8001，可在 .env 修改 `CHROMA_URL`）

**Q: bge-m3 不在 Ollama 模型列表**
- 运行 `ollama pull bge-m3` 重新拉取

**Q: 生成速度慢**
- 确认 Ollama 使用 GPU：`ollama ps` 查看是否有显卡占用
- 无独显时 CPU 推理约 10-30 tokens/秒，属正常速度

---

## 📚 更多文档

| 文档 | 说明 |
|------|------|
| [QUICKSTART.md](./QUICKSTART.md) | 🚀 快速启动指南，包含各种启动方式和 Makefile 命令 |
| [PLATFORM.md](./PLATFORM.md) | 💻 平台特定配置（macOS/Windows/Linux） |
| [docs/plans/](./docs/plans/) | 📋 项目规划和技术设计文档 |

---

## 快速命令速查

```bash
# 一键启动所有服务
make start

# 查看所有可用命令
make help

# 检查服务状态
make status

# 查看日志
make logs

# 停止所有服务
make stop
```

详见 [QUICKSTART.md](./QUICKSTART.md) 了解更多。
