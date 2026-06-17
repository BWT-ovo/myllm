/**
 * localStorage 数据层 —— 替代 SQLite + FastAPI
 *
 * 数据结构:
 * - profile: 学习画像
 * - resources: 生成的资源列表
 * - learningPath: 学习路径
 * - chatHistory: 答疑对话记录
 * - assessments: 评估记录
 */

const KEYS = {
  profile: 'myllm_profile',
  resources: 'myllm_resources',
  learningPath: 'myllm_path',
  chatHistory: 'myllm_chats',
  assessments: 'myllm_assessments',
  user: 'myllm_user',
};

// ==================== 用户 ====================
export function getUser(): { username: string } | null {
  const raw = localStorage.getItem(KEYS.user);
  return raw ? JSON.parse(raw) : null;
}
export function setUser(u: { username: string }) {
  localStorage.setItem(KEYS.user, JSON.stringify(u));
}

// ==================== 画像 ====================
export interface Profile {
  knowledge_base: Record<string, number>;
  cognitive_style: Record<string, number>;
  error_patterns: Array<{ error_type: string; frequency: number }>;
  learning_pace: number;
  motivation_profile: Record<string, number>;
  format_preferences: { preferred_types: string[] };
  complexity_preference: string;
  confidence_scores: Record<string, number>;
  conversation_history: Array<{ role: string; content: string }>;
  profile_completion: number;
}

const DEFAULT_PROFILE: Profile = {
  knowledge_base: {},
  cognitive_style: { visual: 0.5, auditory: 0.5, reading: 0.5, kinesthetic: 0.5 },
  error_patterns: [],
  learning_pace: 0,
  motivation_profile: {},
  format_preferences: { preferred_types: [] },
  complexity_preference: 'intermediate',
  confidence_scores: {},
  conversation_history: [],
  profile_completion: 0,
};

export function getProfile(): Profile {
  const raw = localStorage.getItem(KEYS.profile);
  return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : { ...DEFAULT_PROFILE };
}
export function saveProfile(p: Profile) {
  localStorage.setItem(KEYS.profile, JSON.stringify(p));
}

// ==================== 资源 ====================
export interface Resource {
  id: string;
  title: string;
  resource_type: string;
  difficulty: string;
  knowledge_node_id: string;
  content: { markdown: string };
  created_at: string;
}

export function getResources(): Resource[] {
  const raw = localStorage.getItem(KEYS.resources);
  return raw ? JSON.parse(raw) : [];
}
export function addResource(r: Resource) {
  const list = getResources();
  list.unshift(r);
  localStorage.setItem(KEYS.resources, JSON.stringify(list));
}

// ==================== 学习路径 ====================
export interface LearningPath {
  title: string;
  node_sequence: Array<{
    node_id: string; order: number; title: string;
    status: string; estimated_hours: number;
  }>;
  total_hours: number;
}

export function getLearningPath(): LearningPath | null {
  const raw = localStorage.getItem(KEYS.learningPath);
  return raw ? JSON.parse(raw) : null;
}
export function saveLearningPath(p: LearningPath) {
  localStorage.setItem(KEYS.learningPath, JSON.stringify(p));
}

// ==================== 答疑记录 ====================
export interface ChatRecord {
  id: string;
  title: string;
  messages: Array<{ role: string; content: string }>;
  created_at: string;
}
export function getChatHistory(): ChatRecord[] {
  const raw = localStorage.getItem(KEYS.chatHistory);
  return raw ? JSON.parse(raw) : [];
}
export function addChatRecord(r: ChatRecord) {
  const list = getChatHistory();
  list.unshift(r);
  localStorage.setItem(KEYS.chatHistory, JSON.stringify(list.slice(0, 50)));
}

// ==================== 评估 ====================
export interface Assessment {
  id: string;
  type: string;
  score: number;
  max_score: number;
  answers: Record<string, unknown>;
  feedback: Record<string, unknown>;
  created_at: string;
  sessionId?: string;
}
export function getAssessments(): Assessment[] {
  const raw = localStorage.getItem(KEYS.assessments);
  return raw ? JSON.parse(raw) : [];
}
export function addAssessment(a: Assessment) {
  const list = getAssessments();
  list.unshift(a);
  localStorage.setItem(KEYS.assessments, JSON.stringify(list));
}

// ==================== 学习进度 ====================
export function getMasteredTopics(): string[] {
  const raw = localStorage.getItem('myllm_mastered');
  return raw ? JSON.parse(raw) : [];
}
export function setMasteredTopics(topics: string[]) {
  localStorage.setItem('myllm_mastered', JSON.stringify(topics));
}
export function getLearningHours(): number {
  return parseFloat(localStorage.getItem('myllm_hours') || '0');
}
export function setLearningHours(hours: number) {
  localStorage.setItem('myllm_hours', hours.toString());
}

// ==================== 学习计划 ====================
export function getSavedPlan(): any | null {
  const raw = localStorage.getItem('myllm_plan');
  return raw ? JSON.parse(raw) : null;
}
export function setSavedPlan(plan: any) {
  localStorage.setItem('myllm_plan', JSON.stringify(plan));
}
