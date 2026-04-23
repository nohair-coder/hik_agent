/**
 * 文档解析与入库流水线
 * 支持 .docx / .doc / .txt / .md，中文分块优化，双 Collection 策略
 */
import { createHash } from "node:crypto";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import mammoth from "mammoth";
import WordExtractor from "word-extractor";
import { getEmbeddings } from "../embeddings/stores.js";
import { config } from "../config.js";

export type DocCategory = "engineering" | "style";

export const SUPPORTED_EXTENSIONS = new Set([".docx", ".doc", ".txt", ".md"]);

// ── 文本提取 ────────────────────────────────────────────────────

async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (ext === ".doc") {
    // word-extractor 处理旧版 .doc（OLE Compound File）
    const extractor = new WordExtractor();
    const doc = await extractor.extract(buffer);
    return doc.getBody();
  }

  // .txt / .md
  return buffer.toString("utf-8");
}

// ── 文本分块 ────────────────────────────────────────────────────

function buildSplitter(): RecursiveCharacterTextSplitter {
  return new RecursiveCharacterTextSplitter({
    chunkSize: 500,      // 中文文档每块约 500 字符
    chunkOverlap: 50,
    separators: [
      "\n\n",
      "\n",
      "。", "！", "？",  // 中文句末标点
      "；", "，",
      " ",
      "",               // 兜底：按字符分割
    ],
  });
}

// ── 获取或创建 Collection ───────────────────────────────────────

async function getOrCreateStore(category: DocCategory): Promise<Chroma> {
  const collectionName =
    category === "engineering" ? config.techCollection : config.styleCollection;

  // 尝试连接已有 Collection；不存在时 Chroma 会自动创建
  return Chroma.fromExistingCollection(getEmbeddings(), {
    collectionName,
    url: config.chromaUrl,
    collectionMetadata: { "hnsw:space": "cosine" },
  });
}

// ── 入库 ────────────────────────────────────────────────────────

export interface IngestResult {
  newChunks: number;
  skippedChunks: number;
  totalChunks: number;
}

export async function ingestBuffer(
  buffer: Buffer,
  filename: string,
  category: DocCategory
): Promise<IngestResult> {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    throw new Error(`不支持的文件类型 ${ext}，支持: ${[...SUPPORTED_EXTENSIONS].join(", ")}`);
  }

  // 1. 提取文本
  const text = await extractText(buffer, filename);
  if (!text.trim()) {
    return { newChunks: 0, skippedChunks: 0, totalChunks: 0 };
  }

  // 2. 分块
  const splitter = buildSplitter();
  const rawChunks = await splitter.createDocuments(
    [text],
    [{ source_file: filename, file_type: ext, doc_category: category }]
  );

  if (rawChunks.length === 0) {
    return { newChunks: 0, skippedChunks: 0, totalChunks: 0 };
  }

  // 3. 连接 Collection
  const store = await getOrCreateStore(category);

  // 4. 查询已有 ID，做内容级去重
  let existingIds = new Set<string>();
  try {
    const col = (store as any).collection; // chromadb v3 内部 collection 对象
    if (col) {
      const existing = await col.get({ include: [] });
      existingIds = new Set<string>(existing.ids as string[]);
    }
  } catch {
    // 连接失败或 collection 为空时跳过去重检查
  }

  const newDocs: Document[] = [];
  const newIds: string[] = [];
  let skipped = 0;

  for (const chunk of rawChunks) {
    const id = createHash("md5").update(chunk.pageContent).digest("hex");
    if (existingIds.has(id)) {
      skipped++;
    } else {
      newDocs.push(chunk);
      newIds.push(id);
    }
  }

  // 5. 批量写入
  if (newDocs.length > 0) {
    await store.addDocuments(newDocs, { ids: newIds });
  }

  return {
    newChunks: newDocs.length,
    skippedChunks: skipped,
    totalChunks: rawChunks.length,
  };
}
