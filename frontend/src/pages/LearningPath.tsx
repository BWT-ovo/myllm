import { useState, useMemo } from 'react';
import { Card, Typography, Button, Tag, Space, Row, Col, Statistic, Empty, Switch, message } from 'antd';
import { ThunderboltOutlined, TrophyOutlined, ClockCircleOutlined, CheckCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { getProfile, getAssessments, getMasteredTopics, setMasteredTopics, setLearningHours, getSavedPlan, setSavedPlan } from '../api/storage';

const { Title, Text, Paragraph } = Typography;

// C++ OOP knowledge graph with dependencies
const KNOWLEDGE_GRAPH: Record<string, { title: string; prereqs: string[]; hours: number; resources: string[] }> = {
  'c1-绪论': { title: 'C++绪论', prereqs: [], hours: 1, resources: ['course_doc'] },
  'c2-对C的扩充': { title: 'C++对C的扩充', prereqs: ['c1-绪论'], hours: 2, resources: ['course_doc', 'exercise'] },
  '友元的定义': { title: '友元机制', prereqs: ['类的定义与语法'], hours: 2, resources: ['course_doc', 'exercise'] },
  '存取权限控制': { title: '存取权限控制', prereqs: ['类的定义与语法'], hours: 2, resources: ['course_doc', 'exercise'] },
  '构造函数': { title: '构造函数与析构函数', prereqs: ['存取权限控制'], hours: 3, resources: ['course_doc', 'code_practice'] },
  '拷贝构造函数': { title: '拷贝构造函数', prereqs: ['构造函数'], hours: 2, resources: ['course_doc', 'exercise'] },
  '常成员函数': { title: '常成员与常对象', prereqs: ['构造函数'], hours: 2, resources: ['course_doc'] },
  '静态成员': { title: '静态成员', prereqs: ['构造函数'], hours: 2, resources: ['course_doc', 'exercise'] },
  '组合对象': { title: '组合对象', prereqs: ['构造函数'], hours: 2, resources: ['course_doc', 'code_practice'] },
  '继承与派生的作用': { title: '继承与派生基础', prereqs: ['组合对象'], hours: 3, resources: ['course_doc', 'mind_map'] },
  '继承的方式': { title: '三种继承方式', prereqs: ['继承与派生的作用'], hours: 2, resources: ['course_doc', 'exercise'] },
  '类型兼容': { title: '类型兼容', prereqs: ['继承的方式'], hours: 2, resources: ['course_doc', 'exercise'] },
  '多继承的构造析构': { title: '多继承与菱形继承', prereqs: ['类型兼容'], hours: 3, resources: ['course_doc', 'code_practice'] },
  '虚基类的构造析构': { title: '虚基类', prereqs: ['多继承的构造析构'], hours: 2, resources: ['course_doc', 'exercise'] },
  '继承中的二义性问题': { title: '二义性问题', prereqs: ['虚基类的构造析构'], hours: 2, resources: ['course_doc', 'exercise'] },
  '虚函数': { title: '虚函数与多态', prereqs: ['类型兼容'], hours: 3, resources: ['course_doc', 'mind_map', 'code_practice'] },
  '纯虚函数与抽象类': { title: '抽象类', prereqs: ['虚函数'], hours: 2, resources: ['course_doc', 'exercise'] },
  '运算符重载': { title: '运算符重载', prereqs: ['友元的定义'], hours: 3, resources: ['course_doc', 'code_practice'] },
  '函数模板': { title: '函数模板', prereqs: ['继承与派生的作用'], hours: 2, resources: ['course_doc', 'exercise'] },
  '类模板': { title: '类模板', prereqs: ['函数模板'], hours: 2, resources: ['course_doc', 'code_practice'] },
  'STL': { title: 'STL标准库', prereqs: ['类模板'], hours: 3, resources: ['course_doc', 'code_practice'] },
  'RTTI': { title: '运行时类型识别', prereqs: ['虚函数'], hours: 1, resources: ['course_doc'] },
  '流与文件': { title: '流与文件操作', prereqs: ['继承与派生的作用'], hours: 2, resources: ['course_doc', 'code_practice'] },
  'C++基础': { title: 'C++基础语法', prereqs: ['c2-对C的扩充'], hours: 2, resources: ['course_doc', 'exercise'] },
  '类的定义与语法': { title: '类的定义与语法', prereqs: ['C++基础'], hours: 2, resources: ['course_doc', 'exercise'] },
};

const RESOURCE_LABELS: Record<string, string> = {
  course_doc: '课程文档', mind_map: '思维导图', exercise: '练习题', code_practice: '代码案例',
};

export default function LearningPath() {
  const saved = getSavedPlan();
  const [plan, setPlan] = useState<Array<{ key: string; title: string; accuracy: number; hours: number; status: string; week: number; resources: string[] }> | null>(saved);
  const [masteredSet, setMasteredSet] = useState<Set<string>>(new Set(getMasteredTopics()));

  const profile = useMemo(getProfile, []);
  const assessments = useMemo(getAssessments, []);

  // Compute topic accuracies from quiz data
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

  const generatePlan = () => {
    // Topological sort: order topics by prerequisites
    const visited = new Set<string>();
    const sorted: string[] = [];
    function visit(key: string) {
      if (visited.has(key)) return;
      visited.add(key);
      const node = KNOWLEDGE_GRAPH[key];
      if (node) {
        for (const p of node.prereqs) visit(p);
      }
      sorted.push(key);
    }
    for (const key of Object.keys(KNOWLEDGE_GRAPH)) visit(key);

    // Filter to topics that exist in our knowledge graph
    const validTopics = sorted.filter((k) => KNOWLEDGE_GRAPH[k]);

    // Calculate plan
    let week = 1;
    let weekHours = 0;
    const planItems: Array<{ key: string; title: string; accuracy: number; hours: number; status: string; week: number; resources: string[] }> = [];

    for (const key of validTopics) {
      const node = KNOWLEDGE_GRAPH[key];
      const acc = topicStats[key] ? Math.round((topicStats[key].correct / topicStats[key].total) * 100) : 0;
      const hasData = topicStats[key] && topicStats[key].total > 0;

      // Adjust hours based on accuracy
      let hours = node.hours;
      if (hasData && acc >= 80) hours = Math.max(0.5, hours * 0.3); // master: review only
      else if (hasData && acc >= 60) hours = Math.max(0.5, hours * 0.6); // ok: light review
      else if (hasData && acc < 60) hours = hours * 1.3; // weak: extra time

      let status = 'pending';
      if (masteredSet.has(key)) status = 'mastered';
      else if (hasData && acc >= 80) status = 'mastered';
      else if (hasData && acc >= 60) status = 'in_progress';
      else if (hasData) status = 'weak';

      // Assign to week (max 8 hours per week)
      if (weekHours + hours > 8 && planItems.length > 0) {
        week++;
        weekHours = 0;
      }
      weekHours += hours;

      planItems.push({
        key, title: node.title, accuracy: acc,
        hours: Math.round(hours * 10) / 10,
        status, week, resources: node.resources,
      });
    }

    setPlan(planItems);
    setSavedPlan(planItems);
    message.success('学习计划已生成！');
  };

  const totalHours = plan ? Math.round(plan.reduce((s, p) => s + p.hours, 0) * 10) / 10 : 0;
  const totalWeeks = plan ? Math.max(...plan.map((p) => p.week)) : 0;
  const mastered = plan ? plan.filter((p) => p.status === 'mastered' || masteredSet.has(p.key)).length : 0;
  const manualCount = plan ? plan.filter((p) => masteredSet.has(p.key)).length : 0;
  const completed = assessments.filter((a) => a.sessionId).length > 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>🗺️ 学习路径规划</Title>
          <Text type="secondary">基于画像和练习数据，生成个性化、可执行的学习计划</Text>
        </div>
        <Button type="primary" size="large" icon={<ThunderboltOutlined />} onClick={generatePlan}>
          生成学习计划
        </Button>
      </div>

      {plan ? (
        <div>
          {/* Summary */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} lg={6}>
              <Card><Statistic title="总学时" value={totalHours} suffix="小时" prefix={<ClockCircleOutlined />} /></Card>
            </Col>
            <Col xs={12} lg={6}>
              <Card><Statistic title="预计周数" value={totalWeeks} suffix="周" prefix={<PlayCircleOutlined />} /></Card>
            </Col>
            <Col xs={12} lg={6}>
              <Card><Statistic title={manualCount > 0 ? `已掌握 (含${manualCount}个手动标记)` : '已掌握'} value={mastered} suffix={`/ ${plan.length}`} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
            </Col>
            <Col xs={12} lg={6}>
              <Card><Statistic title="画像完成度" value={Math.round((profile.profile_completion || 0) * 100)} suffix="%" prefix={<TrophyOutlined />} /></Card>
            </Col>
          </Row>

          {/* Weekly plan */}
          {Array.from({ length: totalWeeks }, (_, w) => w + 1).map((week) => {
            const weekItems = plan.filter((p) => p.week === week);
            const weekHours = Math.round(weekItems.reduce((s, p) => s + p.hours, 0) * 10) / 10;
            return (
              <Card key={week} title={<Space>📅 第 {week} 周 <Tag color="blue">{weekHours} 小时</Tag></Space>}
                style={{ marginBottom: 16 }}>
                {weekItems.map((item) => {
                  const isMastered = masteredSet.has(item.key);
                  const displayStatus = isMastered ? 'mastered' : item.status;
                  return (
                    <div key={item.key} style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0',
                      borderBottom: '1px solid #f0f0f0',
                    }}>
                      <div style={{ minWidth: 140 }}>
                        <Text strong>{item.title}</Text>
                        <div>
                          <Tag color={
                            displayStatus === 'mastered' ? 'success' :
                            displayStatus === 'weak' ? 'error' : 'processing'
                          }>
                            {displayStatus === 'mastered' ? '已掌握' : displayStatus === 'weak' ? '薄弱' : '进行中'}
                          </Tag>
                        </div>
                      </div>
                      <Text type="secondary" style={{ minWidth: 60 }}>{item.hours}h</Text>
                      <Space size={4}>
                        {item.resources.map((r) => (
                          <Tag key={r} style={{ fontSize: 11 }}>{RESOURCE_LABELS[r] || r}</Tag>
                        ))}
                      </Space>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>已掌握</Text>
                        <Switch size="small" checked={isMastered} onChange={(v) => {
                          const next = new Set(masteredSet);
                          v ? next.add(item.key) : next.delete(item.key);
                          setMasteredSet(next);
                          setMasteredTopics([...next]);
                          // Update hours from mastered items
                          const masteredHours = plan!.filter((p) => next.has(p.key) || p.status === 'mastered').reduce((s, p) => s + p.hours, 0);
                          setLearningHours(Math.round(masteredHours * 10) / 10);
                        }} />
                      </div>
                    </div>
                  );
                })}
              </Card>
            );
          })}

          {/* Explanation */}
          <Card style={{ background: '#fafafa', marginTop: 16 }}>
            <Text strong>📖 计划说明：</Text>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              <li>知识点按前置依赖顺序排列，确保先学基础再学进阶</li>
              <li>根据测验正确率动态调整学时：已掌握 → 快速复习，薄弱 → 重点攻克</li>
              <li>每周不超过 8 小时，合理分配学习节奏</li>
              <li>推荐资源类型根据知识点特点自动匹配（文档/思维导图/练习题/代码案例）</li>
              <li>完成测验后重新生成计划，进度会实时更新</li>
            </ul>
          </Card>
        </div>
      ) : (
        <Card>
          <Empty description={
            <div>
              <Text>点击「生成学习计划」，系统将分析你的：</Text>
              <ul style={{ textAlign: 'left', marginTop: 12 }}>
                <li>📋 学习画像 — 认知风格和偏好</li>
                <li>📊 练习数据 — 各知识点正确率 {completed ? '(已有数据)' : '(暂无数据，先去题库做随机测验)'}</li>
                <li>🗺️ 知识图谱 — C++ OOP 的前置依赖关系</li>
              </ul>
              <Text type="secondary">生成一个按周划分的、可执行的个性化学习计划</Text>
            </div>
          } />
        </Card>
      )}
    </div>
  );
}
