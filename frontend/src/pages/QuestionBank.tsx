import { useState, useEffect, useMemo } from 'react';
import { Card, Typography, Button, Tag, Space, Progress, Divider, Empty, Input, Radio, Checkbox, message, Tabs, Select, Statistic, Row, Col, Descriptions } from 'antd';
import { CheckOutlined, CloseOutlined, RightOutlined, SearchOutlined, ThunderboltOutlined, ReloadOutlined, TrophyOutlined, WarningOutlined, BookOutlined } from '@ant-design/icons';
import { addAssessment } from '../api/storage';
import ReactECharts from 'echarts-for-react';

const { Title, Text, Paragraph } = Typography;

interface Question {
  id: number; type: string; stem: string; code?: string;
  options?: string[]; answer: string[]; explanation: string;
}
interface QBData { course: string; chapters: Record<string, { title: string; topics: Record<string, { questions: Question[] }> }>; }

// Flatten all questions
function flattenQB(data: QBData): Array<{ q: Question; chapter: string; topic: string }> {
  const result: Array<{ q: Question; chapter: string; topic: string }> = [];
  for (const [, ch] of Object.entries(data.chapters)) {
    for (const [tk, tp] of Object.entries(ch.topics)) {
      for (const q of tp.questions) {
        result.push({ q, chapter: ch.title, topic: tk });
      }
    }
  }
  return result;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface QuizResult { q: Question; chapter: string; topic: string; selected: string[]; fillAnswers: string[]; correct: boolean; }

export default function QuestionBank() {
  const [data, setData] = useState<QBData | null>(null);
  const [allQuestions, setAllQuestions] = useState<Array<{ q: Question; chapter: string; topic: string }>>([]);

  // Chapter browse state
  const [activeChapter, setActiveChapter] = useState<string>('');
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [fillAnswers, setFillAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [search, setSearch] = useState('');

  // Random quiz state
  const [quizMode, setQuizMode] = useState(false);
  const [quizCount, setQuizCount] = useState(10);
  const [quizQuestions, setQuizQuestions] = useState<Array<{ q: Question; chapter: string; topic: string }>>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [quizDone, setQuizDone] = useState(false);
  const [quizSessionId, setQuizSessionId] = useState('');

  useEffect(() => {
    fetch('/question-bank.json').then((r) => r.json()).then((d: QBData) => {
      setData(d);
      setAllQuestions(flattenQB(d));
      const chKeys = Object.keys(d.chapters);
      if (chKeys.length > 0) setActiveChapter(chKeys[0]);
    }).catch(() => message.error('题库加载失败'));
  }, []);

  // ===== Chapter browse =====
  const chapter = data?.chapters[activeChapter];
  const chapterQuestions = useMemo(() => {
    if (!chapter) return [];
    const result: Array<{ q: Question; topic: string }> = [];
    for (const [tk, tp] of Object.entries(chapter.topics)) {
      for (const q of tp.questions) result.push({ q, topic: tk });
    }
    return result;
  }, [chapter]);
  const cq = chapterQuestions[currentQ]?.q;

  const norm = (s: string) => (s || '').trim().replace(/\s+/g, '').replace(/;+$/g, '').toLowerCase();
  const resetState = () => { setSelected([]); setFillAnswers([]); setSubmitted(false); setLastCorrect(false); };

  const curType = quizMode ? quizQuestions[quizIndex]?.q?.type : cq?.type;
  const handleSelect = (val: string) => {
    if (submitted) return;
    if (curType === 'multiple_choice') {
      setSelected((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
    } else setSelected([val]);
  };

  const handleChapterSubmit = () => {
    if (!cq) return;
    setSubmitted(true);
    let isCorrect = false;
    if (cq.type === 'fill_blank') {
      let allMatch = cq.answer.length > 0;
      for (let i = 0; i < cq.answer.length; i++) {
        if (norm(cq.answer[i]) !== norm(fillAnswers[i] || '')) { allMatch = false; break; }
      }
      isCorrect = allMatch;
    } else {
      isCorrect = cq.answer.length === selected.length && cq.answer.every((a) => selected.includes(a));
    }
    setLastCorrect(isCorrect);
    // 章节练习不保存评估记录，仅随机测验保存
  };

  // ===== Random Quiz =====
  const startQuiz = () => {
    const pool = allQuestions.length > 0 ? allQuestions : [];
    const picked = shuffle(pool).slice(0, Math.min(quizCount, pool.length));
    setQuizQuestions(picked);
    setQuizIndex(0);
    setQuizResults([]);
    setQuizDone(false);
    setQuizMode(true);
    setQuizSessionId(crypto.randomUUID());
    resetState();
  };

  const handleQuizSubmit = () => {
    const item = quizQuestions[quizIndex];
    if (!item) return;
    let isCorrect = false;
    if (item.q.type === 'fill_blank') {
      let allMatch = item.q.answer.length > 0;
      for (let i = 0; i < item.q.answer.length; i++) {
        if (norm(item.q.answer[i]) !== norm(fillAnswers[i] || '')) { allMatch = false; break; }
      }
      isCorrect = allMatch;
    } else {
      isCorrect = item.q.answer.length === selected.length && item.q.answer.every((a) => selected.includes(a));
    }
    setSubmitted(true);
    setLastCorrect(isCorrect);
    setQuizResults((prev) => [...prev, { q: item.q, chapter: item.chapter, topic: item.topic, selected: [...selected], fillAnswers: [...fillAnswers], correct: isCorrect }]);
    addAssessment({
      id: crypto.randomUUID(), type: 'exercise', score: isCorrect ? 100 : 0, max_score: 100,
      answers: { questionId: item.q.id, chapter: item.chapter, topic: item.topic, stem: item.q.stem.slice(0, 100), selected: [...selected], fillAnswers: [...fillAnswers] },
      feedback: isCorrect ? { result: 'correct' } : { result: 'incorrect', expected: item.q.answer },
      created_at: new Date().toISOString(),
      sessionId: quizSessionId,
    });
  };

  const nextQuiz = () => {
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex(quizIndex + 1);
      resetState();
    } else {
      setQuizDone(true);
    }
  };

  // ===== Analysis =====
  const analysis = useMemo(() => {
    if (!quizDone || quizResults.length === 0) return null;
    const correct = quizResults.filter((r) => r.correct).length;
    const total = quizResults.length;
    const accuracy = Math.round((correct / total) * 100);

    // Per-topic analysis
    const topicMap: Record<string, { correct: number; total: number }> = {};
    for (const r of quizResults) {
      const key = r.topic;
      if (!topicMap[key]) topicMap[key] = { correct: 0, total: 0 };
      topicMap[key].total++;
      if (r.correct) topicMap[key].correct++;
    }

    const topics = Object.keys(topicMap).sort((a, b) => {
      const ar = topicMap[a].correct / topicMap[a].total;
      const br = topicMap[b].correct / topicMap[b].total;
      return ar - br; // worst first
    });

    const weakTopics = topics.filter((t) => topicMap[t].correct / topicMap[t].total < 0.6);

    return { correct, total, accuracy, topicMap, topics, weakTopics };
  }, [quizDone, quizResults]);

  const barOption = analysis ? {
    tooltip: {},
    grid: { top: 10, bottom: 80, left: 40, right: 20 },
    xAxis: { type: 'category', data: analysis.topics, axisLabel: { rotate: 30, fontSize: 11 } },
    yAxis: { type: 'value', max: 100, min: 0 },
    series: [{
      type: 'bar',
      data: analysis.topics.map((t) => Math.round((analysis.topicMap[t].correct / analysis.topicMap[t].total) * 100)),
      itemStyle: { color: '#1890ff', borderRadius: [4, 4, 0, 0] },
      barWidth: '50%',
    }],
  } : {};

  // ===== Shared question render =====
  const question = quizMode ? quizQuestions[quizIndex]?.q : cq;
  const qChapter = quizMode ? quizQuestions[quizIndex]?.chapter : chapter?.title;
  const qTopic = quizMode ? quizQuestions[quizIndex]?.topic : chapterQuestions[currentQ]?.topic;

  const renderQuestion = (q: Question) => (
    <div>
      <Paragraph style={{ fontSize: 16, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
        <Text strong>{q.stem}</Text>
      </Paragraph>
      {q.code && <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>{q.code}</pre>}

      {/* Options */}
      {q.options?.map((opt) => {
        const letterMatch = opt.match(/^([A-G]+)\./);
        const letter = letterMatch ? letterMatch[1] : opt.charAt(0);
        const text = opt.replace(/^[A-G]+\.\s*/, '');
        const isSel = selected.includes(letter);
        const isAns = q.answer.includes(letter);
        let bg = '#fff';
        if (submitted) { if (isAns) bg = '#f6ffed'; if (isSel && !isAns) bg = '#fff2f0'; }
        else if (isSel) bg = '#e6f7ff';

        return (
          <div key={letter} onClick={() => handleSelect(letter)} style={{
            padding: '10px 16px', marginBottom: 8, borderRadius: 8, cursor: 'pointer',
            background: bg, border: `1px solid ${isSel ? '#1890ff' : '#e8e8e8'}`,
            display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s',
          }}>
            <Tag color={isSel ? 'blue' : 'default'}>{letter}</Tag>
            <Text>{text}</Text>
            {submitted && isAns && <CheckOutlined style={{ color: '#52c41a', marginLeft: 'auto' }} />}
            {submitted && isSel && !isAns && <CloseOutlined style={{ color: '#ff4d4f', marginLeft: 'auto' }} />}
          </div>
        );
      })}

      {/* Fill blanks */}
      {q.type === 'fill_blank' && q.answer.map((_, i) => (
        <Input key={i} placeholder={`第 ${i + 1} 空`} value={fillAnswers[i] || ''}
          onChange={(e) => { const arr = [...fillAnswers]; arr[i] = e.target.value; setFillAnswers(arr); }}
          disabled={submitted} style={{ marginBottom: 8, maxWidth: 400 }} size="large" />
      ))}

      {/* True/False */}
      {q.type === 'true_false' && (
        <Space size="large" style={{ marginBottom: 20 }}>
          {['正确', '错误'].map((val) => (
            <Button key={val} size="large" type={selected.includes(val) ? 'primary' : 'default'}
              onClick={() => setSelected([val])} disabled={submitted} style={{ width: 120, height: 48, fontSize: 16 }}>{val}</Button>
          ))}
        </Space>
      )}

      {/* Submit */}
      <div style={{ marginTop: 16 }}>
        {!submitted ? (
          <Button type="primary" size="large" onClick={quizMode ? handleQuizSubmit : handleChapterSubmit}
            disabled={q.type !== 'fill_blank' && q.type !== 'coding' && selected.length === 0}>提交答案</Button>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Tag color={lastCorrect ? 'success' : 'error'} style={{ fontSize: 14, padding: '4px 12px' }}>
              {lastCorrect ? '✅ 正确' : '❌ 错误'}
            </Tag>
            {q.type === 'fill_blank' && q.answer.map((a, i) => {
              const u = (Array.from({ length: q.answer.length }, (_, j) => fillAnswers[j] || ''))[i] || '(未填)';
              return (
                <div key={i}><Text>第{i + 1}空：你填 </Text>
                  <Tag color={norm(a) === norm(u) ? 'success' : 'error'}>{u}</Tag>
                  {norm(a) !== norm(u) && <><Text> 标准：</Text><Tag color="blue">{a}</Tag></>}
                </div>
              );
            })}
            {q.type !== 'fill_blank' && <Text>正确答案：{q.answer.join('、')}</Text>}
            <Card size="small" style={{ background: '#fafafa' }}>
              <Text strong>📖 解析：</Text><Paragraph style={{ marginTop: 8, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{q.explanation}</Paragraph>
            </Card>
          </Space>
        )}
      </div>
    </div>
  );

  // ===== Quiz Done Report =====
  if (quizDone && analysis) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <ResultTitle correct={analysis.correct} total={analysis.total} accuracy={analysis.accuracy} />
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <Card title="知识点正确率">
              <ReactECharts option={barOption} style={{ height: 350 }} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="薄弱知识点">
              {analysis.weakTopics.length === 0 ? (
                <Empty description="全部知识点正确率 ≥ 60%，表现优秀！" />
              ) : (
                <div>
                  {analysis.weakTopics.map((t) => {
                    const s = analysis.topicMap[t];
                    const pct = Math.round((s.correct / s.total) * 100);
                    return (
                      <div key={t} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text strong>{t}</Text>
                          <Text type="danger">{pct}% ({s.correct}/{s.total})</Text>
                        </div>
                        <Progress percent={pct} size="small" status="exception" />
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
            <Card title="答题详情" style={{ marginTop: 16 }}>
              {quizResults.map((r, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag color={r.correct ? 'success' : 'error'}>{r.correct ? '对' : '错'}</Tag>
                  <Text style={{ flex: 1 }}>{r.q.stem.slice(0, 50)}...</Text>
                  <Tag>{r.topic}</Tag>
                </div>
              ))}
            </Card>
          </Col>
        </Row>
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Space>
            <Button icon={<ReloadOutlined />} size="large" onClick={() => { setQuizMode(false); setQuizDone(false); }}>返回题库</Button>
            <Button type="primary" icon={<ThunderboltOutlined />} size="large" onClick={startQuiz}>再来一轮</Button>
          </Space>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Tabs activeKey={quizMode ? 'quiz' : 'browse'} onChange={(k) => { if (k === 'browse') setQuizMode(false); }}
        tabBarExtraContent={
          !quizMode ? (
            <Space>
              <Select value={quizCount} onChange={setQuizCount} style={{ width: 80 }}>
                {[5, 10, 15, 20, 30].map((n) => <Select.Option key={n} value={n}>{n}题</Select.Option>)}
              </Select>
              <Button type="primary" icon={<ThunderboltOutlined />} onClick={startQuiz}>随机测验</Button>
            </Space>
          ) : null
        }
        items={[
          {
            key: 'browse', label: '章节练习',
            children: (
              <div style={{ display: 'flex', gap: 16, flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <Card style={{ width: 220, flexShrink: 0, overflow: 'auto' }} bodyStyle={{ padding: 0 }}>
                  <div style={{ padding: 12 }}>
                    <Input.Search placeholder="搜索..." value={search} onChange={(e) => setSearch(e.target.value)} prefix={<SearchOutlined />} allowClear />
                  </div>
                  {data && Object.entries(data.chapters).map(([ck, ch]) => {
                    let qCount = 0;
                    for (const tp of Object.values(ch.topics)) qCount += tp.questions.length;
                    const isActive = activeChapter === ck;
                    return (
                      <div key={ck} onClick={() => { setActiveChapter(ck); setCurrentQ(0); resetState(); setSearch(''); }}
                        style={{ padding: '10px 16px', cursor: 'pointer', background: isActive ? '#e6f7ff' : '#fff',
                          borderLeft: isActive ? '3px solid #1890ff' : '3px solid transparent', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong style={{ fontSize: 14, color: isActive ? '#1890ff' : '#333' }}>{ch.title}</Text>
                          <Tag>{qCount}题</Tag>
                        </div>
                      </div>
                    );
                  })}
                </Card>
                {/* Question */}
                <Card style={{ flex: 1, overflow: 'auto' }} title={
                  <Space><BookOutlined /><span>{chapter?.title}</span>{qTopic && <Tag>{qTopic}</Tag>}</Space>
                }>
                  {cq ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Text type="secondary">第 {currentQ + 1} / {chapterQuestions.length} 题</Text>
                        <Tag>{cq.type === 'multiple_choice' ? '多选' : cq.type === 'true_false' ? '判断' : '填空'}</Tag>
                      </div>
                      <Progress percent={Math.round(((currentQ + 1) / chapterQuestions.length) * 100)} showInfo={false} style={{ marginBottom: 20 }} />
                      {renderQuestion(cq)}
                      <Divider />
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button onClick={() => { if (currentQ > 0) { setCurrentQ(currentQ - 1); resetState(); } }} disabled={currentQ === 0}>上一题</Button>
                        <Text type="secondary">{currentQ + 1} / {chapterQuestions.length}</Text>
                        <Button type="primary" onClick={() => { if (currentQ < chapterQuestions.length - 1) { setCurrentQ(currentQ + 1); resetState(); } }} disabled={currentQ >= chapterQuestions.length - 1} icon={<RightOutlined />}>下一题</Button>
                      </div>
                    </div>
                  ) : <Empty description="选择左侧章节开始练习" />}
                </Card>
              </div>
            ),
          },
          {
            key: 'quiz', label: quizMode ? `随机测验 ${quizIndex + 1}/${quizQuestions.length}` : '随机测验', disabled: !quizMode,
            children: quizMode && question ? (
              <Card style={{ maxWidth: 800, margin: '0 auto' }}
                title={<Space><ThunderboltOutlined /><span>随机测验</span><Tag color="blue">{quizIndex + 1} / {quizQuestions.length}</Tag></Space>}
                extra={<Space><Tag>{qChapter}</Tag><Tag>{qTopic}</Tag></Space>}>
                <Progress percent={Math.round(((quizIndex + (submitted ? 1 : 0)) / quizQuestions.length) * 100)} showInfo={false} style={{ marginBottom: 20 }} />
                {renderQuestion(question)}
                {submitted && (
                  <div style={{ marginTop: 16, textAlign: 'right' }}>
                    <Button type="primary" size="large" onClick={nextQuiz} icon={<RightOutlined />}>
                      {quizIndex < quizQuestions.length - 1 ? '下一题' : '查看分析报告'}
                    </Button>
                  </div>
                )}
              </Card>
            ) : <Empty description="点击上方「随机测验」按钮开始" />,
          },
        ]}
      />
    </div>
  );
}

function ResultTitle({ correct, total, accuracy }: { correct: number; total: number; accuracy: number }) {
  return (
    <Card style={{ textAlign: 'center', background: accuracy >= 80 ? 'linear-gradient(135deg, #f6ffed, #e6f7ff)' : accuracy >= 60 ? 'linear-gradient(135deg, #fffbe6, #e6f7ff)' : 'linear-gradient(135deg, #fff2f0, #fffbe6)' }}>
      <TrophyOutlined style={{ fontSize: 48, color: accuracy >= 80 ? '#52c41a' : accuracy >= 60 ? '#faad14' : '#ff4d4f' }} />
      <Title level={2} style={{ margin: '12px 0 4px' }}>
        {accuracy >= 80 ? '🎉 表现优秀！' : accuracy >= 60 ? '👍 还不错！' : '💪 继续加油！'}
      </Title>
      <Space size="large">
        <Statistic title="正确" value={correct} suffix={`/ ${total}`} />
        <Statistic title="正确率" value={accuracy} suffix="%" valueStyle={{ color: accuracy >= 60 ? '#52c41a' : '#ff4d4f' }} />
      </Space>
    </Card>
  );
}
