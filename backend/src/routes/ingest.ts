// 文档导入路由
import { Hono } from "hono";
import { mkdtemp, writeFile, unlink, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  ingestBuffer,
  SUPPORTED_EXTENSIONS,
  type DocCategory,
} from "../loaders/pipeline.js";

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
      {
        error: `不支持的文件类型 ${ext}，支持: ${[...SUPPORTED_EXTENSIONS].join(", ")}`,
      },
      422,
    );
  }

  let buffer: Buffer | null = Buffer.from(await (file as File).arrayBuffer());
  if (buffer.length === 0) {
    return c.json({ error: "文件内容为空" }, 400);
  }

  // 写入临时文件，传路径给 pipeline（避免 500MB Buffer 长期占用堆内存）
  const tmpDir = await mkdtemp(join(tmpdir(), "hik-ingest-"));
  const tmpPath = join(tmpDir, filename);
  try {
    await writeFile(tmpPath, buffer);
    // 让 GC 尽早回收 buffer
    (buffer as any) = null;

    const result = await ingestBuffer(
      tmpPath,
      filename,
      category as DocCategory,
    );
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
  } finally {
    await unlink(tmpPath).catch(() => {});
    await rmdir(tmpDir).catch(() => {});
  }
});
