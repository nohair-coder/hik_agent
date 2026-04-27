/**
 * Embedding 模型与 ChromaDB 向量库单例
 *
 * 使用 OpenAI 兼容 Embedding API，支持 OpenAI / 阿里云 / 任意兼容接口。
 * 双 Collection 策略：技术知识库 + 风格样本库。
 */
import { OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { config } from "../config.js";

// ── Embedding 单例 ──────────────────────────────────────────────

let _embeddings: OpenAIEmbeddings | null = null;

export const getEmbeddings = (): OpenAIEmbeddings => {
  if (!_embeddings) {
    const apiKey = config.embeddingApiKey || config.apiKey;
    if (!apiKey) {
      throw new Error("必须设置 EMBEDDING_API_KEY 或 API_KEY 环境变量");
    }
    const baseURL = config.embeddingApiBaseUrl || config.apiBaseUrl;
    _embeddings = new OpenAIEmbeddings({
      model: config.embeddingModel,
      apiKey,
      configuration: { baseURL },
    });
    console.log(
      `✓ Embedding 已初始化 | 模型: ${config.embeddingModel} | BaseURL: ${baseURL}`,
    );
  }
  return _embeddings;
};

// ── ChromaDB Collection 单例 ────────────────────────────────────

let _techStore: Chroma | null = null;
let _styleStore: Chroma | null = null;

/** get-or-create helper：首次运行时 Collection 不存在则自动创建 */
const getOrCreate = async (collectionName: string): Promise<Chroma> => {
  try {
    return await Chroma.fromExistingCollection(getEmbeddings(), {
      collectionName,
      url: config.chromaUrl,
      collectionMetadata: { "hnsw:space": "cosine" },
    });
  } catch {
    return Chroma.fromDocuments([], getEmbeddings(), {
      collectionName,
      url: config.chromaUrl,
      collectionMetadata: { "hnsw:space": "cosine" },
    });
  }
};

/** 技术知识库：存放参考规范、历史方案等技术文档 */
export const getTechStore = async (): Promise<Chroma> => {
  if (!_techStore) {
    _techStore = await getOrCreate(config.techCollection);
  }
  return _techStore;
};

/** 风格样本库：存放用户历史文档，用于风格学习 */
export const getStyleStore = async (): Promise<Chroma> => {
  if (!_styleStore) {
    _styleStore = await getOrCreate(config.styleCollection);
  }
  return _styleStore;
};

/** 重置单例（测试用 / 重连用）*/
export const resetStores = (): void => {
  _embeddings = null;
  _techStore = null;
  _styleStore = null;
};
