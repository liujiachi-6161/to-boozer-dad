export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, msg: "仅支持POST请求" }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  const body = await req.json();
  const { model, prompt } = body;
  if (!prompt) {
    return new Response(JSON.stringify({ ok: false, msg: "缺少提问内容" }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  let apiUrl, apiKey;
  if (model === "doubao") {
    apiKey = process.env.DOUBAO_KEY;
    const endpoint = process.env.DOUBAO_ENDPOINT;
    if (!apiKey || !endpoint) {
      return new Response(JSON.stringify({ ok: false, msg: "豆包环境变量未配置" }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    apiUrl = endpoint;
  } else if (model === "deepseek") {
    apiKey = process.env.DEEPSEEK_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ ok: false, msg: "DeepSeek环境变量未配置" }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    apiUrl = "https://api.deepseek.com/v1/chat/completions";
  } else {
    return new Response(JSON.stringify({ ok: false, msg: "模型参数错误" }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model === "doubao" ? "ep-20251218xxxx" : "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });
    const data = await res.json();
    if (!data.choices || data.choices.length === 0) {
      return new Response(JSON.stringify({ ok: false, msg: "AI返回为空" }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    const result = data.choices[0].message.content.trim();
    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, msg: "接口请求异常：" + err.message }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}