/**
 * Vercel Serverless Function — 星火 API 代理
 *
 * 前端发请求到这个函数 → 加 HMAC 签名 → 转发到星火 → 返回结果
 * 解决浏览器无法设置 Date 头的限制。
 *
 * 部署后会得到地址: https://你的项目.vercel.app/api/spark
 */

const SPARK_HOST = 'spark-api-open.xf-yun.com';
const SPARK_PATH = '/x2/chat/completions';
const SPARK_API_KEY = process.env.SPARK_API_KEY || '';
const SPARK_API_SECRET = process.env.SPARK_API_SECRET || '';
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  // 只接受 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  try {
    // 1. 计算 body SHA-256 digest
    const bodyHash = crypto.createHash('sha256').update(body).digest('base64');
    const digest = `SHA-256=${bodyHash}`;

    // 2. RFC 1123 时间
    const date = new Date().toUTCString();

    // 3. 签名字符串
    const signStr = [
      `host: ${SPARK_HOST}`,
      `date: ${date}`,
      `POST ${SPARK_PATH} HTTP/1.1`,
      `digest: ${digest}`,
    ].join('\n');

    // 4. HMAC-SHA256 签名
    const sig = crypto.createHmac('sha256', SPARK_API_SECRET).update(signStr).digest('base64');

    // 5. 构建 Authorization
    const auth = `api_key="${SPARK_API_KEY}", algorithm="hmac-sha256", headers="host date request-line digest", signature="${sig}"`;

    // 6. 转发到星火
    const isStream = body.includes('"stream":true');
    const resp = await fetch(`https://${SPARK_HOST}${SPARK_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': SPARK_HOST,
        'Date': date,
        'Digest': digest,
        'Authorization': auth,
      },
      body,
    });

    // 7. 流式响应：透传 SSE
    if (isStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
      return res.end();
    }

    // 8. 普通响应
    const text = await resp.text();
    res.setHeader('Content-Type', 'application/json');
    return res.status(resp.status).send(text);

  } catch (err) {
    return res.status(502).json({ error: `Spark proxy error: ${err.message}` });
  }
};

