/**
 * 应用配置
 * 通过环境变量覆盖默认值，例如在 .env 文件中设置
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "../..");

const env = (key: string, fallback: string): string => {
  return process.env[key] ?? fallback;
};

export const config = {
  // 服务端口
  port: Number(env("PORT", "8000")),

  // Ollama
  ollamaBaseUrl: env("OLLAMA_BASE_URL", "http://localhost:11434"),
  modelName: env("MODEL_NAME", "qwen2.5:7b"),
  numCtx: Number(env("NUM_CTX", "8192")),
  temperature: Number(env("TEMPERATURE", "0.7")),

  // Embedding（通过 Ollama 运行 bge-m3）
  embeddingModel: env("EMBEDDING_MODEL", "bge-m3"),

  // ChromaDB（需要单独运行 `chroma run` 或 docker）
  chromaUrl: env("CHROMA_URL", "http://localhost:8001"),
  techCollection: env("TECH_COLLECTION", "engineering_docs"),
  styleCollection: env("STYLE_COLLECTION", "style_samples"),

  // RAG 检索参数
  techRetrieverK: Number(env("TECH_RETRIEVER_K", "5")),
  styleRetrieverK: Number(env("STYLE_RETRIEVER_K", "3")),

  // 导出目录
  exportDir: env("EXPORT_DIR", resolve(ROOT, "data", "exports")),
} as const;

// 确保导出目录存在
mkdirSync(config.exportDir, { recursive: true });
