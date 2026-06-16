import { useState, useMemo } from 'react';
import { Card, Typography, Collapse, Tag, Progress, Modal, Descriptions, Divider, Empty, Statistic, Row, Col, Space } from 'antd';
import { EyeOutlined, TrophyOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getAssessments, type Assessment } from '../api/storage';

const { Title, Text } = Typography;
const TYPE_LABELS: Record<string, string> = { exercise: '练习题', quiz: '测验', tutor_eval: '答疑评估', self_assessment: '自评' };

export default function AssessmentPage() {
  const [assessments] = useState<Assessment[]>(getAssessments);
  const [detail, setDetail] = useState<Assessment | null>(null);

  // Only show random quiz batches (have sessionId)
  const sessions = useMemo(() => {
    const groups: Record<string, Assessment[]> = {};
    for (const a of assessments) {
      if (!a.sessionId) continue;
      if (!groups[a.sessionId]) groups[a.sessionId] = [];
      groups[a.sessionId].push(a);
    }
    const result = Object.values(groups).map((g) => g.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || '')));
    result.sort((a, b) => (b[0]?.created_at || '').localeCompare(a[0]?.created_at || ''));
    return result;
  }, [assessments]);

  return (
    <div>
      <Title level={3}>学习评估</Title>
      <Text type="secondary">练习测试记录，按答题批次分组显示</Text>
      <Card style={{ marginTop: 24 }}>
        {sessions.length === 0 ? <Empty description="暂无评估记录，去题库练习吧" /> : (
          <Collapse
            items={sessions.map((group, gi) => {
              const correct = group.filter((a) => (a.score || 0) >= 60).length;
              const total = group.length;
              const accuracy = Math.round((correct / total) * 100);
              const topics = [...new Set(group.map((a) => (a.answers as any)?.topic).filter(Boolean))];
              const time = group[0]?.created_at?.slice(0, 16).replace('T', ' ');

              return {
                key: gi,
                label: (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: 24 }}>
                    <Space>
                      <Text strong>练习批次 #{gi + 1}</Text>
                      <Tag color="blue">{total} 题</Tag>
                      {topics.slice(0, 3).map((t) => <Tag key={t}>{t as string}</Tag>)}
                      {topics.length > 3 && <Text type="secondary">+{topics.length - 3}</Text>}
                    </Space>
                    <Space>
                      <Text type="secondary">{time}</Text>
                      <Tag color={accuracy >= 80 ? 'success' : accuracy >= 60 ? 'warning' : 'error'}>
                        {accuracy}% ({correct}/{total})
                      </Tag>
                    </Space>
                  </div>
                ),
                children: (
                  <div>
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                      <Col span={8}><Statistic title="正确" value={correct} suffix={`/ ${total}`} prefix={<TrophyOutlined />} /></Col>
                      <Col span={8}><Statistic title="正确率" value={accuracy} suffix="%" valueStyle={{ color: accuracy >= 60 ? '#52c41a' : '#ff4d4f' }} /></Col>
                      <Col span={8}><Statistic title="涉及知识点" value={topics.length} prefix={<EyeOutlined />} /></Col>
                    </Row>
                    {group.map((a, i) => (
                      <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag color={(a.score || 0) >= 60 ? 'success' : 'error'}>{(a.score || 0) >= 60 ? '✓' : '✗'}</Tag>
                        <Text style={{ flex: 1 }}>{(a.answers as any)?.stem || `第${i + 1}题`}</Text>
                        <Tag>{(a.answers as any)?.topic || '未知'}</Tag>
                      </div>
                    ))}
                  </div>
                ),
              };
            })
          } />
        )}
      </Card>

      <Modal title="答题详情" open={!!detail} onCancel={() => setDetail(null)} footer={null} width={700}>
        {detail && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="得分"><Text strong style={{ fontSize: 18, color: (detail.score || 0) >= 60 ? '#52c41a' : '#ff4d4f' }}>{detail.score} / {detail.max_score}</Text></Descriptions.Item>
              <Descriptions.Item label="题型"><Tag>{(TYPE_LABELS as any)[detail.type] || detail.type}</Tag></Descriptions.Item>
              <Descriptions.Item label="时间" span={2}>{detail.created_at?.slice(0, 16).replace('T', ' ')}</Descriptions.Item>
              <Descriptions.Item label="知识点" span={2}>{(detail.answers as any)?.topic || '未知'}</Descriptions.Item>
            </Descriptions>
            <Divider>作答内容</Divider>
            <pre style={{ whiteSpace: 'pre-wrap', background: '#fafafa', padding: 16, borderRadius: 8, maxHeight: 300, overflow: 'auto' }}>
              {JSON.stringify(detail.answers, null, 2)}
            </pre>
            <Divider>反馈</Divider>
            <pre style={{ whiteSpace: 'pre-wrap', background: '#f6ffed', padding: 16, borderRadius: 8, lineHeight: 1.8 }}>
              {JSON.stringify(detail.feedback, null, 2)}
            </pre>
          </div>
        )}
      </Modal>
    </div>
  );
}
