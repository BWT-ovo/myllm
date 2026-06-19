/**
 * Vite 插件：代理星火 API 请求并在服务端完成 HMAC 签名
 *
 * 解决浏览器无法设置 Date header（forbidden header）的问题。
 * 浏览器发送普通 POST → 此插件计算签名 → 转发到星火 → 返回响应
 */
import crypto from 'crypto';

const SPARK_HOST = 'spark-api-open.xf-yun.com';
const SPARK_PATH = '/x2/chat/completions';
const SPARK_APP_ID = process.env.SPARK_APP_ID;
const SPARK_API_KEY = process.env.SPARK_API_KEY;
const SPARK_API_SECRET = process.env.SPARK_API_SECRET;

function buildSparkHeaders(body) {
  const date = new Date().toUTCString();
  const method = 'POST';

  // body digest: base64(sha256(body))
  const bodyHash = crypto.createHash('sha256').update(body).digest();
  const bodyDigest = bodyHash.toString('base64');
  const digestHeader = `SHA-256=${bodyDigest}`;

  // signing string
  const signingString = [
    `host: ${SPARK_HOST}`,
    `date: ${date}`,
    `${method} ${SPARK_PATH} HTTP/1.1`,
    `digest: ${digestHeader}`,
  ].join('\n');

  // HMAC-SHA256 signature
  const signature = crypto.createHmac('sha256', SPARK_API_SECRET)
    .update(signingString)
    .digest('base64');

  // Authorization（注意：HTTP REST API 用明文，不 base64 编码！）
  const authorization = `api_key="${SPARK_API_KEY}", algorithm="hmac-sha256", headers="host date request-line digest", signature="${signature}"`;

  return {
    'Content-Type': 'application/json',
    'Host': SPARK_HOST,
    'Date': date,
    'Digest': digestHeader,
    'Authorization': authorization,
  };
}

export default function sparkProxy() {
  return {
    name: 'spark-proxy',
    configureServer(server) {
      // 拦截 /api/spark 的 POST 请求
      server.middlewares.use('/api/spark', async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405);
          res.end('Method Not Allowed');
          return;
        }

        // 读取请求体
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const body = Buffer.concat(chunks).toString();

        try {
          // 计算签名并转发到星火（Node 18+ 内置 fetch）
          const headers = buildSparkHeaders(body);

          const sparkRes = await fetch(`https://${SPARK_HOST}${SPARK_PATH}`, {
            method: 'POST',
            headers,
            body,
          });

          // 透传响应头
          const respHeaders = {};
          sparkRes.headers.forEach((v, k) => {
            respHeaders[k] = v;
          });
          res.writeHead(sparkRes.status, respHeaders);

          // 流式或普通响应
          if (body.includes('"stream":true')) {
            // SSE 流式 — 直接 pipe
            const reader = sparkRes.body;
            for await (const chunk of reader) {
              res.write(chunk);
            }
            res.end();
          } else {
            const text = await sparkRes.text();
            res.end(text);
          }
        } catch (err) {
          res.writeHead(502);
          res.end(JSON.stringify({ error: `Spark proxy error: ${err.message}` }));
        }
      });
    },
  };
}

