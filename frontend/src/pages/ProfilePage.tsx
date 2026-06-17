import { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Progress, Row, Col, Spin, Empty, Tag, Popconfirm } from 'antd';
import { UserOutlined, ReloadOutlined } from '@ant-design/icons';
import ProfileWizard from '../components/profile/ProfileWizard';
import { getProfile, resetProfile } from '../api/storage';

const { Title, Text } = Typography;

const DIMENSIONS = [
  { key: 'knowledge_base', name: '知识基础', desc: '已掌握的知识点分布', icon: '' },
  { key: 'cognitive_style', name: '认知风格', desc: '视觉/听觉/阅读/实践偏好', icon: '' },
  { key: 'error_patterns', name: '易错模式', desc: '高频错误类型分析', icon: '' },
  { key: 'learning_pace', name: '学习节奏', desc: '历史学习速度数据', icon: '' },
  { key: 'motivation_profile', name: '动机画像', desc: '内在/外在驱动力评估', icon: '' },
  { key: 'format_preferences', name: '格式偏好', desc: '偏好的内容类型与格式', icon: '' },
  { key: 'complexity_preference', name: '复杂度偏好', desc: '内容难度级别偏好', icon: '' },
];

export default function ProfilePage() {
  const [wizardStarted, setWizardStarted] = useState(false);
  const [profile, setProfile] = useState(getProfile);

  const refreshProfile = () => setProfile(getProfile());

  useEffect(() => {
    const refresh = () => setProfile(getProfile());
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const completion = Math.round((profile.profile_completion || 0) * 100);
  const hasProfile = completion > 0;

  const getDimPercent = (key: string): number => {
    if (key === 'knowledge_base') return Object.keys(profile.knowledge_base || {}).length > 0 ? 80 : 0;
    if (key === 'cognitive_style') return Object.values(profile.cognitive_style || {}).some((v) => v > 0.5) ? 70 : 0;
    if (key === 'error_patterns') return (profile.error_patterns || []).length > 0 ? 60 : 0;
    if (key === 'learning_pace') return profile.learning_pace > 0 ? 50 : 0;
    if (key === 'motivation_profile') return Object.keys(profile.motivation_profile || {}).length > 0 ? 50 : 0;
    if (key === 'format_preferences') return (profile.format_preferences?.preferred_types || []).length > 0 ? 60 : 0;
    if (key === 'complexity_preference') return profile.complexity_preference !== 'intermediate' ? 40 : 0;
    return (profile.confidence_scores || {})[key] ? Math.round(((profile.confidence_scores || {})[key] || 0) * 100) : 0;
  };

  if (wizardStarted) return <ProfileWizard onComplete={() => { setWizardStarted(false); refreshProfile(); }} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div><Title level={3} style={{ margin: 0 }}>学习画像</Title><Text type="secondary">对话式构建你的7维学习画像</Text></div>
        {hasProfile && <Space><Tag color="blue">完成度 {completion}%</Tag>
          <Button type="primary" ghost onClick={() => setWizardStarted(true)}>继续完善</Button>
          <Popconfirm title="重新构建将清除当前画像，确定？" onConfirm={() => { resetProfile(); refreshProfile(); setWizardStarted(true); }}>
            <Button icon={<ReloadOutlined />}>重新构建</Button>
          </Popconfirm></Space>}
      </div>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="画像维度">
            {!hasProfile ? <Empty description="尚未构建画像" style={{ padding: 40 }}>
              <Text type="secondary">点击右侧「开始对话」，与 AI 对话构建你的专属画像</Text></Empty> :
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {DIMENSIONS.map((dim) => {
                  const pct = getDimPercent(dim.key);
                  return <div key={dim.key} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Text strong style={{ minWidth: 90 }}>{dim.name}</Text>
                    <Progress percent={pct} size="small" style={{ flex: 1 }} strokeColor={pct > 0 ? '#1890ff' : '#e8e8e8'} format={() => `${pct}%`} />
                    <Text type="secondary" style={{ minWidth: 160, fontSize: 13 }}>{dim.desc}</Text>
                  </div>;
                })}
              </Space>}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card>
            <Title level={4}>{hasProfile ? '继续完善' : '开始构建'}</Title>
            <Text type="secondary">{hasProfile ? `当前完成度 ${completion}%。继续对话提升精度。` : '5-10轮对话，AI分析你的学习特点，构建7维画像。'}</Text>
            <Space direction="vertical" style={{ width: '100%', marginTop: 24 }}>
              <Button type="primary" size="large" block icon={<UserOutlined />}
                onClick={() => { if (!hasProfile) resetProfile(); setWizardStarted(true); }}>{hasProfile ? '继续对话' : '开始对话'}</Button>
              {hasProfile && (
                <Popconfirm title="重新构建将清除当前画像，确定？" onConfirm={() => { resetProfile(); refreshProfile(); setWizardStarted(true); }}>
                  <Button block icon={<ReloadOutlined />}>重新构建画像</Button>
                </Popconfirm>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
