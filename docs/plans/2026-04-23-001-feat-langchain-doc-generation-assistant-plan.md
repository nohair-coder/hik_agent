---
title: "feat: LangChain 工程文档生成助手"
type: feat
status: active
date: 2026-04-23
---

# feat: LangChain 工程文档生成助手

## Overview

基于 LangChain + Ollama 构建一个**完全本地离线**的工程项目文档生成桌面应用。  
通过 RAG（检索增强生成）学习用户历史文档的写作风格，结合 Qwen2.5-7B 本地大模型，  
生成符合用户个人风格的工程管理类文档（方案、报告、记录等）。

---

## Problem Frame

工程项目文档的撰写存在以下痛点：
- 每次从零开始，重复性高
- 不同工程师风格不统一，难以标准化
- 涉及保密内容，不能上传云端 AI
- 专业术语、格式规范需要长期积累

本方案通过将历史文档向量化入库，让 AI 在生成时参照相同风格，解决上述问题。

---

## Requirements Trace

- R1. 完全本地运行，无需联网，数据不离机
- R2. 支持导入历史 Word/PDF/TXT 文档作为风格学习样本
- R3. 用户描述需求后，生成符合个人风格的完整文档
- R4. 支持流式输出（逐字显示），提升交互体验
- R5. 生成结果可导出为 Word 文档
- R6. 桌面应用，支持 Windows/macOS

---

## Scope Boundaries

- 不包含 Fine-tuning 功能（作为后续迭代，当前版本用 RAG 替代）
- 不包含多用户/权限管理
- 不包含云端同步
- 不包含语音输入
- Word 导出仅支持基础格式，不支持复杂排版

---

## Context & Research

### 技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| 本地大模型 | Ollama + Qwen2.5:7b | ollama 最新版 |
| LangChain 核心 | langchain + langchain-core | >=0.3.0 |
| Ollama 集成 | langchain-ollama | >=0.3.0 |
| 向量数据库 | ChromaDB (langchain-chroma) | >=0.5.0 |
| 中文 Embedding | BAAI/bge-m3 (FlagEmbedding) | >=1.2.0 |
| 后端框架 | FastAPI + uvicorn | >=0.115.0 |
| 文档解析 | python-docx, pypdf | 最新版 |
| 桌面框架 | Tauri v2 | v2.x |
| 前端 UI | Vue 3 + Element Plus | Vue 3.x |

### 关键设计决策

- **双 Collection 策略**：`engineering_docs`（技术知识库）和 `style_samples`（风格样本）分开存储
- **中文分块**：`chunk_size=500` 字符，使用中文标点作为分割符
- **Embedding 选型**：bge-m3 而非 OllamaEmbeddings，中文工程文档效果更好
- **通信协议**：FastAPI SSE（Server-Sent Events）流式推送，前端用原生 `fetch` 接收

---

## Key Technical Decisions

- **不用 LangGraph**：功能相对确定，标准 LCEL 链足够，LangGraph 增加学习成本
- **选 Tauri 而非 Electron**：包体小（~10MB vs ~150MB），性能更好，Tauri v2 对 SSE 支持完善
- **FastAPI 异步架构**：必须使用 `astream()` 异步方法，防止阻塞 event loop
- **两阶段 Prompt**：RAG 检索技术知识 + 风格样本检索，分别注入不同 Prompt 字段

---

## Output Structure

```
hik_agent/
├── backend/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── generate.py          # 文档生成（流式）接口
│   │   │   ├── ingest.py            # 文档导入接口
│   │   │   └── collections.py      # 文档库管理接口
│   │   └── main.py                 # FastAPI 入口，CORS 配置
│   ├── chains/
│   │   ├── rag_chain.py            # 主 RAG 生成链（LCEL）
│   │   └── style_chain.py          # 风格学习链
│   ├── embeddings/
│   │   └── bge_m3.py               # 自定义 BGE-M3 LangChain Wrapper
│   ├── loaders/
│   │   └── pipeline.py             # 文档解析与入库流水线
│   ├── prompts/
│   │   ├── system_prompts.py       # 系统 Prompt 模板
│   │   └── style_templates.py     # 风格学习 Prompt 模板
│   ├── exporters/
│   │   └── word_exporter.py        # Word 文档导出
│   ├── config.py                   # 配置（Pydantic BaseSettings）
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DocumentEditor.vue  # 主编辑区（流式渲染）
│   │   │   ├── FileUpload.vue      # 文档导入组件
│   │   │   ├── DocLibrary.vue      # 文档库管理
│   │   │   └── GenerateForm.vue    # 生成需求表单
│   │   ├── api/
│   │   │   └── client.ts           # SSE 流式 API 客户端
│   │   ├── App.vue
│   │   └── main.ts
│   ├── src-tauri/                  # Tauri Rust 壳
│   │   ├── src/main.rs
│   │   └── tauri.conf.json
│   └── package.json
└── data/
    ├── chroma_db/                  # ChromaDB 持久化存储
    │   ├── engineering_docs/       # 技术知识向量库
    │   └── style_samples/         # 风格样本向量库
    └── exports/                   # 导出的 Word 文档
```

---

## High-Level Technical Design

> *以下为方案示意，供设计评审使用，非实现规范。*

```
用户输入文档需求
      │
      ▼
┌─────────────────────────────────────────────┐
│            LangChain LCEL Chain             │
│                                             │
│  RunnableParallel({                         │
│    tech_context: tech_retriever | format,   │  ← engineering_docs 库
│    style_examples: style_retriever | format,│  ← style_samples 库
│    question: RunnablePassthrough()          │
│  })                                         │
│    │                                        │
│    ▼                                        │
│  ChatPromptTemplate (双上下文注入)           │
│    │                                        │
│    ▼                                        │
│  ChatOllama(qwen2.5:7b)                     │
│    │                                        │
│    ▼                                        │
│  StrOutputParser → SSE Stream               │
└─────────────────────────────────────────────┘
      │
      ▼
前端逐字渲染 → 用户确认 → 导出 Word
```

---

## Implementation Units

- [ ] U1. **环境搭建与依赖配置**

**Goal:** 初始化项目结构，安装并验证所有依赖，确保 Ollama + Qwen2.5 本地可用

**Requirements:** R1, R6

**Dependencies:** 无

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/config.py`
- Create: `backend/api/main.py`

**Approach:**
- 创建 Python 虚拟环境（推荐 `uv` 或 `venv`）
- `requirements.txt` 锁定版本：`langchain>=0.3.0`, `langchain-ollama>=0.3.0`, `langchain-chroma>=0.1.4`, `FlagEmbedding>=1.2.0`, `fastapi>=0.115.0`, `uvicorn[standard]`, `python-docx`, `pypdf`, `chromadb>=0.5.0`
- `config.py` 使用 `pydantic-settings` 管理：`OLLAMA_BASE_URL`, `CHROMA_DB_PATH`, `MODEL_NAME`, `EMBEDDING_MODEL`, `NUM_CTX`
- `main.py` 配置 FastAPI 应用，CORS 允许 `localhost:*`（Tauri 开发需要）

**Test scenarios:**
- 启动验证：`uvicorn backend.api.main:app --reload` 返回 200
- Ollama 连通性：`GET /health` 端点调用 `ChatOllama` 心跳检测，确认模型已加载
- 配置校验：`CHROMA_DB_PATH` 目录自动创建

**Verification:**
- `curl http://localhost:8000/health` 返回 `{"status": "ok", "model": "qwen2.5:7b"}`

---

- [ ] U2. **BGE-M3 Embedding 封装**

**Goal:** 实现符合 LangChain `Embeddings` 接口的 BGE-M3 中文向量化类

**Requirements:** R1（本地运行）

**Dependencies:** U1

**Files:**
- Create: `backend/embeddings/bge_m3.py`

**Approach:**
- 继承 `langchain_core.embeddings.Embeddings`
- 实现 `embed_documents(texts)` 和 `embed_query(text)` 两个方法
- 使用 `FlagEmbedding.BGEM3FlagModel` 加载 `BAAI/bge-m3`
- `use_fp16=True` 节省显存；`batch_size=12` 适合 8GB VRAM
- 首次加载从 HuggingFace 自动下载，后续从本地缓存读取

**Test scenarios:**
- Happy path：`embed_query("混凝土强度等级")` 返回长度 1024 的 float 列表
- 批量嵌入：`embed_documents(["文档1", "文档2"])` 返回正确维度的矩阵
- Edge case：空字符串输入不抛出异常，返回零向量

**Verification:**
- `len(embeddings.embed_query("test")) == 1024`

---

- [ ] U3. **文档解析与入库流水线**

**Goal:** 实现支持 Word/PDF/TXT 的文档解析、中文分块、向量化并存入 ChromaDB 的完整流水线

**Requirements:** R2

**Dependencies:** U2

**Files:**
- Create: `backend/loaders/pipeline.py`
- Create: `backend/api/routes/ingest.py`

**Approach:**
- 使用 `Docx2txtLoader`、`PyPDFLoader`、`TextLoader` 按文件类型分发
- `RecursiveCharacterTextSplitter`：`chunk_size=500`，分割符顺序 `["\n\n", "\n", "。", "；", "，", " ", ""]`
- 每个 chunk 添加 metadata：`source_file`, `file_type`, `doc_category`（`engineering` 或 `style`）, `created_at`
- 以内容 MD5 哈希作为 ChromaDB 文档 ID，自动去重
- 双 Collection 策略：`engineering_docs`（技术参考库）和 `style_samples`（风格样本库）
- FastAPI 接口：`POST /api/ingest`，`multipart/form-data`，字段 `file` + `category`（`engineering`/`style`）

**Test scenarios:**
- Happy path：上传一个 .docx 文件，返回 `{"status": "ok", "chunks": N}`
- 去重：同一文件上传两次，第二次返回 `{"status": "ok", "chunks": 0}` （无新增）
- Edge case：上传空文件返回 400 错误
- Edge case：上传不支持的文件类型（.xlsx）返回 422 错误
- Integration：入库后在 ChromaDB 中查询同名 source_file 可检索到对应 chunks

**Verification:**
- 导入 10 份测试文档后，`engineering_docs` collection 中可通过关键词检索到相关片段

---

- [ ] U4. **RAG 生成链（LCEL）**

**Goal:** 实现双上下文（技术知识 + 风格样本）的 LCEL RAG 链，支持异步流式输出

**Requirements:** R3, R4

**Dependencies:** U2, U3

**Files:**
- Create: `backend/chains/rag_chain.py`
- Create: `backend/prompts/system_prompts.py`
- Create: `backend/prompts/style_templates.py`

**Approach:**

双路检索 + 并行注入：
```
RunnableParallel({
    tech_context: tech_retriever | format_docs,
    style_examples: style_retriever | format_docs,
    question: RunnablePassthrough(),
})
| ChatPromptTemplate
| ChatOllama(model="qwen2.5:7b", num_ctx=8192)
| StrOutputParser()
```

- `tech_retriever`：从 `engineering_docs` 检索，`search_type="mmr"`, `k=5`
- `style_retriever`：从 `style_samples` 检索，`search_type="similarity"`, `k=3`
- 使用 `ChatPromptTemplate.from_messages` 构建 system + human 消息
- System Prompt 包含两个占位符：`{tech_context}` 和 `{style_examples}`
- 所有调用使用 `astream()` 异步方法

**Test scenarios:**
- Happy path：`chain.ainvoke({"question": "编写混凝土浇筑方案"})` 返回非空文档字符串
- 流式输出：`async for chunk in chain.astream(...)` 可迭代，每次 yield 非空 chunk
- Edge case：当两个 collection 都为空时，chain 仍正常运行（零上下文情况）
- Integration：检索结果中的 `source_file` metadata 在返回时附带到响应

**Verification:**
- 对"编写一份模板测试方案"的输入，输出文本包含标题结构和专业术语

---

- [ ] U5. **FastAPI 流式生成接口**

**Goal:** 封装 RAG 链为 SSE 流式 HTTP 接口，供前端消费

**Requirements:** R3, R4

**Dependencies:** U4

**Files:**
- Create: `backend/api/routes/generate.py`
- Modify: `backend/api/main.py`

**Approach:**
- `POST /api/generate/stream` 接受 JSON body：`{question, doc_type, extra_requirements}`
- 使用 `fastapi.responses.StreamingResponse` 返回 `text/event-stream`
- SSE 格式：每个 chunk 包装为 `data: <content>\n\n`，结束发送 `data: [DONE]\n\n`
- 错误时发送 `data: [ERROR] <message>\n\n`
- 响应头设置 `X-Accel-Buffering: no`（防止 nginx 缓冲）
- `POST /api/generate/once` 非流式接口，用于测试和导出

**Test scenarios:**
- Happy path：POST 请求收到 SSE 流，分多个 `data:` 行持续返回内容，最终收到 `[DONE]`
- Edge case：空 `question` 字段返回 422 Validation Error
- Error path：Ollama 服务未启动时，返回 `data: [ERROR] Connection refused\n\n`
- Integration：流式返回的内容拼接后与 `/generate/once` 结果一致

**Verification:**
- `curl -N -X POST http://localhost:8000/api/generate/stream -H "Content-Type: application/json" -d '{"question":"测试"}' ` 可见逐行输出

---

- [ ] U6. **Word 文档导出**

**Goal:** 将生成的 Markdown 格式文本转换并导出为格式化的 Word 文档

**Requirements:** R5

**Dependencies:** U5

**Files:**
- Create: `backend/exporters/word_exporter.py`
- Create: `backend/api/routes/export.py`

**Approach:**
- 接收 Markdown 文本，使用 `python-docx` 构建 Word 文档
- 支持标题层级（`#`, `##`, `###` → Heading 1/2/3）
- 支持段落、列表（有序/无序）、粗体/斜体
- 自动设置页边距：上下 2.54cm，左右 3.17cm（国标）
- 字体：正文宋体 12pt，标题黑体
- `POST /api/export/word` 接收 `{content: string, filename: string}` 返回 `.docx` 文件流

**Test scenarios:**
- Happy path：包含 `# 标题` 和段落的 Markdown 导出为合法 .docx，可用 Word 打开
- Heading 映射：`##` 对应 Word 中的 Heading 2 样式
- Edge case：纯文本（无 Markdown 标记）正常导出为单段落文档
- 文件名：导出文件名为 `{filename}_{timestamp}.docx`

**Verification:**
- 用 `python-docx` 打开导出文件，验证段落数量和样式名称符合预期

---

- [ ] U7. **Tauri 桌面前端**

**Goal:** 构建 Tauri + Vue 3 桌面应用，实现文档生成、导入管理、流式显示的完整 UI

**Requirements:** R4, R6

**Dependencies:** U5, U6

**Files:**
- Create: `frontend/src/components/GenerateForm.vue`
- Create: `frontend/src/components/DocumentEditor.vue`
- Create: `frontend/src/components/FileUpload.vue`
- Create: `frontend/src/components/DocLibrary.vue`
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src-tauri/tauri.conf.json`

**Approach:**

前端架构：
- `GenerateForm.vue`：文档类型选择 + 需求描述文本框 + 生成按钮
- `DocumentEditor.vue`：流式文本渲染区，使用 `marked.js` 实时渲染 Markdown；导出按钮
- `FileUpload.vue`：拖拽上传，显示导入进度和已入库文档数量
- `DocLibrary.vue`：展示两个 Collection 的文档列表，支持删除

SSE 客户端（`client.ts`）：
```typescript
async function* streamGenerate(question: string) {
  const response = await fetch("http://localhost:8000/api/generate/stream", {...})
  const reader = response.body!.getReader()
  // 解析 SSE data: 行，yield 每个 chunk
}
```

Tauri 配置：
- 允许 `http://localhost:8000` 的 HTTP 请求（CSP 配置）
- 启动时自动运行 `uvicorn` Python 后端（sidecar 方式）

**Test scenarios:**
- Happy path：点击生成后，编辑区逐字出现文本，[DONE] 后停止
- 文件上传：拖拽 .docx 文件后，显示"导入成功，共 N 个片段"
- Edge case：后端未启动时，显示"连接失败，请检查服务"错误提示
- 导出：点击"导出 Word"后，系统弹出文件保存对话框

**Verification:**
- 完整用户操作流程可跑通：上传样本 → 输入需求 → 生成文档 → 导出 Word

---

- [ ] U8. **文档库管理接口**

**Goal:** 提供查询、统计和删除 ChromaDB 中文档的接口，供前端展示文档库状态

**Requirements:** R2

**Dependencies:** U3

**Files:**
- Create: `backend/api/routes/collections.py`

**Approach:**
- `GET /api/collections/stats` 返回两个 collection 的文档数量
- `GET /api/collections/{collection}/documents` 返回文档列表（按 source_file 去重）
- `DELETE /api/collections/{collection}/documents/{source_file}` 删除指定文档所有 chunks

**Test scenarios:**
- 导入 3 份文档后，`/stats` 返回对应数量
- 删除文档后，相关 chunks 不再出现在检索结果中
- Edge case：删除不存在的 source_file 返回 404

**Verification:**
- Stats 端点返回的数量与实际入库 chunks 数量一致

---

## System-Wide Impact

- **Embedding 加载时间**：bge-m3 首次加载约 10-30 秒，需在应用启动时预热，避免第一次请求超时
- **内存占用**：Qwen2.5-7B（量化后约 5GB）+ bge-m3（约 2GB）+ ChromaDB，总计约 8-10GB，16GB RAM 可满足
- **并发限制**：Ollama 默认单请求处理，FastAPI 需设置 `asyncio.Lock` 防止并发生成请求互相干扰
- **ChromaDB 线程安全**：`PersistentClient` 不支持多进程，需在 FastAPI 启动时初始化单例
- **Tauri sidecar**：Python 后端需打包为可执行文件（PyInstaller），或通过 Tauri 的 `beforeDevCommand` 在开发模式启动

---

## Risks & Dependencies

| 风险 | 缓解措施 |
|------|----------|
| bge-m3 首次下载较慢（~2GB） | 提供离线安装包或文档指引；应用内显示下载进度 |
| Qwen2.5-7B 无独显时速度较慢（CPU 推理） | 提示用户配置 Ollama GPU 加速；提供 3B 量化版备选 |
| Python 环境打包复杂（PyInstaller） | 第一版可要求用户手动安装 Python；后续版本再做打包 |
| 中文 Word 排版与预期不符 | 提供多套 Word 模板供选择；导出前显示预览 |
| ChromaDB 向量检索质量不稳定 | 支持用户手动调整检索数量 k；提供"参考来源"显示 |

---

## Sources & References

- LangChain LCEL 文档: https://python.langchain.com/docs/expression_language/
- langchain-ollama 包: https://github.com/langchain-ai/langchain/tree/master/libs/partners/ollama
- BAAI/bge-m3: https://huggingface.co/BAAI/bge-m3
- Tauri v2 文档: https://tauri.app/
- ChromaDB 文档: https://docs.trychroma.com/
