import { useParams } from 'react-router-dom';
import { Card, Typography, Tag, Space, Button, Divider } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function ResourcePage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} type="text" style={{ marginBottom: 16 }}>
        返回学习中心
      </Button>
      <Card>
        <Title level={3}>资源详情</Title>
        <Space>
          <Tag color="blue">课程文档</Tag>
          <Tag>中级</Tag>
        </Space>
        <Divider />
        <Paragraph>
          资源 ID: {id}。完整资源展示将在 Phase 5 实现，
          支持 Markdown 渲染、Mermaid 思维导图、练习题交互、
          代码编辑器等多种展示形式。
        </Paragraph>
      </Card>
    </div>
  );
}
