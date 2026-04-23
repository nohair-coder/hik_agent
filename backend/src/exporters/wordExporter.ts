/**
 * Word 文档导出器
 * 将 Markdown 格式文本转换为格式化的 .docx 文档（国标页面设置）
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  convertInchesToTwip,
} from "docx";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { config } from "../config.js";

// ── Markdown 解析 ───────────────────────────────────────────────

interface ParsedLine {
  type: "h1" | "h2" | "h3" | "ul" | "ol" | "blank" | "p";
  text: string;
}

const parseLines = (markdown: string): ParsedLine[] => {
  return markdown.split("\n").map((line): ParsedLine => {
    if (line.startsWith("### "))
      return { type: "h3", text: line.slice(4).trim() };
    if (line.startsWith("## "))
      return { type: "h2", text: line.slice(3).trim() };
    if (line.startsWith("# "))
      return { type: "h1", text: line.slice(2).trim() };
    if (/^[-*•]\s/.test(line.trim()))
      return { type: "ul", text: line.trim().replace(/^[-*•]\s+/, "") };
    if (/^\d+\.\s/.test(line.trim()))
      return { type: "ol", text: line.trim().replace(/^\d+\.\s+/, "") };
    if (!line.trim()) return { type: "blank", text: "" };
    return { type: "p", text: line.trim() };
  });
};

/** 处理行内 **粗体** 标记，返回 TextRun 数组 */
const buildRuns = (text: string, fontSize: number, bold = false): TextRun[] => {
  const parts = text.split(/(\*\*.*?\*\*)/);
  return parts.map((part) => {
    const isBold = part.startsWith("**") && part.endsWith("**");
    return new TextRun({
      text: isBold ? part.slice(2, -2) : part,
      bold: bold || isBold,
      size: fontSize * 2, // docx 单位是半磅
      font: {
        eastAsia: "宋体",
        ascii: "Times New Roman",
        hAnsi: "Times New Roman",
      },
    });
  });
};

// ── 段落构造 ────────────────────────────────────────────────────

const makeHeading = (text: string, level: 1 | 2 | 3): Paragraph => {
  const sizes: Record<number, number> = { 1: 16, 2: 14, 3: 13 };
  const levelMap: Record<
    number,
    (typeof HeadingLevel)[keyof typeof HeadingLevel]
  > = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
  };
  return new Paragraph({
    heading: levelMap[level],
    children: [
      new TextRun({
        text,
        bold: true,
        size: sizes[level] * 2,
        font: { eastAsia: "黑体", ascii: "Arial", hAnsi: "Arial" },
      }),
    ],
  });
};

const makeBody = (text: string): Paragraph => {
  return new Paragraph({
    indent: { firstLine: convertInchesToTwip(0.28) }, // 首行缩进约 2 字符
    children: buildRuns(text, 12),
  });
};

const makeBullet = (text: string): Paragraph => {
  return new Paragraph({
    bullet: { level: 0 },
    children: buildRuns(text, 12),
  });
};

const makeNumbered = (text: string, num: number): Paragraph => {
  return new Paragraph({
    indent: { firstLine: convertInchesToTwip(0.28) },
    children: buildRuns(`${num}. ${text}`, 12),
  });
};

// ── 主转换函数 ──────────────────────────────────────────────────

const markdownToDocx = (content: string): Document => {
  const lines = parseLines(content);
  const children: Paragraph[] = [];
  let olCounter = 0;

  for (const line of lines) {
    if (line.type === "blank") {
      olCounter = 0; // 有序列表被空行打断则重置
      continue;
    }
    if (line.type === "h1") {
      children.push(makeHeading(line.text, 1));
      olCounter = 0;
      continue;
    }
    if (line.type === "h2") {
      children.push(makeHeading(line.text, 2));
      olCounter = 0;
      continue;
    }
    if (line.type === "h3") {
      children.push(makeHeading(line.text, 3));
      olCounter = 0;
      continue;
    }
    if (line.type === "ul") {
      children.push(makeBullet(line.text));
      continue;
    }
    if (line.type === "ol") {
      olCounter++;
      children.push(makeNumbered(line.text, olCounter));
      continue;
    }
    // 普通段落
    children.push(makeBody(line.text));
    olCounter = 0;
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1), // 上 2.54cm
              bottom: convertInchesToTwip(1), // 下 2.54cm
              left: convertInchesToTwip(1.25), // 左 3.17cm
              right: convertInchesToTwip(1.25), // 右 3.17cm
            },
          },
        },
        children,
      },
    ],
  });
};

// ── 公开接口 ────────────────────────────────────────────────────

export interface ExportResult {
  filePath: string;
  filename: string;
}

export const exportToWord = async (
  content: string,
  basename: string,
): Promise<ExportResult> => {
  const doc = markdownToDocx(content);
  const buffer = await Packer.toBuffer(doc);

  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const safe = basename.replace(/[\\/:*?"<>|]/g, "_");
  const filename = `${safe}_${timestamp}.docx`;
  const filePath = join(config.exportDir, filename);

  await writeFile(filePath, buffer);
  return { filePath, filename };
};

/** 直接返回 Buffer，用于 HTTP 流式响应 */
export const exportToBuffer = async (content: string): Promise<Buffer> => {
  const doc = markdownToDocx(content);
  return Packer.toBuffer(doc);
};
