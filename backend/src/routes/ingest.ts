// 文档导入路由
import { Hono } from "hono";
import { ingestBuffer, SUPPORTED_EXTENSIONS, type DocCategory } from "../loaders/pipeline.js";

export const ingestRouter = new Hono();

/** POST /api/ingest — multipart/form-data，字段：file + category */
ingestRouter.post("/", async (c) => {
  const body = await c.req.parseBody();

  const file = body["file"];
  const category = (body["category"] as string) ?? "engineering";

  if (!file || typeof file === "string") {
    return c.json({ error: "缺少 file 字段" }, 400);
  }

  if (!["engineering", "style"].includes(category)) {
    return c.json({ error: "category 必须为 engineering 或 style" }, 422);
  }

  const filename: string = (file as File).name;
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();

  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    return c.json(
      { error: `不支持的文件类型 ${ext}，支持: ${[...SUPPORTED_EXTENSIONS].join(", ")}` },
      422
    );
  }

  const buffer = Buffer.from(await (file as File).arrayBuffer());
  if (buffer.length === 0) {
    return c.json({ error: "文件内容为空" }, 400);
  }

  try {
    const result = await ingestBuffer(buffer, filename, category as DocCategory);
    return c.json({
      status: "ok",
      filename,
      category,
      new_chunks: result.newChunks,
      skipped_chunks: result.skippedChunks,
      total_chunks: result.totalChunks,
    });
  } catch (err) {
    return c.json({ error: `导入失败: ${(err as Error).message}` }, 500);
  }
});
