import React from "react";
import { Form, Select, Input, Button } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Option } = Select;

export interface GenerateFormValues {
  question: string;
  docType: string;
  extraRequirements: string;
}

interface Props {
  generating: boolean;
  onGenerate: (values: GenerateFormValues) => void;
}

const DOC_TYPES = [
  "施工组织方案",
  "技术交底记录",
  "工程验收报告",
  "工作日志",
  "会议纪要",
  "质量检查记录",
  "安全交底记录",
  "技术说明书",
];

const GenerateForm: React.FC<Props> = ({ generating, onGenerate }) => {
  const [form] = Form.useForm<GenerateFormValues>();

  const handleFinish = (values: GenerateFormValues) => {
    onGenerate(values);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ docType: "技术文档", question: "", extraRequirements: "" }}
      onFinish={handleFinish}
    >
      <Form.Item label="文档类型" name="docType">
        <Select placeholder="选择文档类型">
          {DOC_TYPES.map((t) => (
            <Option key={t} value={t}>
              {t}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="文档需求描述"
        name="question"
        rules={[{ required: true, message: "请描述文档需求" }]}
      >
        <TextArea
          rows={5}
          placeholder={`请描述您需要生成的文档内容，例如：\n编写一份关于高层建筑混凝土浇筑的施工组织方案，\n包括施工准备、施工流程、质量控制和安全措施。`}
          style={{ resize: "vertical" }}
        />
      </Form.Item>

      <Form.Item label="额外要求（可选）" name="extraRequirements">
        <TextArea
          rows={2}
          placeholder="如：重点突出安全措施，参照 GB50204 规范"
          style={{ resize: "vertical" }}
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Button
          type="primary"
          htmlType="submit"
          loading={generating}
          icon={<ThunderboltOutlined />}
          block
          size="large"
        >
          {generating ? "生成中..." : "生成文档"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default GenerateForm;
