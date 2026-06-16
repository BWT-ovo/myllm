import { useState, useMemo } from 'react';
import { Card, Row, Col, Typography, Tabs, Select, Button, Space, Tag, message, Spin, Modal } from 'antd';
import { FileTextOutlined, BranchesOutlined, FormOutlined, ReadOutlined, VideoCameraOutlined, CodeOutlined,
  ThunderboltOutlined, EyeOutlined, BookOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { generateResource } from '../api/agents';
import { getResources, addResource, type Resource } from '../api/storage';

const { Title, Text } = Typography;

const RESOURCE_TYPES = [
  { key: 'course_doc', label: '课程文档', icon: <FileTextOutlined />, desc: '结构化的Markdown讲义，含LaTeX公式和示例' },
  { key: 'mind_map', label: '思维导图', icon: <BranchesOutlined />, desc: 'Mermaid知识结构可视化' },
  { key: 'exercise', label: '练习题', icon: <FormOutlined />, desc: '选择题、简答题、代码题+详细解析' },
  { key: 'extended_reading', label: '扩展阅读', icon: <ReadOutlined />, desc: '推荐论文、教程、书籍章节' },
  { key: 'multimodal', label: '多模态素材', icon: <VideoCameraOutlined />, desc: '视频脚本、图解、动画故事板' },
  { key: 'code_practice', label: '代码案例', icon: <CodeOutlined />, desc: 'Python可运行代码+TODO+测试' },
];

const TOPICS = ['C++基础回顾','类与对象','继承与派生','多态与虚函数','运算符重载','模板与泛型','STL标准库','异常处理','文件IO与流','设计模式入门'];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  course_doc: <FileTextOutlined />, mind_map: <BranchesOutlined />, exercise: <FormOutlined />,
  extended_reading: <ReadOutlined />, multimodal: <VideoCameraOutlined />, code_practice: <CodeOutlined />,
};
const TYPE_LABELS: Record<string, string> = {
  course_doc: '课程文档', mind_map: '思维导图', exercise: '练习题',
  extended_reading: '扩展阅读', multimodal: '多模态素材', code_practice: '代码案例',
};

export default function LearningCenter() {
  const [resources, setResources] = useState<Resource[]>(getResources);
  const [generating, setGenerating] = useState(false);
  const [genContent, setGenContent] = useState('');
  const [viewingResource, setViewingResource] = useState<Resource | null>(null);
  const [genType, setGenType] = useState('course_doc');
  const [genTopic, setGenTopic] = useState('类与对象');
  const [genDifficulty, setGenDifficulty] = useState('intermediate');

  const handleGenerate = async () => {
    setGenerating(true);
    setGenContent('');
    const key = 'gen';
    message.loading({ content: 'Spark X 正在生成...', key, duration: 0 });
    try {
      const r = await generateResource(genType, genTopic, genDifficulty);
      addResource({ ...r, knowledge_node_id: '', difficulty: genDifficulty, created_at: new Date().toISOString() });
      setGenContent(r.content.markdown);
      setResources(getResources());
      message.success({ content: '生成完成!', key });
    } catch (e: unknown) {
      message.error({ content: `生成失败: ${e instanceof Error ? e.message : '未知错误'}`, key });
    }
    setGenerating(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div><Title level={3} style={{ margin: 0 }}>学习中心</Title><Text type="secondary">AI 驱动的个性化资源生成 · 直连星火大模型</Text></div>
      </div>
      <Tabs defaultActiveKey="generate" items={[
        { key: 'generate', label: 'AI 生成', children: (
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <Card title="生成设置">
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div><Text strong>资源类型</Text>
                    <Select value={genType} onChange={setGenType} style={{ width: '100%', marginTop: 4 }}>
                      {RESOURCE_TYPES.map((t) => <Select.Option key={t.key} value={t.key}><Space>{t.icon}{t.label}</Space></Select.Option>)}
                    </Select>
                  </div>
                  <div><Text strong>知识点</Text>
                    <Select value={genTopic} onChange={setGenTopic} style={{ width: '100%', marginTop: 4 }}>
                      {TOPICS.map((t) => <Select.Option key={t} value={t}>{t}</Select.Option>)}
                    </Select>
                  </div>
                  <div><Text strong>难度</Text>
                    <Select value={genDifficulty} onChange={setGenDifficulty} style={{ width: '100%', marginTop: 4 }}>
                      <Select.Option value="beginner">初级</Select.Option>
                      <Select.Option value="intermediate">中级</Select.Option>
                      <Select.Option value="advanced">高级</Select.Option>
                    </Select>
                  </div>
                  <Button type="primary" icon={<ThunderboltOutlined />} size="large" block loading={generating} onClick={handleGenerate}>
                    {generating ? '生成中...' : 'AI 生成'}
                  </Button>
                </Space>
              </Card>
            </Col>
            <Col xs={24} lg={16}>
              <Card title={genContent ? `${TYPE_LABELS[genType]}: ${genTopic}` : '生成结果预览'}
                styles={{ body: { maxHeight: 600, overflow: 'auto' } }}>
                {generating && !genContent && <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" tip="Spark X 正在生成..." /></div>}
                {genContent && <div className="markdown-content"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{genContent}</ReactMarkdown></div>}
                {!generating && !genContent && <div style={{ textAlign: 'center', padding: 60, color: '#999' }}><ThunderboltOutlined style={{ fontSize: 48 }} /><p>选择类型和知识点，点击生成按钮</p></div>}
              </Card>
            </Col>
          </Row>
        )},
        { key: 'browse', label: `已生成 (${resources.length})`, children: (
          <Row gutter={[16, 16]}>
            {resources.length === 0 && <Col span={24}><div style={{ textAlign: 'center', padding: 60, color: '#999' }}><BookOutlined style={{ fontSize: 48 }} /><p>还没有资源，去「AI 生成」创建吧</p></div></Col>}
            {resources.map((r) => (
              <Col xs={24} sm={12} lg={8} key={r.id}>
                <Card hoverable className="resource-card" onClick={() => setViewingResource(r)}
                  actions={[<EyeOutlined key="view" onClick={() => setViewingResource(r)} />]}>
                  <Space><span style={{ fontSize: 20 }}>{TYPE_ICONS[r.resource_type]}</span>
                    <div><Text strong>{r.title}</Text><br /><Space size={4}><Tag color="blue">{TYPE_LABELS[r.resource_type]}</Tag><Tag>{r.difficulty}</Tag></Space></div></Space>
                </Card>
              </Col>
            ))}
          </Row>
        )},
      ]} />
      <Modal title={viewingResource?.title} open={!!viewingResource} onCancel={() => setViewingResource(null)} footer={null} width={800}
        styles={{ body: { maxHeight: '70vh', overflow: 'auto' } }}>
        {viewingResource?.content?.markdown && <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{viewingResource.content.markdown}</ReactMarkdown></div>}
      </Modal>
    </div>
  );
}
