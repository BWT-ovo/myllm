import { useState, useMemo } from 'react';
import { Card, Typography, Button, Tag, Space, Row, Col, Statistic, Empty, Switch, message, Input, InputNumber, Select, Popconfirm, Modal, Tabs } from 'antd';
import { ThunderboltOutlined, TrophyOutlined, ClockCircleOutlined, CheckCircleOutlined, PlayCircleOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { getProfile, getAssessments, getMasteredTopics, setMasteredTopics, setLearningHours } from '../api/storage';

const { Title, Text } = Typography;

const KNOWLEDGE_GRAPH: Record<string, { title: string; prereqs: string[]; hours: number; resources: string[] }> = {
  'c1-绪论': { title: 'C++绪论', prereqs: [], hours: 1, resources: ['course_doc'] },
  'c2-对C的扩充': { title: 'C++对C的扩充', prereqs: ['c1-绪论'], hours: 2, resources: ['course_doc', 'exercise'] },
  友元的定义: { title: '友元机制', prereqs: ['类的定义与语法'], hours: 2, resources: ['course_doc', 'exercise'] },
  存取权限控制: { title: '存取权限控制', prereqs: ['类的定义与语法'], hours: 2, resources: ['course_doc', 'exercise'] },
  构造函数: { title: '构造函数与析构函数', prereqs: ['存取权限控制'], hours: 3, resources: ['course_doc', 'code_practice'] },
  拷贝构造函数: { title: '拷贝构造函数', prereqs: ['构造函数'], hours: 2, resources: ['course_doc', 'exercise'] },
  常成员函数: { title: '常成员与常对象', prereqs: ['构造函数'], hours: 2, resources: ['course_doc'] },
  静态成员: { title: '静态成员', prereqs: ['构造函数'], hours: 2, resources: ['course_doc', 'exercise'] },
  组合对象: { title: '组合对象', prereqs: ['构造函数'], hours: 2, resources: ['course_doc', 'code_practice'] },
  '继承与派生的作用': { title: '继承与派生基础', prereqs: ['组合对象'], hours: 3, resources: ['course_doc', 'mind_map'] },
  '继承的方式': { title: '三种继承方式', prereqs: ['继承与派生的作用'], hours: 2, resources: ['course_doc', 'exercise'] },
  类型兼容: { title: '类型兼容', prereqs: ['继承的方式'], hours: 2, resources: ['course_doc', 'exercise'] },
  多继承的构造析构: { title: '多继承与菱形继承', prereqs: ['类型兼容'], hours: 3, resources: ['course_doc', 'code_practice'] },
  虚基类的构造析构: { title: '虚基类', prereqs: ['多继承的构造析构'], hours: 2, resources: ['course_doc', 'exercise'] },
  '继承中的二义性问题': { title: '二义性问题', prereqs: ['虚基类的构造析构'], hours: 2, resources: ['course_doc', 'exercise'] },
  虚函数: { title: '虚函数与多态', prereqs: ['类型兼容'], hours: 3, resources: ['course_doc', 'mind_map', 'code_practice'] },
  纯虚函数与抽象类: { title: '抽象类', prereqs: ['虚函数'], hours: 2, resources: ['course_doc', 'exercise'] },
  运算符重载: { title: '运算符重载', prereqs: ['友元的定义'], hours: 3, resources: ['course_doc', 'code_practice'] },
  函数模板: { title: '函数模板', prereqs: ['继承与派生的作用'], hours: 2, resources: ['course_doc', 'exercise'] },
  类模板: { title: '类模板', prereqs: ['函数模板'], hours: 2, resources: ['course_doc', 'code_practice'] },
  STL: { title: 'STL标准库', prereqs: ['类模板'], hours: 3, resources: ['course_doc', 'code_practice'] },
  RTTI: { title: '运行时类型识别', prereqs: ['虚函数'], hours: 1, resources: ['course_doc'] },
  流与文件: { title: '流与文件操作', prereqs: ['继承与派生的作用'], hours: 2, resources: ['course_doc', 'code_practice'] },
  'C++基础': { title: 'C++基础语法', prereqs: ['c2-对C的扩充'], hours: 2, resources: ['course_doc', 'exercise'] },
  '类的定义与语法': { title: '类的定义与语法', prereqs: ['C++基础'], hours: 2, resources: ['course_doc', 'exercise'] },
};

const RESOURCE_LABELS: Record<string, string> = { course_doc: '课程文档', mind_map: '思维导图', exercise: '练习题', code_practice: '代码案例' };

type PlanItem = { key: string; title: string; accuracy: number; hours: number; status: string; week: number; resources: string[]; custom?: boolean };
type Plan = { id: string; name: string; items: PlanItem[]; mastered: string[]; createdAt: string };

function loadPlans(): Plan[] {
  try { return JSON.parse(localStorage.getItem('myllm_plans') || '[]'); } catch { return []; }
}
function savePlans(plans: Plan[]) { localStorage.setItem('myllm_plans', JSON.stringify(plans)); }

export default function LearningPath() {
  const [allPlans, setAllPlans] = useState<Plan[]>(loadPlans);
  const [activePlanId, setActivePlanId] = useState<string>(allPlans[0]?.id || '');
  const [planName, setPlanName] = useState('');

  const profile = useMemo(getProfile, []);
  const assessments = useMemo(getAssessments, []);
  const topicStats = useMemo(() => {
    const map: Record<string, { correct: number; total: number }> = {};
    for (const a of assessments) {
      const topic = (a.answers as any)?.topic || '';
      if (!topic || !a.sessionId) continue;
      if (!map[topic]) map[topic] = { correct: 0, total: 0 };
      map[topic].total++;
      if ((a.score || 0) >= 60) map[topic].correct++;
    }
    return map;
  }, [assessments]);

  const activePlan = allPlans.find((p) => p.id === activePlanId);
  const items = activePlan?.items || [];
  const masteredSet = new Set(activePlan?.mastered || []);

  const totalHours = Math.round(items.reduce((s, p) => s + p.hours, 0) * 10) / 10;
  const totalWeeks = items.length > 0 ? Math.max(...items.map((p) => p.week), 1) : 0;
  const masteredCount = items.filter((p) => p.status === 'mastered' || masteredSet.has(p.key)).length;

  // ===== Plan CRUD =====
  const createPlan = () => {
    const name = planName.trim() || `学习计划 ${allPlans.length + 1}`;
    const newPlan: Plan = { id: Date.now().toString(), name, items: [], mastered: [], createdAt: new Date().toISOString() };
    const updated = [...allPlans, newPlan];
    setAllPlans(updated); savePlans(updated); setActivePlanId(newPlan.id);
    setPlanName('');
    message.success(`计划「${name}」已创建`);
  };

  const deletePlan = (id: string) => {
    const updated = allPlans.filter((p) => p.id !== id);
    setAllPlans(updated); savePlans(updated);
    if (activePlanId === id) setActivePlanId(updated[0]?.id || '');
  };

  const renamePlan = (id: string, name: string) => {
    const updated = allPlans.map((p) => p.id === id ? { ...p, name } : p);
    setAllPlans(updated); savePlans(updated);
  };

  const updatePlanItems = (items: PlanItem[]) => {
    const updated = allPlans.map((p) => p.id === activePlanId ? { ...p, items } : p);
    setAllPlans(updated); savePlans(updated);
  };

  const updatePlanMastered = (keys: string[]) => {
    const updated = allPlans.map((p) => p.id === activePlanId ? { ...p, mastered: keys } : p);
    setAllPlans(updated); savePlans(updated);
    setMasteredTopics(keys);
    const masteredHours = items.filter((p) => keys.includes(p.key) || p.status === 'mastered').reduce((s, p) => s + p.hours, 0);
    setLearningHours(Math.round(masteredHours * 10) / 10);
  };

  // ===== Generate auto plan =====
  const generatePlan = () => {
    if (!activePlanId) { message.warning('请先创建一个计划'); return; }
    const visited = new Set<string>();
    const sorted: string[] = [];
    function visit(key: string) { if (visited.has(key)) return; visited.add(key); const n = KNOWLEDGE_GRAPH[key]; if (n) { for (const p of n.prereqs) visit(p); } sorted.push(key); }
    for (const key of Object.keys(KNOWLEDGE_GRAPH)) visit(key);
    const valid = sorted.filter((k) => KNOWLEDGE_GRAPH[k]);

    let week = 1, weekHours = 0;
    const generated: PlanItem[] = [];
    for (const key of valid) {
      const node = KNOWLEDGE_GRAPH[key];
      const acc = topicStats[key] ? Math.round((topicStats[key].correct / topicStats[key].total) * 100) : 0;
      const hasData = topicStats[key] && topicStats[key].total > 0;
      let hours = node.hours;
      if (hasData && acc >= 80) hours = Math.max(0.5, hours * 0.3);
      else if (hasData && acc >= 60) hours = Math.max(0.5, hours * 0.6);
      else if (hasData) hours = hours * 1.3;
      let status = 'pending';
      if (masteredSet.has(key)) status = 'mastered';
      else if (hasData && acc >= 80) status = 'mastered';
      else if (hasData && acc >= 60) status = 'in_progress';
      else if (hasData) status = 'weak';
      if (weekHours + hours > 8 && generated.length > 0) { week++; weekHours = 0; }
      weekHours += hours;
      generated.push({ key, title: node.title, accuracy: acc, hours: Math.round(hours * 10) / 10, status, week, resources: node.resources });
    }
    // Merge with existing custom items
    const existingCustom = (activePlan?.items || []).filter((i) => i.custom);
    const merged = [...generated, ...existingCustom].sort((a, b) => a.week - b.week);
    updatePlanItems(merged);
    message.success('计划已生成！');
  };

  // ===== Custom items =====
  const [newTitle, setNewTitle] = useState(''); const [newHours, setNewHours] = useState(1); const [newWeek, setNewWeek] = useState(1);
  const addCustomItem = () => {
    if (!newTitle.trim() || !activePlanId) return;
    const item: PlanItem = { key: `custom-${Date.now()}`, title: newTitle.trim(), accuracy: 0, hours: newHours, status: 'pending', week: newWeek, resources: [], custom: true };
    updatePlanItems([...items, item]);
    setNewTitle(''); setNewHours(1);
  };
  const removeItem = (key: string) => {
    updatePlanItems(items.filter((i) => i.key !== key));
    if (masteredSet.has(key)) updatePlanMastered([...masteredSet].filter((k) => k !== key));
  };

  // ===== Mastery toggle =====
  const toggleMastery = (key: string, v: boolean) => {
    const next = new Set(masteredSet);
    v ? next.add(key) : next.delete(key);
    updatePlanMastered([...next]);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div><Title level={3} style={{ margin: 0 }}>🗺️ 学习路径规划</Title><Text type="secondary">支持创建多个学习计划，每个计划独立管理</Text></div>
        <Space>
          {activePlanId && (
            <>
              <Popconfirm title="删除当前计划？" onConfirm={() => deletePlan(activePlanId)}>
                <Button danger icon={<DeleteOutlined />}>删除计划</Button>
              </Popconfirm>
              {items.length > 0 && (
                <Popconfirm title="清空当前计划的全部内容？" onConfirm={() => updatePlanItems([])}>
                  <Button danger>清空内容</Button>
                </Popconfirm>
              )}
              <Button type="primary" size="large" icon={<ThunderboltOutlined />} onClick={generatePlan}>
                {items.length > 0 ? '重新生成' : '生成学习计划'}
              </Button>
            </>
          )}
        </Space>
      </div>

      {/* Plan tabs */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          {allPlans.map((p) => (
            <Tag.CheckableTag key={p.id} checked={activePlanId === p.id} onChange={() => setActivePlanId(p.id)}
              style={{ padding: '4px 12px', fontSize: 14 }}>
              {activePlanId === p.id ? (
                <Input size="small" value={p.name} onChange={(e) => renamePlan(p.id, e.target.value)}
                  style={{ width: 120, border: 'none', background: 'transparent', fontWeight: 'bold' }}
                  onClick={(e) => e.stopPropagation()} bordered={false} />
              ) : (
                <Text strong={activePlanId === p.id}>{p.name}</Text>
              )}
              <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>{p.items.length}项</Text>
            </Tag.CheckableTag>
          ))}
          <Space.Compact>
            <Input size="small" placeholder="新计划名称" value={planName} onChange={(e) => setPlanName(e.target.value)}
              style={{ width: 120 }} onPressEnter={createPlan} />
            <Button size="small" icon={<PlusOutlined />} onClick={createPlan}>新建</Button>
          </Space.Compact>
        </Space>
      </Card>

      {!activePlanId ? (
        <Card><Empty description="点击上方「新建」创建一个学习计划" /></Card>
      ) : items.length === 0 ? (
        <Card>
          <Empty description="点击「生成学习计划」自动规划，或使用下方表单手动添加计划项">
            <div style={{ marginTop: 16 }}>
              <Space>
                <Input placeholder="自定义计划内容" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ width: 200 }} />
                <InputNumber min={0.5} max={20} step={0.5} value={newHours} onChange={(v) => setNewHours(v || 1)} style={{ width: 70 }} /> 小时
                <Select value={newWeek} onChange={setNewWeek} style={{ width: 80 }}>
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((w) => <Select.Option key={w} value={w}>第{w}周</Select.Option>)}
                </Select>
                <Button type="primary" icon={<PlusOutlined />} onClick={addCustomItem}>添加</Button>
              </Space>
            </div>
          </Empty>
        </Card>
      ) : (
        <div>
          {/* Summary */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={12} lg={6}><Card><Statistic title="总学时" value={totalHours} suffix="小时" prefix={<ClockCircleOutlined />} /></Card></Col>
            <Col xs={12} lg={6}><Card><Statistic title="预计周数" value={totalWeeks} suffix="周" prefix={<PlayCircleOutlined />} /></Card></Col>
            <Col xs={12} lg={6}><Card><Statistic title="已掌握" value={masteredCount} suffix={`/ ${items.length}`} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
            <Col xs={12} lg={6}><Card><Statistic title="画像完成度" value={Math.round((profile.profile_completion || 0) * 100)} suffix="%" prefix={<TrophyOutlined />} /></Card></Col>
          </Row>

          {/* Custom add form */}
          <Card title="✏️ 添加自定义计划项" size="small" style={{ marginBottom: 16 }}>
            <Space wrap>
              <Input placeholder="计划内容" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ width: 200 }} />
              <InputNumber min={0.5} max={20} step={0.5} value={newHours} onChange={(v) => setNewHours(v || 1)} style={{ width: 70 }} /> 小时
              <Select value={newWeek} onChange={setNewWeek} style={{ width: 80 }}>
                {Array.from({ length: Math.max(totalWeeks + 1, 8) }, (_, i) => i + 1).map((w) => <Select.Option key={w} value={w}>第{w}周</Select.Option>)}
              </Select>
              <Button type="primary" icon={<PlusOutlined />} onClick={addCustomItem}>添加</Button>
            </Space>
          </Card>

          {/* Weekly items */}
          {Array.from({ length: totalWeeks }, (_, w) => w + 1).map((week) => {
            const weekItems = items.filter((p) => p.week === week);
            if (weekItems.length === 0) return null;
            const wh = Math.round(weekItems.reduce((s, p) => s + p.hours, 0) * 10) / 10;
            return (
              <Card key={week} title={<Space>📅 第 {week} 周 <Tag color="blue">{wh} 小时</Tag></Space>} style={{ marginBottom: 16 }}>
                {weekItems.map((item) => {
                  const isM = masteredSet.has(item.key);
                  const ds = isM ? 'mastered' : item.status;
                  return (
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ minWidth: 140 }}>
                        <Text strong>{item.title}</Text>
                        <div><Tag color={ds === 'mastered' ? 'success' : ds === 'weak' ? 'error' : 'processing'}>{ds === 'mastered' ? '已掌握' : ds === 'weak' ? '薄弱' : '进行中'}</Tag></div>
                      </div>
                      <Text type="secondary" style={{ minWidth: 60 }}>{item.hours}h</Text>
                      <Space size={4}>
                        {item.custom ? <Tag color="orange">自定义</Tag> : item.resources.map((r) => <Tag key={r} style={{ fontSize: 11 }}>{RESOURCE_LABELS[r] || r}</Tag>)}
                      </Space>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>已掌握</Text>
                        <Switch size="small" checked={isM} onChange={(v) => toggleMastery(item.key, v)} />
                        <Popconfirm title="删除？" onConfirm={() => removeItem(item.key)}>
                          <Button type="link" danger icon={<DeleteOutlined />} size="small" />
                        </Popconfirm>
                      </div>
                    </div>
                  );
                })}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
