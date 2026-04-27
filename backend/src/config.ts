/**
 * 应用配置
 * 通过环境变量覆盖默认值，例如在 .env 文件中设置
 *
 * 使用 OpenAI 兼容 API，支持 OpenAI / DeepSeek / 阿里云 Qwen / 任意兼容接口。
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

  // ── LLM 配置（OpenAI 兼容 API）────────────────────────────────
  // 模型名称（如 gpt-4o / deepseek-chat / qwen-plus 等）
  modelName: env("MODEL_NAME", "deepseek-chat"),
  apiKey: env("API_KEY", ""),
  apiBaseUrl: env("API_BASE_URL", "https://api.deepseek.com/v1"),
  temperature: Number(env("TEMPERATURE", "0.7")),
  maxTokens: Number(env("MAX_TOKENS", "4096")),

  // ── Embedding 配置（OpenAI 兼容 API）──────────────────────────
  // 嵌入模型名称（如 text-embedding-3-small / text-embedding-v3 等）
  embeddingModel: env("EMBEDDING_MODEL", "text-embedding-3-small"),
  // 嵌入 API Key（不填则复用 API_KEY）
  embeddingApiKey: env("EMBEDDING_API_KEY", ""),
  // 嵌入 API BaseURL（不填则复用 API_BASE_URL）
  embeddingApiBaseUrl: env("EMBEDDING_API_BASE_URL", ""),

  // ── ChromaDB（需要单独运行 `chroma run` 或 docker）──────────────
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
