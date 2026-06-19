import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, Typography, theme } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  BookOutlined,
  ApartmentOutlined,
  NodeIndexOutlined,
  CodeOutlined,
  PlayCircleOutlined,
  MessageOutlined,
  FormOutlined,
  BarChartOutlined,
  OrderedListOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/', icon: <HomeOutlined />, label: '学习首页' },
  { key: '/profile', icon: <UserOutlined />, label: '学习画像' },
  { key: '/learn', icon: <BookOutlined />, label: '学习中心' },
  { key: '/knowledge-map', icon: <ApartmentOutlined />, label: '知识图谱' },
  { key: '/tutoring', icon: <MessageOutlined />, label: '智能答疑' },
  { key: '/assessments', icon: <FormOutlined />, label: '学习评估' },
  { key: '/analytics', icon: <BarChartOutlined />, label: '学习分析' },
  { key: '/question-bank', icon: <OrderedListOutlined />, label: '题库练习' },
  { key: '/learning-path', icon: <NodeIndexOutlined />, label: '学习路径' },
  { key: '/code-practice', icon: <CodeOutlined />, label: '编程练习' },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { token } = theme.useToken();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ];

  const selectedKey = '/' + location.pathname.split('/')[1] || '/';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        {/* Logo area */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <ThunderboltOutlined style={{ fontSize: 24, color: token.colorPrimary, marginRight: 8 }} />
          {!collapsed && (
            <Text strong style={{ fontSize: 16, color: token.colorPrimary }}>
              myLLM
            </Text>
          )}
        </div>

        {/* Navigation Menu */}
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ border: 'none', marginTop: 8 }}
        />
      </Sider>

      {/* Main content area */}
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            height: 64,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Text type="secondary" style={{ fontSize: 14 }}>
              C++面向对象程序设计 · 个性化学习系统
            </Text>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} style={{ background: token.colorPrimary }} />
                <Text>{user?.username || '学生'}</Text>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            margin: 0,
            padding: 24,
            background: '#f5f5f5',
            minHeight: 'calc(100vh - 64px)',
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
