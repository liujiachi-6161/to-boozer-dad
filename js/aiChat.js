const AiChat = (() => {
  const $ = s => document.querySelector(s);
  let lastAiReply = "";
  function bindEvents() {
    $("#sendChatBtn").addEventListener("click", sendMessage);
    $("#saveLastAiBtn").addEventListener("click", saveLastReplyToLog);
  }
  async function sendMessage() {
    const prompt = $("#chatInput").value.trim();
    if (!prompt) return alert("请输入提问内容");
    const chatBox = $("#chatBox");
    // 用户消息渲染
    const userMsgDiv = document.createElement("div");
    userMsgDiv.className = "msg user";
    userMsgDiv.innerText = prompt;
    chatBox.appendChild(userMsgDiv);
    // AI占位
    const aiMsgDiv = document.createElement("div");
    aiMsgDiv.className = "msg ai";
    aiMsgDiv.innerText = "思考中...";
    chatBox.appendChild(aiMsgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    $("#chatInput").value = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] })
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.msg || "请求失败");
      lastAiReply = json.result;
      aiMsgDiv.innerText = lastAiReply;
    } catch (err) {
      aiMsgDiv.innerText = "AI出错：" + err.message;
      lastAiReply = "";
    }
    chatBox.scrollTop = chatBox.scrollHeight;
  }
  function saveLastReplyToLog() {
    if (!lastAiReply) return alert("暂无AI回答可以保存");
    LessonLog.appendAiLog(lastAiReply);
    alert("已保存到当日课堂存档教案！");
  }
  function init() {
    bindEvents();
  }
  return {
    init
  };
})();