import { Card, Tabs, Typography, Table, Button, Space, Tag, Upload, message } from 'antd';
import { UploadOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function AdminPage() {
  const nodeColumns = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '深度', dataIndex: 'depth', key: 'depth' },
    { title: '标签', dataIndex: 'tags', key: 'tags', render: (tags: string[]) => tags?.map(t => <Tag key={t}>{t}</Tag>) },
    { title: '预估学时', dataIndex: 'hours', key: 'hours', render: (h: number) => `${h}h` },
    { title: '操作', key: 'action', render: () => <Space><Button type="link">编辑</Button><Button type="link" danger>删除</Button></Space> },
  ];

  const nodes = [
    { key: '1', title: 'C++基础回顾', depth: 0, tags: ['基础', '语法'], hours: 2 },
    { key: '2', title: '类与对象', depth: 1, tags: ['类', '对象', '封装'], hours: 3 },
    { key: '3', title: '继承与派生', depth: 1, tags: ['继承', '派生'], hours: 4 },
    { key: '4', title: '多态与虚函数', depth: 1, tags: ['多态', '虚函数'], hours: 3 },
    { key: '5', title: '模板与泛型', depth: 2, tags: ['模板', 'STL'], hours: 5 },
  ];

  return (
    <div>
      <Title level={3}>⚙️ 管理控制台</Title>
      <Tabs
        items={[
          {
            key: 'kb',
            label: '知识库管理',
            children: (
              <Card>
                <Space style={{ marginBottom: 16 }}>
                  <Button type="primary" icon={<PlusOutlined />}>添加节点</Button>
                  <Button icon={<UploadOutlined />}>上传文档</Button>
                  <Button icon={<ReloadOutlined />}>重建索引</Button>
                </Space>
                <Table columns={nodeColumns} dataSource={nodes} />
              </Card>
            ),
          },
          {
            key: 'safety',
            label: '内容审核',
            children: (
              <Card>
                <Title level={5}>待审核内容</Title>
                <p>安全审核队列 — Phase 7 完整实现</p>
              </Card>
            ),
          },
          {
            key: 'resources',
            label: '资源管理',
            children: (
              <Card>
                <Title level={5}>所有生成资源</Title>
                <p>资源列表管理 — Phase 7 完整实现</p>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
