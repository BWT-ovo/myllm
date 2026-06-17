import { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Statistic, Progress, Button, Space } from 'antd';
import { BookOutlined, ClockCircleOutlined, ThunderboltOutlined, RightOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getProfile, getResources, getMasteredTopics, getLearningHours } from '../api/storage';

const { Title, Text } = Typography;

export default function HomePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(getProfile);
  const [resources, setResources] = useState(getResources);
  const [mastered, setMastered] = useState(getMasteredTopics);
  const [hours, setHours] = useState(getLearningHours);

  useEffect(() => {
    const refresh = () => {
      setProfile(getProfile());
      setResources(getResources());
      setMastered(getMasteredTopics());
      setHours(getLearningHours());
    };
    refresh(); // initial load
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const completion = Math.round((profile.profile_completion || 0) * 100);

  return (
    <div>
      <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 12 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>欢迎回来！</Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>
              {completion > 0 ? `画像完成度 ${completion}%，继续「C++面向对象程序设计」之旅` : '开始构建学习画像，获取个性化学习体验'}
            </Text>
          </Col>
          <Col>
            <Space>
              {completion < 50 && (
                <Button ghost icon={<UserOutlined />} onClick={() => navigate('/profile')}>构建画像</Button>
              )}
              <Button type="primary" ghost size="large" icon={<RightOutlined />} onClick={() => navigate('/learn')}>开始学习</Button>
            </Space>
          </Col>
        </Row>
      </Card>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} lg={6}>
          <Card hoverable onClick={() => navigate('/profile')}>
            <Statistic title="画像完成度" value={completion} suffix="%" prefix={<UserOutlined />} />
            <Progress percent={completion} showInfo={false} size="small" />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card hoverable onClick={() => navigate('/learn')}>
            <Statistic title="学习资源" value={resources.length} prefix={<BookOutlined />} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card>
            <Statistic title="已学章节" value={mastered.length}
              suffix={mastered.length > 0 ? '个已掌握' : ''} prefix={<ThunderboltOutlined />} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card><Statistic title="学习时长" value={hours} suffix="小时" prefix={<ClockCircleOutlined />} /></Card>
        </Col>
      </Row>
    </div>
  );
}
