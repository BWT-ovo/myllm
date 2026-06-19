import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, Input, Button, Typography, Space, Avatar, Tag, Divider, Empty } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, BulbOutlined, DeleteOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { tutorChat, updateProfileFromTutoring } from '../api/agents';
import { addChatRecord } from '../api/storage';

const { Title, Text } = Typography;

interface Message { role: 'user' | 'assistant'; content: string; streaming?: boolean; }

const WELCOME: Message = { role: 'assistant',
  content: '你好！我是 AI 学习助手。\n\n可以问我「C++面向对象程序设计」课程的任何问题，比如:\n- 什么是多态？虚函数如何实现？\n- 继承和组合有什么区别？\n- 解释一下智能指针的用法' };

export default function TutoringPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || streaming) return;
    const question = input;
    setMessages((prev) => [...prev, { role: 'user', content: question }, { role: 'assistant', content: '', streaming: true }]);
    setInput('');
    setStreaming(true);

    try {
      await tutorChat(question, messages.slice(0).map(m => ({ role: m.role, content: m.content })), (chunk) => {
        setMessages((prev) => { const u = [...prev]; const last = u[u.length - 1]; if (last.streaming) last.content += chunk; return [...u]; });
      });
    } catch (e: unknown) {
      setMessages((prev) => { const u = [...prev]; const last = u[u.length - 1];
        last.content = `出错: ${e instanceof Error ? e.message : '未知'}`; last.streaming = false; return [...u]; });
    }

    setMessages((prev) => { const u = [...prev]; const last = u[u.length - 1]; last.streaming = false; return [...u]; });

    // 随学随新：从答疑对话中更新画像
    const allMsgs = [...messages, { role: 'user', content: question }];
    updateProfileFromTutoring(allMsgs.slice(-4));

    setStreaming(false);

    // save to history
    addChatRecord({ id: crypto.randomUUID(), title: question.slice(0, 30), messages: messages.slice(-10),
      created_at: new Date().toISOString() });
  }, [input, streaming, messages]);

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Space><Title level={3} style={{ margin: 0 }}>智能答疑</Title><Tag color="green" icon={<BulbOutlined />}>Spark X</Tag></Space>
        <Button icon={<DeleteOutlined />} onClick={() => setMessages([WELCOME])} disabled={streaming}>清空</Button>
      </div>
      <Card styles={{ body: { padding: 0, flex: 1, display: 'flex', flexDirection: 'column' } }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 18, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              <Avatar icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                style={{ background: msg.role === 'user' ? '#1890ff' : '#52c41a', flexShrink: 0 }} />
              <div style={{ maxWidth: '80%', padding: '12px 18px', borderRadius: 12,
                background: msg.role === 'user' ? '#e6f7ff' : '#f6ffed', lineHeight: 1.8, overflow: 'auto' }} className="markdown-content">
                {msg.role === 'assistant' ? <div><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
                  {msg.streaming && <span className="streaming-cursor" />}</div> : <Text>{msg.content}</Text>}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <Divider style={{ margin: 0 }} />
        <div style={{ padding: '14px 24px' }}>
          <Space.Compact style={{ width: '100%' }}>
            <Input.TextArea placeholder="输入问题... (Shift+Enter 换行)" value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              autoSize={{ minRows: 1, maxRows: 4 }} disabled={streaming} />
            <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={streaming}>发送</Button>
          </Space.Compact>
        </div>
      </Card>
    </div>
  );
}

