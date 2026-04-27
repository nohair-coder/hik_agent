import React, { useCallback, useEffect, useRef, useState } from "react";
import { Layout, Badge, Divider, message, Typography } from "antd";
import GenerateForm, {
  type GenerateFormValues,
} from "./components/GenerateForm";
import DocumentEditor from "./components/DocumentEditor";
import FileUpload from "./components/FileUpload";
import DocLibrary, { type DocLibraryRef } from "./components/DocLibrary";
import { streamGenerate, checkHealth, type HealthResult } from "./api/client";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const App: React.FC = () => {
  const [backendOnline, setBackendOnline] = useState(false);
  const [modelName, setModelName] = useState<string | undefined>(undefined);
  const [generating, setGenerating] = useState(false);
  const [content, setContent] = useState("");
  const [docType, setDocType] = useState("文档预览");
  const libraryRef = useRef<DocLibraryRef>(null);

  // 健康检查轮询
  const pollHealth = useCallback(async () => {
    const result = await checkHealth();
    setBackendOnline(result.online);
    if (result.model) setModelName(result.model);
  }, []);

  useEffect(() => {
    pollHealth();
    const id = setInterval(pollHealth, 10_000);
    return () => clearInterval(id);
  }, [pollHealth]);

  const handleGenerate = async (values: GenerateFormValues) => {
    if (!backendOnline) {
      message.error(
        "服务未连接，请确认后端已启动（cd backend && npm run dev）",
      );
      return;
    }

    setGenerating(true);
    setContent("");
    setDocType(values.docType);

    try {
      for await (const chunk of streamGenerate({
        question: values.question,
        doc_type: values.docType,
        extra_requirements: values.extraRequirements,
      })) {
        setContent((prev) => prev + chunk);
      }
      message.success("文档生成完成");
    } catch (e: any) {
      message.error(`生成失败: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Layout style={{ height: "100vh" }}>
      {/* 顶部导航栏 */}
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#001529",
          padding: "0 20px",
          height: 52,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Text strong style={{ color: "#fff", fontSize: 16 }}>
            黎明专用文档小助手
          </Text>
          <Badge
            status={backendOnline ? "success" : "error"}
            text={
              <Text
                style={{
                  color: backendOnline ? "#95de64" : "#ff7875",
                  fontSize: 12,
                }}
              >
                {backendOnline ? "服务在线" : "服务离线"}
              </Text>
            }
          />
        </div>
        <Text style={{ color: "#8c8c8c", fontSize: 12 }}>
          {modelName ? `${modelName} · RAG` : "本地离线 · RAG"}
        </Text>
      </Header>

      <Layout style={{ flex: 1, overflow: "hidden" }}>
        {/* 左侧面板 */}
        <Sider
          width={360}
          style={{
            background: "#fafafa",
            borderRight: "1px solid #e8e8e8",
            overflowY: "auto",
          }}
        >
          <div style={{ padding: 16 }}>
            <GenerateForm generating={generating} onGenerate={handleGenerate} />
            <Divider style={{ margin: "16px 0" }} />
            <FileUpload onIngested={() => libraryRef.current?.refresh()} />
            <Divider style={{ margin: "16px 0" }} />
            <DocLibrary ref={libraryRef} />
          </div>
        </Sider>

        {/* 右侧编辑器 */}
        <Content
          style={{
            padding: 16,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <DocumentEditor
            content={content}
            title={docType}
            generating={generating}
            onClear={() => setContent("")}
          />
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
