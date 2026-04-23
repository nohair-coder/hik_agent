// 文档库管理路由
import { Hono } from "hono";
import { IncludeEnum } from "chromadb";
import { getTechStore, getStyleStore } from "../embeddings/stores.js";
import { config } from "../config.js";

export const collectionsRouter = new Hono();

type CollectionKey = "engineering" | "style";

const resolveStore = async (key: CollectionKey) => {
  return key === "engineering" ? getTechStore() : getStyleStore();
};

/** GET /api/collections/stats — 两个库的块数统计 */
collectionsRouter.get("/stats", async (c) => {
  try {
    const [tech, style] = await Promise.all([getTechStore(), getStyleStore()]);
    const [techCount, styleCount] = await Promise.all([
      (tech as any).collection?.count() ?? 0,
      (style as any).collection?.count() ?? 0,
    ]);

    return c.json({
      engineering_docs: {
        collection: config.techCollection,
        chunk_count: techCount,
        description: "技术知识库",
      },
      style_samples: {
        collection: config.styleCollection,
        chunk_count: styleCount,
        description: "风格样本库",
      },
    });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

/** GET /api/collections/:collection/documents — 列出文档（按 source_file 去重） */
collectionsRouter.get("/:collection/documents", async (c) => {
  const key = c.req.param("collection") as CollectionKey;
  if (!["engineering", "style"].includes(key)) {
    return c.json({ error: "未知 collection，使用 engineering 或 style" }, 404);
  }

  try {
    const store = await resolveStore(key);
    const col = (store as any).collection;
    const result = await col.get({ include: [IncludeEnum.metadatas] });
    const metadatas: Record<string, unknown>[] = result.metadatas ?? [];

    const fileStats: Record<
      string,
      {
        source_file: string;
        file_type: string;
        doc_category: string;
        chunk_count: number;
      }
    > = {};

    for (const meta of metadatas) {
      if (!meta) continue;
      const source = (meta["source_file"] as string) ?? "未知";
      if (!fileStats[source]) {
        fileStats[source] = {
          source_file: source,
          file_type: (meta["file_type"] as string) ?? "",
          doc_category: (meta["doc_category"] as string) ?? key,
          chunk_count: 0,
        };
      }
      fileStats[source].chunk_count++;
    }

    const documents = Object.values(fileStats);
    return c.json({
      collection: key,
      document_count: documents.length,
      documents,
    });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});

/** DELETE /api/collections/:collection/documents/:sourceFile — 删除文档所有 chunks */
collectionsRouter.delete("/:collection/documents/:sourceFile", async (c) => {
  const key = c.req.param("collection") as CollectionKey;
  const sourceFile = decodeURIComponent(c.req.param("sourceFile"));

  if (!["engineering", "style"].includes(key)) {
    return c.json({ error: "未知 collection" }, 404);
  }

  try {
    const store = await resolveStore(key);
    const col = (store as any).collection;

    const result = await col.get({
      where: { source_file: sourceFile },
      include: [] as IncludeEnum[],
    });
    const ids: string[] = result.ids ?? [];

    if (ids.length === 0) {
      return c.json({ error: `未找到文档: ${sourceFile}` }, 404);
    }

    await col.delete({ ids });
    return c.json({
      status: "ok",
      deleted_chunks: ids.length,
      source_file: sourceFile,
    });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});
