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

const QUESTION_FLOW = [
  { dim: 'knowledge_base', question: '请告诉我你的专业、年级，学过哪些编程语言（如C、Python等），对C++和面向对象编程有多少了解？' },
  { dim: 'cognitive_style', question: '学习新知识时你喜欢哪种方式？看视频、读文档、动手写代码、还是听课？' },
  { dim: 'format_preferences', question: '你更喜欢哪种学习材料？课程文档、思维导图、练习题、视频动画、还是代码案例？' },
  { dim: 'error_patterns', question: '哪些类型的题目你比较容易出错？语法细节、内存管理、面向对象设计、还是指针引用？' },
  { dim: 'learning_pace', question: '你的学习节奏怎样？快速浏览抓重点，还是按部就班深入？' },
  { dim: 'motivation_profile', question: '学习C++的主要动力是什么？找工作、做项目、竞赛、还是学业要求？' },
  { dim: 'complexity_preference', question: '希望内容难度？入门科普、标准大学课程、还是进阶研究？' },
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
  const oldComp = calcCompletion(profile);
  const idx = Math.min(Math.round(oldComp * 7), QUESTION_FLOW.length - 1);

  // Extract keywords from user message for current dimension
  extractFromMessage(message, QUESTION_FLOW[idx].dim, profile);

  // Force-fill current dimension if keyword extraction failed
  forceFillDimension(QUESTION_FLOW[idx].dim, profile);

  // Recalculate — always advances at least 1 dimension per turn
  const rawComp = calcCompletion(profile);
  const newComp = Math.min(1, Math.max(oldComp + (1 / 7), rawComp));
  profile.profile_completion = newComp;
  profile.conversation_history = [
    ...(profile.conversation_history || []).slice(-20),
    { role: 'user', content: message.slice(0, 200) },
  ];

  // Next question
  const nextIdx = Math.min(Math.round(newComp * 7), QUESTION_FLOW.length - 1);
  const allDims = QUESTION_FLOW.map((q) => q.dim);
  const completedDims = allDims.slice(0, nextIdx);

  const prompt = `你是myLLM的学习画像构建助手。已了解: ${completedDims.join('、') || '无'}。当前引导学生回答: ${QUESTION_FLOW[nextIdx].question}。请根据学生回复给2-3句友好回应然后自然提问。只输出纯文字。`;
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
    reply = `谢谢分享！${QUESTION_FLOW[nextIdx].question}`;
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
