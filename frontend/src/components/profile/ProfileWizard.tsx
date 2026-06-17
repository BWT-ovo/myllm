import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, Input, Button, Typography, Space, Avatar, Progress, Result, Descriptions, Tag, Empty } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, LoadingOutlined } from '@ant-design/icons';
import { profilerChat } from '../../api/agents';
import { getProfile } from '../../api/storage';

const { Text } = Typography;

interface Message { role: 'user' | 'assistant'; content: string; }

const WELCOME: Message = { role: 'assistant',
  content: '你好！我是你的学习画像构建助手。通过几个问题了解你，帮你建立个性化画像。\n\n首先，请告诉我：你的专业和年级？学过哪些计算机或AI相关课程？对AI有多少了解？' };

interface Props { onComplete: () => void; }

export default function ProfileWizard({ onComplete }: Props) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [completion, setCompletion] = useState(() => {
    const p = getProfile();
    return p.profile_completion || 0;
  });
  const [done, setDone] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const result = await profilerChat(userMsg.content, history);
      setMessages((prev) => [...prev, { role: 'assistant', content: result.reply }]);
      setCompletion(result.completion);
      if (result.stage === 'complete') setTimeout(() => setDone(true), 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '未知错误';
      setMessages((prev) => [...prev, { role: 'assistant', content: `抱歉，AI 服务暂时不可用。\n\n${msg}\n\n请稍后重试。` }]);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    const p = getProfile();
    const styleNames: Record<string, string> = { visual: '视觉型', auditory: '听觉型', reading: '阅读型', kinesthetic: '实践型' };
    const dominant = Object.entries(p.cognitive_style || {}).sort((a, b) => b[1] - a[1])[0];
    const TYPE_LABELS: Record<string, string> = { course_doc: '课程文档', mind_map: '思维导图', exercise: '练习题', extended_reading: '扩展阅读', multimodal: '多模态素材', code_practice: '代码案例' };

    return (
      <Card style={{ maxWidth: 800, margin: '0 auto' }}>
        <Result status="success" title="画像构建完成！"
          subTitle="以下是根据你的回答生成的7维学习画像总结" />
        <Descriptions column={1} bordered size="small" style={{ marginTop: 16 }}>
          <Descriptions.Item label="知识基础">
            {Object.keys(p.knowledge_base || {}).length > 0
              ? Object.keys(p.knowledge_base).join('、')
              : 'C++编程基础'}
          </Descriptions.Item>
          <Descriptions.Item label="认知风格">
            {dominant ? `${styleNames[dominant[0]] || dominant[0]}（偏好${dominant[0]}）` : '实践为主'}
          </Descriptions.Item>
          <Descriptions.Item label="格式偏好">
            {(p.format_preferences?.preferred_types || []).length > 0
              ? p.format_preferences.preferred_types.map((t: string) => TYPE_LABELS[t] || t).join('、')
              : '课程文档、代码案例'}
          </Descriptions.Item>
          <Descriptions.Item label="易错模式">
            {(p.error_patterns || []).length > 0
              ? p.error_patterns.map((e: { error_type: string }) => e.error_type).join('、')
              : '通用型错误'}
          </Descriptions.Item>
          <Descriptions.Item label="学习节奏">
            {p.learning_pace >= 3 ? '较快（快速浏览型）' : p.learning_pace >= 2 ? '中等（稳步推进型）' : '较慢（精读细研型）'}
          </Descriptions.Item>
          <Descriptions.Item label="学习动机">
            {Object.keys(p.motivation_profile || {}).length > 0
              ? Object.entries(p.motivation_profile).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([k]) => {
                const labels: Record<string, string> = { career: '就业', research: '科研', interest: '兴趣', competition: '竞赛', coursework: '学业' };
                return labels[k] || k;
              }).join('、')
              : '兴趣驱动'}
          </Descriptions.Item>
          <Descriptions.Item label="难度偏好">
            {p.complexity_preference === 'beginner' ? '入门级' : p.complexity_preference === 'advanced' ? '进阶研究级' : '标准大学课程级'}
          </Descriptions.Item>
        </Descriptions>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button type="primary" size="large" onClick={onComplete}>前往学习中心</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card title={<Space><span>画像构建</span><Progress percent={Math.round(completion * 100)} size="small" style={{ width: 120 }} /></Space>}
      style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ height: 420, overflow: 'auto', padding: '8px 0', marginBottom: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            <Avatar icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
              style={{ background: msg.role === 'user' ? '#1890ff' : '#52c41a', flexShrink: 0 }} />
            <div style={{ maxWidth: '75%', padding: '10px 16px', borderRadius: 12,
              background: msg.role === 'user' ? '#e6f7ff' : '#f6ffed', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              <Text>{msg.content}</Text>
            </div>
          </div>
        ))}
        {loading && <div style={{ display: 'flex', gap: 10 }}><Avatar icon={<RobotOutlined />} style={{ background: '#52c41a' }} />
          <div style={{ padding: '10px 16px', borderRadius: 12, background: '#f6ffed' }}><LoadingOutlined /> 思考中...</div></div>}
        <div ref={messagesEndRef} />
      </div>
      <Space.Compact style={{ width: '100%' }}>
        <Input placeholder="输入你的回答..." value={input} onChange={(e) => setInput(e.target.value)}
          onPressEnter={handleSend} size="large" disabled={loading} />
        <Button type="primary" icon={<SendOutlined />} onClick={handleSend} size="large" loading={loading}>发送</Button>
      </Space.Compact>
    </Card>
  );
}
