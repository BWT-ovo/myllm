/**
 * 前端多智能体逻辑 —— 通过不同 Prompt 调用星火 API 实现
 *
 * Agent 角色:
 * - profiler: 画像构建对话 + 本地关键词提取
 * - generator: 6种资源类型生成
 * - tutor: 答疑
 * - evaluator: 评估
 */

import { sparkChat, sparkChatStream } from './sparkClient';
import { getProfile, saveProfile, type Profile } from './storage';

// ==================== 画像构建 Agent ====================

// 精简为4轮有效问题，每轮收集1-2个维度
const QUESTION_FLOW = [
  { dim: 'knowledge_base', question: '请简单介绍你的学习背景：专业、年级、学过哪些编程语言？对C++了解多少？' },
  { dim: 'cognitive_style', question: '你平时喜欢怎么学新知识？看视频、读文档、还是动手写代码？更喜欢哪种学习材料？' },
  { dim: 'error_patterns', question: '之前学编程时，哪些方面容易出错或觉得难？语法细节、指针内存、面向对象设计、还是算法逻辑？你的学习节奏是偏快还是偏慢？' },
  { dim: 'motivation_profile', question: '你学C++主要是为了什么？找工作、做项目、应付考试、还是兴趣？希望内容简单入门还是深入进阶？' },
];

function extractFromMessage(msg: string, dim: string, profile: Profile) {
  const m = msg.toLowerCase();

  if (dim === 'knowledge_base') {
    const techs = ['c++', 'c语言', 'c', 'python', 'java', '数据结构', '指针', '内存管理', '面向对象', '继承', '多态', 'stl', '模板'];
    for (const t of techs) {
      if (m.includes(t)) profile.knowledge_base[t] = 0.8;
    }
  }
  if (dim === 'cognitive_style') {
    if (/视频|看|b站/.test(m)) profile.cognitive_style.visual = 0.8;
    if (/读|书|文档|教材/.test(m)) profile.cognitive_style.reading = 0.8;
    if (/代码|编程|动手|实践|写|敲|项目/.test(m)) profile.cognitive_style.kinesthetic = 0.8;
    if (/听|讲|课|音频/.test(m)) profile.cognitive_style.auditory = 0.8;
  }
  if (dim === 'format_preferences') {
    const map: Record<string, string> = {
      '文档': 'course_doc', '讲义': 'course_doc',
      '导图': 'mind_map', '脑图': 'mind_map', '思维导图': 'mind_map',
      '题': 'exercise', '练习': 'exercise',
      '阅读': 'extended_reading', '论文': 'extended_reading',
      '视频': 'multimodal', '动画': 'multimodal',
      '代码': 'code_practice', '项目': 'code_practice',
    };
    for (const [kw, tp] of Object.entries(map)) {
      if (m.includes(kw) && !profile.format_preferences.preferred_types.includes(tp)) {
        profile.format_preferences.preferred_types.push(tp);
      }
    }
  }
  if (dim === 'error_patterns') {
    if (/数学|推导|公式/.test(m)) profile.error_patterns.push({ error_type: 'math', frequency: 0.7 });
    if (/算法|理解|理论/.test(m)) profile.error_patterns.push({ error_type: 'concept', frequency: 0.6 });
    if (/代码|调试|bug/.test(m)) profile.error_patterns.push({ error_type: 'coding', frequency: 0.6 });
  }
  if (dim === 'learning_pace') {
    if (/快|快速|迅速/.test(m)) profile.learning_pace = 3;
    else if (/慢|仔细|逐步|按部就班/.test(m)) profile.learning_pace = 1;
    else profile.learning_pace = 2;
  }
  if (dim === 'motivation_profile') {
    if (/工作|就业|找/.test(m)) profile.motivation_profile.career = 0.8;
    if (/科研|研究|学术|论文/.test(m)) profile.motivation_profile.research = 0.8;
    if (/兴趣|爱好|好奇/.test(m)) profile.motivation_profile.interest = 0.8;
    if (/比赛|竞赛/.test(m)) profile.motivation_profile.competition = 0.7;
    if (/课程|学分|考试/.test(m)) profile.motivation_profile.coursework = 0.7;
  }
  if (dim === 'complexity_preference') {
    if (/入门|基础|初级|简单|新手/.test(m)) profile.complexity_preference = 'beginner';
    else if (/进阶|高级|深入|研究|难/.test(m)) profile.complexity_preference = 'advanced';
    else profile.complexity_preference = 'intermediate';
  }
}

function calcCompletion(p: Profile): number {
  let s = 0;
  if (Object.keys(p.knowledge_base).length > 0) s++;
  if (Object.values(p.cognitive_style).some((v) => v > 0.5)) s++;
  if (p.error_patterns.length > 0) s++;
  if (p.learning_pace > 0) s++;
  if (Object.keys(p.motivation_profile).length > 0) s++;
  if (p.format_preferences.preferred_types.length > 0) s++;
  // complexity_preference always has a value, count as 7th dim
  s++;
  return Math.min(1, s / 7);
}

export async function profilerChat(
  message: string,
  history: Array<{ role: string; content: string }>
): Promise<{ reply: string; completion: number; stage: string }> {
  const profile = getProfile();

  // Extract info from user message for ALL dimensions
  for (const q of QUESTION_FLOW) {
    extractFromMessage(message, q.dim, profile);
  }
  // Also try the non-question-flow dimensions
  extractFromMessage(message, 'format_preferences', profile);
  extractFromMessage(message, 'learning_pace', profile);
  extractFromMessage(message, 'complexity_preference', profile);

  // Calculate completion based ONLY on actually extracted data (no auto-fill)
  const newComp = calcCompletion(profile);
  profile.profile_completion = newComp;
  profile.conversation_history = [
    ...(profile.conversation_history || []).slice(-20),
    { role: 'user', content: message.slice(0, 200) },
  ];

  // Find which dimensions are still missing or weak
  const getDimScore = (dim: string) => {
    if (dim === 'knowledge_base') return Object.keys(profile.knowledge_base).length > 0 ? 1 : 0;
    if (dim === 'cognitive_style') return Object.values(profile.cognitive_style).some((v) => v > 0.5) ? 1 : 0;
    if (dim === 'format_preferences') return (profile.format_preferences?.preferred_types || []).length > 0 ? 1 : 0;
    if (dim === 'error_patterns') return profile.error_patterns.length > 0 ? 1 : 0;
    if (dim === 'learning_pace') return profile.learning_pace > 0 ? 1 : 0;
    if (dim === 'motivation_profile') return Object.keys(profile.motivation_profile).length > 0 ? 1 : 0;
    if (dim === 'complexity_preference') return 1;
    return 0;
  };

  const allDims = ['knowledge_base', 'cognitive_style', 'format_preferences', 'error_patterns', 'learning_pace', 'motivation_profile', 'complexity_preference'];
  const missing = allDims.filter((d) => getDimScore(d) === 0);
  const completed = allDims.filter((d) => getDimScore(d) === 1);

  // Build prompt based on what's still missing
  let nextQuestion = '';
  if (missing.length === 0) {
    nextQuestion = '画像已完整，请对学生说一些鼓励的话，并总结他的学习特点。';
  } else if (missing.includes('knowledge_base')) {
    nextQuestion = '请先了解学生的学习背景：专业、年级、学过什么语言、对C++了解多少？';
  } else if (missing.includes('cognitive_style') || missing.includes('format_preferences')) {
    nextQuestion = '请了解学生喜欢的学习方式（看视频/读文档/写代码）和偏好的学习材料类型（文档/思维导图/练习题/视频/代码案例）。';
  } else if (missing.includes('error_patterns') || missing.includes('learning_pace')) {
    nextQuestion = '请了解学生容易出错的方面（语法/指针/面向对象/算法）和学习节奏（快/中/慢）。';
  } else if (missing.includes('motivation_profile') || missing.includes('complexity_preference')) {
    nextQuestion = '请了解学生的学习动机（就业/科研/兴趣/考试）和难度偏好（入门/标准/进阶）。';
  }

  const prompt = `你是myLLM的学习画像构建助手。
已了解: ${completed.join('、') || '无'}
还需了解: ${missing.join('、') || '无'}

${nextQuestion}
请根据学生回复给2-3句友好回应，然后自然地问下一个需要了解的问题。如果画像已完整，就总结学生的特点并祝贺。只输出纯文字。`;

  const llmMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: prompt },
    ...history.slice(-4).map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
    { role: 'user', content: message },
  ];

  let reply: string;
  try {
    reply = await sparkChat(llmMessages, { temperature: 0.7, maxTokens: 400 });
    reply = reply.replace(/```[\s\S]*?```/g, '').replace(/[*#`]/g, '').replace(/\n{3,}/g, '\n\n').trim();
  } catch {
    reply = missing.length === 0
      ? '画像已完整！根据你的回答，我已经了解了你的学习特点。你可以前往学习中心开始个性化学习了。'
      : `谢谢分享！接下来我想了解：${missing[0] || '更多关于你的学习情况'}。`;
  }

  profile.conversation_history.push({ role: 'assistant', content: reply.slice(0, 200) });
  saveProfile(profile);

  return {
    reply,
    completion: newComp,
    stage: newComp >= 0.85 ? 'complete' : newComp >= 0.5 ? 'nearly_done' : 'conversation',
  };
}

/** 保证每轮对话当前维度一定有数据 */
function forceFillDimension(dim: string, profile: Profile) {
  if (dim === 'knowledge_base' && Object.keys(profile.knowledge_base).length === 0) {
    profile.knowledge_base['C++基础'] = 0.5;
  }
  if (dim === 'cognitive_style' && !Object.values(profile.cognitive_style).some((v) => v > 0.5)) {
    profile.cognitive_style = { visual: 0.6, auditory: 0.4, reading: 0.6, kinesthetic: 0.6 };
  }
  if (dim === 'error_patterns' && profile.error_patterns.length === 0) {
    profile.error_patterns.push({ error_type: 'general', frequency: 0.5 });
  }
  if (dim === 'learning_pace' && profile.learning_pace === 0) {
    profile.learning_pace = 2;
  }
  if (dim === 'motivation_profile' && Object.keys(profile.motivation_profile).length === 0) {
    profile.motivation_profile = { interest: 0.7 };
  }
  if (dim === 'format_preferences' && profile.format_preferences.preferred_types.length === 0) {
    profile.format_preferences.preferred_types = ['course_doc'];
  }
  // complexity_preference always counts in calcCompletion, no force-fill needed
}


// ==================== 资源生成 Agent ====================

const GEN_PROMPTS: Record<string, string> = {
  course_doc: `你是AI课程内容生成专家。直接输出Markdown文档：# 标题 → ## 小节 → LaTeX公式 → **粗体**关键词。禁止用\`\`\`包裹输出。`,
  mind_map: `生成思维导图。先写文字说明，再用\`\`\`mermaid代码块输出mindmap。`,
  exercise: `生成练习题。直接输出: # 练习题 → ## 一、单选题 → **1. 题目** → A-D选项 → > 答案+解析。难度梯度40%+40%+20%。禁止用\`\`\`包裹整个输出。`,
  extended_reading: `推荐扩展阅读材料。输出格式: # 扩展阅读 → ## 阅读指导 → ### 📄 论文 → 列表推荐，附简介和难度。`,
  multimodal: `生成多模态素材方案。：## 🎬 视频脚本 → 表格(场景|时间|画面|旁白) → ## 🖼️ 图解描述。`,
  code_practice: `生成C++代码案例。# 代码实践 → ## 背景 → ## 任务代码(TODO) → ## 参考解答 → ## 测试用例。禁止用\`\`\`包裹整个输出。`,
};

const TYPE_LABELS: Record<string, string> = {
  course_doc: '课程文档', mind_map: '思维导图', exercise: '练习题',
  extended_reading: '扩展阅读', multimodal: '多模态素材', code_practice: '代码案例',
};

export async function generateResource(
  resourceType: string,
  topic: string,
  difficulty: string
): Promise<{ id: string; title: string; content: { markdown: string }; resource_type: string }> {
  const systemPrompt = GEN_PROMPTS[resourceType] || GEN_PROMPTS.course_doc;

  const reply = await sparkChat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `请为「C++面向对象程序设计 - ${topic}」生成一份${TYPE_LABELS[resourceType] || resourceType}，难度: ${difficulty}，语言中文。` },
  ], { temperature: 0.7, maxTokens: 2048 });

  // Clean wrapping fences
  let cleaned = reply.trim();
  cleaned = cleaned.replace(/^```(?:markdown|json|md)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();

  return {
    id: crypto.randomUUID(),
    title: `${topic} - ${TYPE_LABELS[resourceType] || resourceType}`,
    resource_type: resourceType,
    content: { markdown: cleaned },
  };
}

// ==================== 答疑 Agent ====================

export async function tutorChat(
  question: string,
  _history: Array<{ role: string; content: string }>,
  onChunk: (text: string) => void
): Promise<string> {
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: '你是C++编程学习助手，用中文回答「C++面向对象程序设计」课程问题。使用Markdown格式（标题、列表、C++代码块），回答准确有深度。' },
    { role: 'user', content: question },
  ];

  return sparkChatStream(messages, onChunk, { temperature: 0.6, maxTokens: 2048 });
}

// ==================== 学习路径生成 ====================

export function generateLearningPath(): {
  title: string;
  node_sequence: Array<{ node_id: string; order: number; title: string; status: string; estimated_hours: number }>;
  total_hours: number;
} {
  const nodes = [
    'C++基础回顾', '类与对象', '继承与派生', '多态与虚函数',
    '运算符重载', '模板与泛型', 'STL标准库', '异常处理', '文件IO与流', '设计模式入门',
  ];
  return {
    title: 'C++面向对象程序设计 - 个性化学习路径',
    node_sequence: nodes.map((t, i) => ({
      node_id: `node-${i}`,
      order: i + 1,
      title: t,
      status: 'pending',
      estimated_hours: 1,
    })),
    total_hours: nodes.length,
  };
}
