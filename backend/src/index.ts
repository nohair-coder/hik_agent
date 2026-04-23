/**
 * 工程文档生成助手 — TypeScript 后端入口
 * Hono + LangChain.js + Ollama + ChromaDB
 */
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { config } from "./config.js";
import { warmup } from "./chains/ragChain.js";
import { generateRouter } from "./routes/generate.js";
import { ingestRouter } from "./routes/ingest.js";
import { collectionsRouter } from "./routes/collections.js";
import { exportRouter } from "./routes/export.js";

const app = new Hono();

// ── 中间件 ──────────────────────────────────────────────────────

app.use("*", logger());

app.use(
  "*",
  cors({
    origin: ["http://localhost:1420", "tauri://localhost", "https://tauri.localhost"],
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

// ── 路由挂载 ────────────────────────────────────────────────────

app.route("/api/generate", generateRouter);
app.route("/api/ingest", ingestRouter);
app.route("/api/collections", collectionsRouter);
app.route("/api/export", exportRouter);

// ── 健康检查 ────────────────────────────────────────────────────

app.get("/health", async (c) => {
  try {
    const { getLlm } = await import("./chains/ragChain.js");
    await getLlm().invoke([{ role: "user", content: "ping" }]);
    return c.json({ status: "ok", model: config.modelName });
  } catch (err) {
    return c.json({ status: "error", error: (err as Error).message }, 503);
  }
});

// ── 启动 ────────────────────────────────────────────────────────

console.log("正在预热模型...");
await warmup();

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`✓ 服务已启动: http://localhost:${info.port}`);
  console.log(`  模型: ${config.modelName}`);
  console.log(`  ChromaDB: ${config.chromaUrl}`);
});
