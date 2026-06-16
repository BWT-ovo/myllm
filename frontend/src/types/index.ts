// ============================================================
// Core Type Definitions for myLLM Frontend
// ============================================================

// User & Auth
export interface User {
  id: string;
  username: string;
  email: string | null;
  role: 'student' | 'teacher' | 'admin';
  avatar_url: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Student Profile (7 dimensions)
export interface StudentProfile {
  id: string;
  user_id: string;
  knowledge_base: Record<string, number>;
  cognitive_style: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    reading: number;
  };
  error_patterns: Array<{
    topic_id: string;
    error_type: string;
    frequency: number;
  }>;
  learning_pace: number;
  motivation_profile: Record<string, number>;
  format_preferences: {
    preferred_types: string[];
    history: Array<{ type: string; count: number }>;
  };
  complexity_preference: 'beginner' | 'intermediate' | 'advanced';
  confidence_scores: Record<string, number>;
  profile_completion: number;
  created_at: string;
  updated_at: string;
}

// Knowledge Graph
export interface KnowledgeNode {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  depth: number;
  estimated_hours: number;
  tags: string[];
  prerequisites: Array<{ node_id: string; required_level: number }>;
  learning_objectives: string[];
}

export interface KnowledgeEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relation_type: 'prerequisite_of' | 'related_to' | 'part_of' | 'extends';
  weight: number;
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

// Learning Resources
export type ResourceType =
  | 'course_doc'
  | 'mind_map'
  | 'exercise'
  | 'extended_reading'
  | 'multimodal'
  | 'code_practice';

export interface LearningResource {
  id: string;
  knowledge_node_id: string;
  title: string;
  resource_type: ResourceType;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: Record<string, unknown>;
  metadata: Record<string, unknown>;
  generated_by: string;
  citation_sources: Array<{
    kb_chunk_id: string;
    title: string;
    relevance_score: number;
  }>;
  view_count: number;
  avg_rating: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// Learning Path
export interface LearningPath {
  id: string;
  user_id: string;
  course_id: string;
  title: string;
  status: 'active' | 'completed' | 'paused';
  node_sequence: Array<{
    node_id: string;
    order: number;
    status: string;
    assigned_resources: string[];
    estimated_hours: number;
    started_at?: string;
    completed_at?: string;
    score?: number;
  }>;
  total_hours: number;
  progress: number;
  generated_by: string;
}

// Chat
export interface ChatSession {
  id: string;
  title: string;
  session_type: 'profiling' | 'tutoring' | 'general';
  is_active: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'agent';
  content: string;
  content_type: 'text' | 'markdown' | 'resource_card' | 'assessment';
  agent_name?: string;
  citations: Array<{
    source: string;
    title: string;
    excerpt: string;
  }>;
  metadata: Record<string, unknown>;
}

// Assessment
export interface Assessment {
  id: string;
  user_id: string;
  assessment_type: string;
  score?: number;
  max_score?: number;
  answers: Record<string, unknown>;
  feedback: Record<string, unknown>;
  created_at: string;
}

// SSE Streaming Events
export interface SSEProgressEvent {
  type: 'progress';
  stage: string;
  message: string;
  progress: number;
}

export interface SSEChunkEvent {
  type: 'chunk';
  content: string;
  index: number;
}

export interface SSEResourceEvent {
  type: 'resource_ready';
  resource_id: string;
  preview: Record<string, unknown>;
}

export interface SSEDoneEvent {
  type: 'complete';
  resource_id?: string;
  citations: Array<Record<string, unknown>>;
}

export interface SSEErrorEvent {
  type: 'error';
  code: string;
  message: string;
}

export type SSEEvent =
  | SSEProgressEvent
  | SSEChunkEvent
  | SSEResourceEvent
  | SSEDoneEvent
  | SSEErrorEvent;
