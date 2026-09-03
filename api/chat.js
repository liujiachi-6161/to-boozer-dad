/**
 * AI 对话接口 - 支持豆包（火山方舟）和 DeepSeek 双模型
 * 前端通过 model 参数指定使用哪个模型
 *
 * 环境变量（Vercel后台配置）：
 *   ARK_API_KEY    - 火山方舟 API Key（兼容旧名 DOUBAO_KEY）
 *   ARK_MODEL_ID   - 豆包推理接入点 ID（ep-xxxx，兼容旧名 DOUBAO_ENDPOINT）
 *   ARK_ENDPOINT   - 火山方舟 API URL（可选，默认 https://ark.cn-beijing.volces.com/api/v3/chat/completions）
 *   deepseek-keys  - DeepSeek API Key（兼容旧名 DEEPSEEK_KEY）
 */

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' });
  }

  try {
    const { messages, model } = req.body;
    // 兼容新旧环境变量名
    const arkKey = process.env.ARK_API_KEY || process.env.DOUBAO_KEY;
    const arkModelId = process.env.ARK_MODEL_ID || process.env.DOUBAO_ENDPOINT;
    const arkEndpoint = process.env.ARK_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
    const deepseekKey = process.env['deepseek-keys'] || process.env.DEEPSEEK_KEY;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '缺少对话消息' });
    }

    // 确定使用哪个模型（前端指定，默认豆包）
    const useModel = model || 'doubao';

    let reply;
    let usedModel;

    if (useModel === 'deepseek' && deepseekKey) {
      // 使用 DeepSeek
      reply = await callDeepSeek(messages, deepseekKey);
      usedModel = 'deepseek';
    } else if (arkKey && arkModelId) {
      // 使用豆包（火山方舟）
      reply = await callDoubao(messages, arkKey, arkModelId, arkEndpoint);
      usedModel = 'doubao';
    } else if (deepseekKey) {
      // 豆包没配，降级用 DeepSeek
      reply = await callDeepSeek(messages, deepseekKey);
      usedModel = 'deepseek';
    } else {
      // 都没配置，返回提示
      reply = '⚠️ 尚未配置 AI 模型 API Key。\n\n请在 Vercel 后台 → Settings → Environment Variables 中添加：\n\n【豆包（推荐）】\n- DOUBAO_KEY：火山方舟 API Key\n- DOUBAO_ENDPOINT：推理接入点 ID（ep-开头）\n\n【DeepSeek（备选）】\n- DEEPSEEK_KEY：DeepSeek API Key\n\n配置完成后重新部署即可使用。';
      usedModel = 'none';
    }

    return res.status(200).json({ reply, model: usedModel });
  } catch (error) {
    console.error('AI 接口错误:', error);
    return res.status(500).json({
      error: 'AI 服务暂时不可用：' + (error.message || '未知错误'),
      detail: error.message
    });
  }
};

// ===== 调用豆包模型（火山方舟） =====
async function callDoubao(messages, apiKey, endpointId, apiUrl) {
  const url = apiUrl || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: endpointId,
      messages: messages,
      temperature: 0.7,
      max_tokens: 4000
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const errMsg = data.error?.message || data.error?.code || response.statusText;
    throw new Error(`豆包 API 错误 (${response.status}): ${errMsg}`);
  }

  return data.choices[0].message.content;
}

// ===== 调用 DeepSeek 模型 =====
async function callDeepSeek(messages, apiKey) {
  const url = 'https://api.deepseek.com/chat/completions';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.7,
      max_tokens: 4000
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const errMsg = data.error?.message || response.statusText;
    throw new Error(`DeepSeek API 错误 (${response.status}): ${errMsg}`);
  }

  return data.choices[0].message.content;
}
