/**
 * 后端 API 客户端
 * 封装 SSE 流式请求和常规 HTTP 请求
 */

import http, { get, post, del } from "./http";
import type {
  GenerateRequest,
  IngestResult,
  CollectionStats,
  DocumentItem,
  HealthResult,
} from "./types";

export type {
  GenerateRequest,
  IngestResult,
  CollectionStats,
  DocumentItem,
  HealthResult,
};

// SSE 流式请求仍使用原生 fetch（axios 不支持浏览器端流式读取）
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

// ── 流式生成 ──

export const streamGenerate = async function* (
  request: GenerateRequest,
): AsyncGenerator<string> {
  const response = await fetch(`${BASE_URL}/api/generate/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        if (data.startsWith("[ERROR]")) throw new Error(data.slice(8));
        yield data.replace(/\\n/g, "\n");
      }
    }
  }
};

// ── 文档导入 ──

export const ingestFile = async (
  file: File,
  category: "engineering" | "style",
  onProgress?: (percent: number) => void,
): Promise<IngestResult> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);

  return post<IngestResult>("/api/ingest/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    // 大文件 30 分钟超时
    timeout: 30 * 60 * 1000,
    onUploadProgress: (e: ProgressEvent<HTMLFormElement>) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
};

// ── 文档导出 ──

export const exportWord = async (
  content: string,
  filename: string,
): Promise<void> => {
  const response = await http.post(
    "/api/export/word",
    { content, filename },
    { responseType: "blob" },
  );

  const blob = response.data as Blob;
  const disposition = (response.headers["content-disposition"] as string) ?? "";
  const match = disposition.match(/filename\*=UTF-8''(.+)/);
  const serverFilename = match
    ? decodeURIComponent(match[1])
    : `${filename}.docx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = serverFilename;
  a.click();
  URL.revokeObjectURL(url);
};

// ── 文档库管理 ──

export const getCollectionStats = (): Promise<CollectionStats> => {
  return get<CollectionStats>("/api/collections/stats");
};

export const listDocuments = (
  collection: "engineering" | "style",
): Promise<{ documents: DocumentItem[]; document_count: number }> => {
  return get(`/api/collections/${collection}/documents`);
};

export const deleteDocument = (
  collection: "engineering" | "style",
  sourceFile: string,
): Promise<void> => {
  return del(
    `/api/collections/${collection}/documents/${encodeURIComponent(sourceFile)}`,
  );
};

// ── 健康检查 ──

export const checkHealth = async (): Promise<HealthResult> => {
  try {
    const data = await get<{ status: string; model?: string }>("/health", {
      timeout: 3000,
    });
    return { online: data.status === "ok", model: data.model };
  } catch {
    return { online: false };
  }
};
