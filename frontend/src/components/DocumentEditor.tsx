import React, { useMemo, useState } from "react";
import { Button, Space, Tooltip, message, Empty } from "antd";
import {
  CopyOutlined,
  DownloadOutlined,
  DeleteOutlined,
  LoadingOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { exportWord } from "../api/client";

interface Props {
  content: string;
  title?: string;
  generating?: boolean;
  onClear: () => void;
}

const DocumentEditor: React.FC<Props> = ({ content, title, generating, onClear }) => {
  const [exporting, setExporting] = useState(false);

  const renderedHtml = useMemo(() => {
    if (!content) return "";
    return DOMPurify.sanitize(marked.parse(content) as string);
  }, [content]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      message.success("已复制到剪贴板");
    } catch {
      message.error("复制失败");
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportWord(content, title || "工程文档");
      message.success("导出成功");
    } catch (e: any) {
      message.error(`导出失败: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* 工具栏 */}
      <div style={styles.toolbar}>
        <span style={styles.titleText}>{title || "文档预览"}</span>
        {content && (
          <Space size="small">
            <Tooltip title="复制内容">
              <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
                复制
              </Button>
            </Tooltip>
            <Tooltip title="导出为 Word 文件">
              <Button
                size="small"
                type="primary"
                icon={<DownloadOutlined />}
                loading={exporting}
                onClick={handleExport}
              >
                导出 Word
              </Button>
            </Tooltip>
            <Tooltip title="清空内容">
              <Button size="small" danger icon={<DeleteOutlined />} onClick={onClear}>
                清空
              </Button>
            </Tooltip>
          </Space>
        )}
      </div>

      {/* 生成指示器 */}
      {generating && (
        <div style={styles.generatingBar}>
          <LoadingOutlined style={{ marginRight: 8 }} />
          正在生成...
        </div>
      )}

      {/* 内容区 */}
      <div style={styles.contentArea}>
        {content ? (
          <div
            className="markdown-render"
            style={styles.markdownBody}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        ) : (
          <Empty
            image={<FileTextOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />}
            description="填写左侧表单并点击「生成文档」"
            style={{ marginTop: 80 }}
          />
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    border: "1px solid #e8e8e8",
    borderRadius: 8,
    overflow: "hidden",
    background: "#fff",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 16px",
    background: "#fafafa",
    borderBottom: "1px solid #e8e8e8",
    flexShrink: 0,
  },
  titleText: {
    fontWeight: 600,
    color: "#262626",
    fontSize: 14,
  },
  generatingBar: {
    padding: "6px 16px",
    background: "#e6f4ff",
    color: "#1677ff",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
  contentArea: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 24px",
  },
  markdownBody: {
    fontFamily: '"宋体", "SimSun", serif',
    fontSize: 14,
    lineHeight: 1.8,
    color: "#262626",
  },
};

// 注入全局 markdown 渲染样式
const markdownStyle = document.createElement("style");
markdownStyle.textContent = `
  .markdown-render h1 { font-size: 20px; font-weight: bold; font-family: "黑体","SimHei",sans-serif; margin: 20px 0 12px; border-bottom: 2px solid #1677ff; padding-bottom: 6px; }
  .markdown-render h2 { font-size: 17px; font-weight: bold; font-family: "黑体","SimHei",sans-serif; margin: 16px 0 10px; }
  .markdown-render h3 { font-size: 15px; font-weight: bold; margin: 12px 0 8px; }
  .markdown-render p  { margin: 8px 0; text-indent: 2em; }
  .markdown-render ul, .markdown-render ol { padding-left: 24px; margin: 8px 0; }
  .markdown-render li { margin: 4px 0; }
  .markdown-render strong { font-weight: bold; }
`;
document.head.appendChild(markdownStyle);

export default DocumentEditor;
