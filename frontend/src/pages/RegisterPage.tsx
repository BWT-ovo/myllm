import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const onFinish = (values: { username: string; password: string }) => {
    setLoading(true);
    setTimeout(() => {
      login(values.username);
      message.success('注册成功！开始构建你的学习画像吧~');
      navigate('/profile');
      setLoading(false);
    }, 300);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Card style={{ width: 400, borderRadius: 12 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3}>创建账号</Title>
          <Text type="secondary">开始你的个性化学习之旅</Text>
        </div>
        <Form onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, min: 6 }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码（6位以上）" />
          </Form.Item>
          <Form.Item name="confirm" dependencies={['password']}
            rules={[{ required: true }, ({ getFieldValue }) => ({
              validator(_, v) { return v && getFieldValue('password') === v ? Promise.resolve() : Promise.reject('密码不一致'); }
            })]}>
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>注册</Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}><Space><Text>已有账号？</Text><Link to="/login">返回登录</Link></Space></div>
      </Card>
    </div>
  );
}
