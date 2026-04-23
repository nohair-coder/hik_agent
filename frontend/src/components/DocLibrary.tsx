import React, { useEffect, useImperativeHandle, forwardRef, useState } from "react";
import { Tabs, List, Tag, Button, Popconfirm, Spin, Empty, message, Statistic, Row, Col } from "antd";
import { DeleteOutlined, ReloadOutlined, FileOutlined } from "@ant-design/icons";
import {
  getCollectionStats,
  listDocuments,
  deleteDocument,
  type CollectionStats,
  type DocumentItem,
} from "../api/client";

export interface DocLibraryRef {
  refresh: () => void;
}

const DocLibrary = forwardRef<DocLibraryRef>((_, ref) => {
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [activeTab, setActiveTab] = useState<"engineering" | "style">("engineering");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    try {
      setStats(await getCollectionStats());
    } catch {
      // 静默失败，不影响主流程
    }
  };

  const loadDocuments = async (tab = activeTab) => {
    setLoading(true);
    try {
      const result = await listDocuments(tab);
      setDocuments(result.documents);
    } catch (e: any) {
      message.error(`加载失败: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sourceFile: string) => {
    try {
      await deleteDocument(activeTab, sourceFile);
      message.success("删除成功");
      await Promise.all([loadStats(), loadDocuments()]);
    } catch (e: any) {
      message.error(`删除失败: ${e.message}`);
    }
  };

  const handleTabChange = (key: string) => {
    const tab = key as "engineering" | "style";
    setActiveTab(tab);
    loadDocuments(tab);
  };

  useImperativeHandle(ref, () => ({
    refresh: () => {
      loadStats();
      loadDocuments();
    },
  }));

  useEffect(() => {
    loadStats();
    loadDocuments();
  }, []);

  const tabItems = [
    { key: "engineering", label: "技术知识库" },
    { key: "style", label: "风格样本库" },
  ];

  return (
    <div>
      {/* 标题行 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>文档库</span>
        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={() => { loadStats(); loadDocuments(); }}
        />
      </div>

      {/* 统计数据 */}
      <Row gutter={8} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <div style={statCardStyle("#e6f4ff", "#1677ff")}>
            <Statistic
              title={<span style={{ fontSize: 11 }}>技术知识库（块）</span>}
              value={stats?.engineering_docs.chunk_count ?? "-"}
              valueStyle={{ fontSize: 22, color: "#1677ff" }}
            />
          </div>
        </Col>
        <Col span={12}>
          <div style={statCardStyle("#f6ffed", "#52c41a")}>
            <Statistic
              title={<span style={{ fontSize: 11 }}>风格样本库（块）</span>}
              value={stats?.style_samples.chunk_count ?? "-"}
              valueStyle={{ fontSize: 22, color: "#52c41a" }}
            />
          </div>
        </Col>
      </Row>

      {/* 文档列表 */}
      <Tabs
        size="small"
        items={tabItems}
        activeKey={activeTab}
        onChange={handleTabChange}
      />

      <Spin spinning={loading}>
        {documents.length === 0 && !loading ? (
          <Empty description="暂无文档，请先导入" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            size="small"
            style={{ maxHeight: 220, overflowY: "auto" }}
            dataSource={documents}
            renderItem={(doc) => (
              <List.Item
                style={{ padding: "6px 4px" }}
                actions={[
                  <Popconfirm
                    key="del"
                    title={`确认删除"${doc.source_file}"的所有片段？`}
                    okText="删除"
                    cancelText="取消"
                    okType="danger"
                    onConfirm={() => handleDelete(doc.source_file)}
                  >
                    <Button size="small" danger type="text" icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={<FileOutlined style={{ color: "#8c8c8c", marginTop: 3 }} />}
                  title={
                    <span
                      style={{
                        fontSize: 12,
                        color: "#595959",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "block",
                        maxWidth: 180,
                      }}
                      title={doc.source_file}
                    >
                      {doc.source_file}
                    </span>
                  }
                  description={
                    <Tag color="default" style={{ fontSize: 11 }}>
                      {doc.chunk_count} 块
                    </Tag>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Spin>
    </div>
  );
});

DocLibrary.displayName = "DocLibrary";

function statCardStyle(bg: string, border: string): React.CSSProperties {
  return {
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: 8,
    padding: "8px 12px",
  };
}

export default DocLibrary;
