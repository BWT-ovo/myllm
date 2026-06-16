/**
 * 星火 API 客户端（通过 Vite 代理，HMAC 签名在服务端完成）
 *
 * Vite 插件 vite-spark-proxy.js 拦截 /api/spark 请求，
 * 添加 HMAC 签名后转发到星火服务器，解决浏览器 Date header 限制。
 */

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 本地开发：Vite 代理到 /api/spark
// Vercel 部署：同域 /api/spark
// GitHub Pages：需要改为 https://你的项目.vercel.app/api/spark
const ENDPOINT = window.location.hostname === 'localhost'
  ? '/api/spark'
  : '/api/spark'; // 部署在 Vercel 时自动同域

export async function sparkChat(
  messages: ChatMessage[],
  opts?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const body = JSON.stringify({
    model: 'spark-x',
    messages,
    temperature: opts?.temperature ?? 0.7,
    max_tokens: opts?.maxTokens ?? 2048,
    stream: false,
  });

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Spark API ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function sparkChatStream(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  opts?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const body = JSON.stringify({
    model: 'spark-x',
    messages,
    temperature: opts?.temperature ?? 0.7,
    max_tokens: opts?.maxTokens ?? 2048,
    stream: true,
  });

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Spark API ${res.status}: ${errText.slice(0, 300)}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const s = line.trim();
      if (!s.startsWith('data:')) continue;
      const dataStr = s.slice(5).trim();
      if (dataStr === '[DONE]') continue;
      try {
        const data = JSON.parse(dataStr);
        const content = data.choices?.[0]?.delta?.content;
        if (content) {
          fullText += content;
          onChunk(content);
        }
      } catch { /* skip */ }
    }
  }
  return fullText;
}
