/**
 * Embedding 模型与 ChromaDB 向量库单例
 *
 * 通过 Ollama 运行 bge-m3，与 Python 版本保持模型一致性。
 * 双 Collection 策略：技术知识库 + 风格样本库。
 */
import { OllamaEmbeddings } from "@langchain/ollama";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { config } from "../config.js";

// ── Embedding 单例 ──────────────────────────────────────────────

let _embeddings: OllamaEmbeddings | null = null;

export const getEmbeddings = (): OllamaEmbeddings => {
  if (!_embeddings) {
    _embeddings = new OllamaEmbeddings({
      model: config.embeddingModel, // bge-m3
      baseUrl: config.ollamaBaseUrl,
    });
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
    // Collection 不存在（首次运行）— 用空文档列表创建
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
