# myLLM — 高等教育个性化学习资源智能体系统

> 纯前端 + 星火大模型，多智能体协同的个性化学习系统

## 启动

```bash
cd frontend && npm install && npm run dev
```

访问 **http://localhost:5173**

## 架构

```
React 前端
  ├── 画像 Agent (profiler)    → 对话 + 本地关键词提取
  ├── 资源 Agent (generator)   → 6种资源类型 Prompt
  ├── 答疑 Agent (tutor)       → SSE 流式
  ├── 路径 Agent (path)        → 知识图谱拓扑排序
  └── 评估 Agent (evaluator)   → 答题评分
  ↘
Vite Proxy (vite-spark-proxy.js)
  → HMAC 签名 → 星火 Spark X API
```

## 页面

| 页面 | 功能 |
|------|------|
| /login | 登录（localStorage） |
| / | 学习首页仪表盘 |
| /profile | 对话式7维画像构建 |
| /learn | 6种资源 AI 生成 + 浏览 |
| /knowledge-map | D3.js 知识图谱 |
| /tutoring | SSE 流式答疑 |
| /assessments | 学习评估 |
| /analytics | ECharts 分析仪表盘 |

## 技术栈

React 18 + TypeScript + Ant Design + Tailwind + D3.js + ECharts + 星火大模型
