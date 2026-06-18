import { useState, useEffect } from 'react';
import { Card, Typography, Tag, Collapse, Space } from 'antd';
import { CodeOutlined, CaretRightOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Exercise {
  title: string;
  description: string;
  solution: string;
}

interface CodeBank {
  chapters: Record<string, { title: string; exercises: Exercise[] }>;
}

export default function CodePractice() {
  const [bank, setBank] = useState<CodeBank | null>(null);

  useEffect(() => {
    fetch('/code-bank.json')
      .then((r) => r.json())
      .then((d) => setBank(d))
      .catch(() => {});
  }, []);

  if (!bank || Object.keys(bank.chapters).length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Title level={3}>💻 编程练习</Title>
        <Text type="secondary">题库为空，等待添加题目</Text>
      </div>
    );
  }

  return (
    <div>
      <Title level={3}>💻 编程练习 — 题目与参考解答</Title>
      {Object.entries(bank.chapters).map(([ck, ch]) => (
        <Card key={ck} title={<Space><CodeOutlined /> {ch.title}</Space>} style={{ marginBottom: 16 }}>
          {ch.exercises.map((ex, i) => (
            <Card key={i} size="small" style={{ marginBottom: 12 }} title={ex.title}>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 14, marginBottom: 12 }}>
                {ex.description}
              </div>
              <Collapse
                ghost
                expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
                items={[{
                  key: 'sol',
                  label: <Text type="secondary">📖 参考解答</Text>,
                  children: (
                    <pre style={{
                      background: '#1e1e1e', color: '#d4d4d4', padding: 16, borderRadius: 8,
                      fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.7, overflow: 'auto', maxHeight: 600,
                    }}>
                      {ex.solution}
                    </pre>
                  ),
                }]}
              />
            </Card>
          ))}
        </Card>
      ))}
    </div>
  );
}
