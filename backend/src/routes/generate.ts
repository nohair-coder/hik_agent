// 文档生成路由：SSE 流式 + 一次性生成
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { z } from "zod";
import { streamGenerate, generateOnce } from "../chains/ragChain.js";

export const generateRouter = new Hono();

const GenerateSchema = z.object({
  question: z.string().min(1, "question 不能为空"),
  doc_type: z.string().default("技术文档"),
  extra_requirements: z.string().default(""),
});

/** POST /api/generate/stream — SSE 流式生成 */
generateRouter.post("/stream", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = GenerateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().fieldErrors }, 422);
  }

  c.header("Cache-Control", "no-cache");
  c.header("X-Accel-Buffering", "no");
  return streamSSE(c, async (stream) => {
    stream.onAbort(() => console.log("客户端断开连接"));

    try {
      for await (const chunk of streamGenerate(parsed.data)) {
        // 转义换行符保证 SSE 帧格式正确
        await stream.writeSSE({ data: chunk.replace(/\n/g, "\\n") });
      }
    } catch (err) {
      await stream.writeSSE({ data: `[ERROR] ${(err as Error).message}` });
    } finally {
      await stream.writeSSE({ data: "[DONE]" });
    }
  });
});

/** POST /api/generate/once — 非流式，返回完整文档 */
generateRouter.post("/once", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = GenerateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().fieldErrors }, 422);
  }

  try {
    const content = await generateOnce(parsed.data);
    return c.json({ status: "ok", content });
  } catch (err) {
    return c.json({ error: (err as Error).message }, 500);
  }
});
