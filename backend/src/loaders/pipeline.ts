/**
 * 文档解析与入库流水线
 * 支持 .docx / .doc / .txt / .md，中文分块优化，双 Collection 策略
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
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

// filePath: 临时文件路径（避免将大文件 Buffer 常驻堆内存）
async function extractText(
  filePath: string,
  filename: string,
): Promise<string> {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  if (ext === ".doc") {
    // 优先用 word-extractor 处理旧版 .doc（OLE Compound File）
    // 部分 .doc 文件实为 Word XML / OOXML，fallback 到 mammoth
    try {
      const extractor = new WordExtractor();
      const doc = await extractor.extract(filePath);
      return doc.getBody();
    } catch (e) {
      const msg = (e as Error).message ?? "";
      if (msg.includes("Unable to read this type of file")) {
        // 可能是 Word 2003 XML 或 OOXML 格式的 .doc，尝试 mammoth
        try {
          const result = await mammoth.extractRawText({ path: filePath });
          if (result.value.trim()) return result.value;
        } catch {
          // ignore
        }
        // 最后兜底：作为纯文本读取
        const text = await readFile(filePath, "utf-8");
        if (text.trim()) return text;
      }
      throw e;
    }
  }

  // .txt / .md — 流式读取，不一次性加载进内存
  return readFile(filePath, "utf-8");
}

// ── 文本分块 ────────────────────────────────────────────────────

function buildSplitter(): RecursiveCharacterTextSplitter {
  return new RecursiveCharacterTextSplitter({
    chunkSize: 500, // 中文文档每块约 500 字符
    chunkOverlap: 50,
    separators: [
      "\n\n",
      "\n",
      "。",
      "！",
      "？", // 中文句末标点
      "；",
      "，",
      " ",
      "", // 兜底：按字符分割
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
  filePath: string,
  filename: string,
  category: DocCategory,
): Promise<IngestResult> {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    throw new Error(
      `不支持的文件类型 ${ext}，支持: ${[...SUPPORTED_EXTENSIONS].join(", ")}`,
    );
  }

  // 1. 提取文本（从临时文件路径读取，避免 Buffer 长期占用堆内存）
  const text = await extractText(filePath, filename);
  if (!text.trim()) {
    return { newChunks: 0, skippedChunks: 0, totalChunks: 0 };
  }

  // 2. 分块
  const splitter = buildSplitter();
  const rawChunks = await splitter.createDocuments(
    [text],
    [{ source_file: filename, file_type: ext, doc_category: category }],
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
