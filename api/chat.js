/**
 * AI 对话接口 - 支持豆包（火山方舟）和 DeepSeek 双模型
 * 前端通过 model 参数指定使用哪个模型
 *
 * 接口格式（与前端 aiChat.js 匹配）：
 *   请求：POST { model: "doubao"|"deepseek", prompt: "提问内容" }
 *   成功：{ ok: true, result: "AI回答" }
 *   失败：{ ok: false, msg: "错误信息" }
 *
 * 环境变量（Vercel后台配置，新旧名兼容）：
 *   ARK_API_KEY    / DOUBAO_KEY      - 火山方舟 API Key
 *   ARK_MODEL_ID   / DOUBAO_ENDPOINT - 豆包推理接入点 ID（ep-xxxx）
 *   ARK_ENDPOINT                      - 火山方舟 API URL（可选，有默认值）
 *   deepseek-keys  / DEEPSEEK_KEY    - DeepSeek API Key
 */
module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: false, msg: '仅支持POST请求' });
  }

  try {
    const { model, prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(200).json({ ok: false, msg: '缺少提问内容' });
    }

    // 兼容新旧环境变量名
    const arkKey = process.env.ARK_API_KEY || process.env.DOUBAO_KEY;
    const arkModelId = process.env.ARK_MODEL_ID || process.env.DOUBAO_ENDPOINT;
    const arkEndpoint = process.env.ARK_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
    const deepseekKey = process.env['deepseek-keys'] || process.env.DEEPSEEK_KEY;

    // 确定使用哪个模型（前端指定，默认豆包）
    const useModel = model || 'doubao';
    let result = '';

    if (useModel === 'deepseek' && deepseekKey) {
      // 使用 DeepSeek
      result = await callDeepSeek(prompt, deepseekKey);
    } else if (useModel === 'doubao' && arkKey && arkModelId) {
      // 使用豆包（火山方舟）
      result = await callDoubao(prompt, arkKey, arkModelId, arkEndpoint);
    } else if (useModel === 'deepseek' && !deepseekKey) {
      return res.status(200).json({ ok: false, msg: 'DeepSeek环境变量未配置' });
    } else if (useModel === 'doubao' && (!arkKey || !arkModelId)) {
      // 豆包没配，降级用 DeepSeek（如果有）
      if (deepseekKey) {
        result = await callDeepSeek(prompt, deepseekKey);
      } else {
        return res.status(200).json({ ok: false, msg: '豆包环境变量未配置（ARK_API_KEY / ARK_MODEL_ID）' });
      }
    } else {
      return res.status(200).json({ ok: false, msg: '模型参数错误' });
    }

    return res.status(200).json({ ok: true, result });
  } catch (error) {
    console.error('AI 接口错误:', error);
    return res.status(200).json({ ok: false, msg: 'AI服务暂时不可用：' + (error.message || '未知错误') });
  }
};

// ===== 调用豆包模型（火山方舟） =====
async function callDoubao(prompt, apiKey, endpointId, apiUrl) {
  const url = apiUrl || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: endpointId,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000
    })
  });
  const data = await response.json();
  if (!response.ok) {
    const errMsg = data.error?.message || data.error?.code || response.statusText;
    throw new Error(`豆包API错误(${response.status}): ${errMsg}`);
  }
  if (!data.choices || data.choices.length === 0) {
    throw new Error('豆包返回为空');
  }
  return data.choices[0].message.content.trim();
}

// ===== 调用 DeepSeek 模型 =====
async function callDeepSeek(prompt, apiKey) {
  const url = 'https://api.deepseek.com/chat/completions';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000
    })
  });
  const data = await response.json();
  if (!response.ok) {
    const errMsg = data.error?.message || response.statusText;
    throw new Error(`DeepSeek API错误(${response.status}): ${errMsg}`);
  }
  if (!data.choices || data.choices.length === 0) {
    throw new Error('DeepSeek返回为空');
  }
  return data.choices[0].message.content.trim();
}
