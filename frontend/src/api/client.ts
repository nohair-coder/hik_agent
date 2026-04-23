/**
 * 后端 API 客户端
 * 封装 SSE 流式请求和常规 HTTP 请求
 */

const BASE_URL = "http://localhost:8000";

export interface GenerateRequest {
  question: string;
  doc_type?: string;
  extra_requirements?: string;
}

export interface IngestResult {
  status: string;
  filename: string;
  category: string;
  new_chunks: number;
  skipped_chunks: number;
  total_chunks: number;
}

export interface CollectionStats {
  engineering_docs: { collection: string; chunk_count: number; description: string };
  style_samples: { collection: string; chunk_count: number; description: string };
}

export interface DocumentItem {
  source_file: string;
  file_type: string;
  doc_category: string;
  chunk_count: number;
}

// ── 流式生成 ──

export async function* streamGenerate(
  request: GenerateRequest
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
}

// ── 文档导入 ──

export async function ingestFile(
  file: File,
  category: "engineering" | "style"
): Promise<IngestResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);

  const response = await fetch(`${BASE_URL}/api/ingest/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail ?? "导入失败");
  }
  return response.json();
}

// ── 文档导出 ──

export async function exportWord(content: string, filename: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/export/word`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, filename }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail ?? "导出失败");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
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
}

// ── 文档库管理 ──

export async function getCollectionStats(): Promise<CollectionStats> {
  const response = await fetch(`${BASE_URL}/api/collections/stats`);
  if (!response.ok) throw new Error("获取统计信息失败");
  return response.json();
}

export async function listDocuments(
  collection: "engineering" | "style"
): Promise<{ documents: DocumentItem[]; document_count: number }> {
  const response = await fetch(`${BASE_URL}/api/collections/${collection}/documents`);
  if (!response.ok) throw new Error("获取文档列表失败");
  return response.json();
}

export async function deleteDocument(
  collection: "engineering" | "style",
  sourceFile: string
): Promise<void> {
  const response = await fetch(
    `${BASE_URL}/api/collections/${collection}/documents/${encodeURIComponent(sourceFile)}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail ?? "删除失败");
  }
}

// ── 健康检查 ──

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await response.json();
    return data.status === "ok";
  } catch {
    return false;
  }
}
