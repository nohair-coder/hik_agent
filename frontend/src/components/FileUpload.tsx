import React, { useRef, useState } from "react";
import { Upload, Radio, Tag, message, List, Spin, Progress } from "antd";
import {
  InboxOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";
import { ingestFile } from "../api/client";

const { Dragger } = Upload;

interface Props {
  onIngested: () => void;
}

type Category = "engineering" | "style";

interface QueueItem {
  name: string;
  size: number;
  status: "uploading" | "done" | "error";
  percent: number;
  newChunks: number;
  error: string;
}

const FileUpload: React.FC<Props> = ({ onIngested }) => {
  const [category, setCategory] = useState<Category>("engineering");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  // ref 用于在异步回调中读取最新 category
  const categoryRef = useRef(category);
  categoryRef.current = category;

  const uploadProps: UploadProps = {
    name: "file",
    multiple: true,
    accept: ".docx,.doc,.txt,.md",
    showUploadList: false,
    beforeUpload: (file) => {
      const MAX_SIZE = 600 * 1024 * 1024; // 600MB
      if (file.size > MAX_SIZE) {
        message.error(`${file.name} 超过 600MB 限制，无法上传`);
        return false;
      }
      handleUpload(file);
      return false; // 阻止 antd 默认上传行为
    },
  };

  const handleUpload = async (file: File) => {
    const item: QueueItem = {
      name: file.name,
      size: file.size,
      status: "uploading",
      percent: 0,
      newChunks: 0,
      error: "",
    };

    setQueue((prev) => [{ ...item }, ...prev]);

    try {
      const result = await ingestFile(file, categoryRef.current, (percent) => {
        setQueue((prev) =>
          prev.map((q) =>
            q.name === file.name && q.status === "uploading"
              ? { ...q, percent }
              : q,
          ),
        );
      });
      setQueue((prev) =>
        prev.map((q) =>
          q.name === file.name && q.status === "uploading"
            ? { ...q, status: "done", newChunks: result.new_chunks }
            : q,
        ),
      );
      if (result.skipped_chunks > 0) {
        message.info(
          `${file.name}：${result.new_chunks} 块新增，${result.skipped_chunks} 块已存在`,
        );
      } else {
        message.success(
          `${file.name} 导入成功，共 ${result.new_chunks} 个片段`,
        );
      }
      onIngested();
    } catch (e: any) {
      setQueue((prev) =>
        prev.map((q) =>
          q.name === file.name && q.status === "uploading"
            ? { ...q, status: "error", error: e.message }
            : q,
        ),
      );
      message.error(`${file.name} 导入失败: ${e.message}`);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>导入文档</span>
        <Tag color="blue">支持 .docx .doc .txt .md，最大 600MB</Tag>
      </div>

      <Radio.Group
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        size="small"
        style={{ marginBottom: 10 }}
      >
        <Radio.Button value="engineering">技术知识库</Radio.Button>
        <Radio.Button value="style">风格样本库</Radio.Button>
      </Radio.Group>

      <Dragger {...uploadProps} style={{ marginBottom: queue.length ? 12 : 0 }}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">拖拽文件到此处，或点击上传</p>
        <p className="ant-upload-hint">支持批量上传</p>
      </Dragger>

      {queue.length > 0 && (
        <List
          size="small"
          style={{ maxHeight: 180, overflowY: "auto", marginTop: 8 }}
          dataSource={queue}
          renderItem={(item) => (
            <List.Item style={{ padding: "4px 8px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                }}
              >
                {item.status === "uploading" && (
                  <Spin indicator={<LoadingOutlined spin />} size="small" />
                )}
                {item.status === "done" && (
                  <CheckCircleOutlined style={{ color: "#52c41a" }} />
                )}
                {item.status === "error" && (
                  <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                )}
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <span
                    style={{
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: 12,
                      color: "#595959",
                    }}
                  >
                    {item.name}
                  </span>
                  {item.status === "uploading" &&
                    item.size > 10 * 1024 * 1024 && (
                      <Progress
                        percent={item.percent}
                        size="small"
                        style={{ marginBottom: 0 }}
                        format={(p) => `${p}% 上传中`}
                      />
                    )}
                  {item.status === "done" && (
                    <Tag color="green" style={{ fontSize: 11 }}>
                      +{item.newChunks} 块
                    </Tag>
                  )}
                  {item.status === "error" && (
                    <span style={{ fontSize: 11, color: "#ff4d4f" }}>
                      {item.error}
                    </span>
                  )}
                </div>
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default FileUpload;
