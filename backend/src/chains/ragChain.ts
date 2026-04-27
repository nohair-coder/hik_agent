/**
 * RAG 生成链 — LangChain.js LCEL
 *
 * 双路检索（技术知识库 + 风格样本库）并行注入 Prompt，
 * 通过 OpenAI 兼容 API（DeepSeek / Qwen / OpenAI 等）流式生成文档。
 */
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  RunnableSequence,
  RunnableParallel,
} from "@langchain/core/runnables";
import type { BaseRetriever } from "@langchain/core/retrievers";
import type { Document } from "@langchain/core/documents";
import { getTechStore, getStyleStore } from "../embeddings/stores.js";
import { MAIN_SYSTEM_PROMPT, HUMAN_TEMPLATE } from "../prompts/templates.js";
import { config } from "../config.js";

// ── LLM 单例 ────────────────────────────────────────────────────

let _llm: ChatOpenAI | null = null;

export const getLlm = (): ChatOpenAI => {
  if (!_llm) {
    if (!config.apiKey) {
      throw new Error("必须设置 API_KEY 环境变量");
    }
    _llm = new ChatOpenAI({
      model: config.modelName,
      apiKey: config.apiKey,
      configuration: {
        baseURL: config.apiBaseUrl,
      },
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      streaming: true,
    });
    console.log(
      `✓ LLM 已初始化 | 模型: ${config.modelName} | BaseURL: ${config.apiBaseUrl}`,
    );
  }
  return _llm;
};

/** 重置 LLM 单例（配置变更后调用）*/
export const resetLlm = (): void => {
  _llm = null;
};

// ── 文档格式化 ──────────────────────────────────────────────────

const formatDocs = (docs: Document[]): string => {
  if (docs.length === 0) return "（暂无相关参考资料）";
  return docs
    .map(
      (doc, i) =>
        `[参考${i + 1} - 来源: ${doc.metadata?.source_file ?? "未知"}]\n${doc.pageContent}`,
    )
    .join("\n\n---\n\n");
};

// ── 链构造 ──────────────────────────────────────────────────────

// 生成锁：同一时间只处理一个请求
let _generating = false;

export interface GenerateInput {
  question: string;
  doc_type?: string;
  extra_requirements?: string;
}

const buildChain = async () => {
  const llm = getLlm();
  const techStore = await getTechStore();
  const styleStore = await getStyleStore();

  const techRetriever: BaseRetriever = techStore.asRetriever({
    k: config.techRetrieverK,
    searchType: "mmr",
  });

  const styleRetriever: BaseRetriever = styleStore.asRetriever({
    k: config.styleRetrieverK,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", MAIN_SYSTEM_PROMPT],
    ["human", HUMAN_TEMPLATE],
  ]);

  // LCEL 链：并行检索 → Prompt → LLM → 字符串解析
  const chain = RunnableSequence.from([
    RunnableParallel.from({
      tech_context: RunnableSequence.from([
        (input: GenerateInput) => input.question,
        techRetriever,
        formatDocs,
      ]),
      style_examples: RunnableSequence.from([
        (input: GenerateInput) => input.question,
        styleRetriever,
        formatDocs,
      ]),
      question: (input: GenerateInput) => input.question,
      doc_type: (input: GenerateInput) => input.doc_type ?? "技术文档",
      extra_requirements: (input: GenerateInput) =>
        input.extra_requirements ? `额外要求：${input.extra_requirements}` : "",
    }),
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  return chain;
};

let _chain: Awaited<ReturnType<typeof buildChain>> | null = null;

const getChain = async () => {
  if (!_chain) _chain = await buildChain();
  return _chain;
};

// ── 公开接口 ────────────────────────────────────────────────────

/** 流式生成，返回 AsyncGenerator<string> */
export const streamGenerate = async function* (
  input: GenerateInput,
): AsyncGenerator<string> {
  if (_generating) {
    throw new Error("当前有生成任务正在进行，请稍候再试");
  }
  _generating = true;
  try {
    const chain = await getChain();
    const stream = await chain.stream(input);
    for await (const chunk of stream) {
      if (chunk) yield chunk;
    }
  } finally {
    _generating = false;
  }
};

/** 非流式生成，返回完整字符串 */
export const generateOnce = async (input: GenerateInput): Promise<string> => {
  const parts: string[] = [];
  for await (const chunk of streamGenerate(input)) {
    parts.push(chunk);
  }
  return parts.join("");
};

/** 预热：验证 LLM 连接与 Embedding 模型 */
export const warmup = async (): Promise<void> => {
  try {
    await getLlm().invoke([{ role: "user", content: "ping" }]);
    console.log("✓ LLM 连接正常");
  } catch (e) {
    console.warn("⚠ LLM 预热失败:", (e as Error).message);
  }

  try {
    const { getEmbeddings } = await import("../embeddings/stores.js");
    await getEmbeddings().embedQuery("预热测试");
    console.log("✓ Embedding 模型预热完成");
  } catch (e) {
    console.warn("⚠ Embedding 预热失败:", (e as Error).message);
  }
};
