export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, msg: "仅支持POST请求" });
  }
  try {
    const { messages } = req.body;
    const systemPrompt = {
      role:"system",
      content:"你是一名小学体育助教。你的工作范围仅限于体育课相关内容：撰写体育教案、设计课堂游戏与体能练习、课堂点名管理、运动安全提示、学生体能发展建议。只围绕体育教学给出务实有效详细的文字方案，询问时给出职业有关的精准回答,不含糊不清,专注教学内容本身，执行任务时若遇到不明白,要耐心的一步一步引导,不要额外生成程序、页面类内容。"
    };
    const sendList = [systemPrompt, ...messages];

    const apiKey = process.env.DEEPSEEK_APIKEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, msg:"缺少DeepSeek密钥" });
    }
    const resp = await fetch("https://api.deepseek.com/v1/chat/completions",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":`Bearer ${apiKey}`
      },
      body:JSON.stringify({
        model:"deepseek-chat",
        messages:sendList,
        temperature:0.7
      })
    });
    const data = await resp.json();
    if(!data.choices||data.choices.length===0){
      return res.status(500).json({ok:false,msg:"DeepSeek返回为空"});
    }
    const resultContent = data.choices[0].message.content.trim();
    res.status(200).json({ok:true,result:resultContent});
  } catch(err){
    res.status(500).json({ok:false,msg:err.message});
  }
}