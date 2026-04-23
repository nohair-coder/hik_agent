// Word 导出路由
import { Hono } from "hono";
import { z } from "zod";
import { exportToBuffer } from "../exporters/wordExporter.js";

export const exportRouter = new Hono();

const ExportSchema = z.object({
  content: z.string().min(1, "content 不能为空"),
  filename: z.string().default("工程文档"),
});

/** POST /api/export/word — 返回 .docx 文件流 */
exportRouter.post("/word", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = ExportSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().fieldErrors }, 422);
  }

  try {
    const buffer = await exportToBuffer(parsed.data.content);
    const safe = parsed.data.filename.replace(/[\\/:*?"<>|]/g, "_");
    const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15);
    const downloadName = `${safe}_${timestamp}.docx`;

    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (err) {
    return c.json({ error: `导出失败: ${(err as Error).message}` }, 500);
  }
});
