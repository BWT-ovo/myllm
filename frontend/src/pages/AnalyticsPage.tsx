import { useMemo } from 'react';
import { Card, Row, Col, Typography, Statistic, Empty } from 'antd';
import { TrophyOutlined, RiseOutlined, BookOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getProfile, getResources, getAssessments } from '../api/storage';

const { Title, Text } = Typography;

export default function AnalyticsPage() {
  const profile = useMemo(getProfile, []);
  const resources = useMemo(getResources, []);
  const assessments = useMemo(getAssessments, []);

  // Compute per-topic scores from assessments (only count topics with ≥2 questions for reliability)
  const topicScores = useMemo(() => {
    const map: Record<string, { correct: number; total: number }> = {};
    for (const a of assessments) {
      const topic = (a.answers as any)?.topic || (a.answers as any)?.chapter || '';
      const key = topic || '综合';
      if (!map[key]) map[key] = { correct: 0, total: 0 };
      map[key].total++;
      if ((a.score || 0) >= 60) map[key].correct++;
    }
    return map;
  }, [assessments]);

  const hasData = Object.keys(topicScores).length > 0;
  const topics = Object.keys(topicScores);
  const values = topics.map((t) => {
    const s = topicScores[t];
    return Math.round((s.correct / Math.max(s.total, 1)) * 100);
  });
  const counts = topics.map((t) => topicScores[t].total);

  const barOption = hasData ? {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0];
        const t = p.name;
        const s = topicScores[t];
        return `${t}<br/>正确率: ${p.value}%<br/>${s.correct}/${s.total} 题`;
      },
    },
    grid: { top: 10, bottom: 80, left: 40, right: 40 },
    xAxis: { type: 'category', data: topics, axisLabel: { rotate: 30, fontSize: 11 } },
    yAxis: { type: 'value', max: 100, min: 0, name: '正确率%' },
    series: [
      {
        type: 'bar',
        data: values.map((v, i) => ({
          value: v,
          itemStyle: { color: v >= 80 ? '#52c41a' : v >= 60 ? '#faad14' : '#ff4d4f', borderRadius: [4, 4, 0, 0] },
        })),
        barWidth: '50%',
        label: { show: true, position: 'top', formatter: (p: any) => `${p.value}% (${counts[p.dataIndex]}题)` },
      },
    ],
  } : {};

  const avgScore = assessments.length > 0
    ? Math.round(assessments.reduce((s, a) => s + (a.score || 0), 0) / assessments.length)
    : 0;

  const radarOption = hasData ? {
    tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}: ${p.value}% (${counts[p.dataIndex]}题)` },
    radar: { indicator: topics.map((t) => ({ name: t, max: 100 })), center: ['50%', '55%'], radius: '65%' },
    series: [{ type: 'radar', data: [{ value: values, name: '正确率' }], areaStyle: { opacity: 0.25 }, lineStyle: { color: '#1890ff', width: 2 }, itemStyle: { color: '#1890ff' } }],
  } : {};

  return (
    <div>
      <Title level={3}>学习分析</Title>
      <Text type="secondary">基于题库练习数据的多维度分析</Text>
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={12} lg={6}><Card><Statistic title="画像完成度" value={Math.round((profile.profile_completion || 0) * 100)} suffix="%" prefix={<TrophyOutlined />} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="练习次数" value={assessments.length} prefix={<RiseOutlined />} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="生成资源" value={resources.length} prefix={<BookOutlined />} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="平均正确率" value={avgScore} suffix="%" prefix={<TrophyOutlined />} /></Card></Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="知识点正确率雷达图">
            {hasData ? <ReactECharts option={radarOption} style={{ height: 350 }} /> : <Empty description="去题库练习后这里会显示各知识点正确率" style={{ padding: 60 }} />}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="知识点正确率柱状图">
            {hasData ? <ReactECharts option={barOption} style={{ height: 350 }} /> : <Empty description="去题库练习后这里会显示柱状图" style={{ padding: 60 }} />}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
