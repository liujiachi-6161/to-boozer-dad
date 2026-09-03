/**
 * 随堂手记模块
 * - 保存当日手记
 * - AI生成内容存档到当日记录
 * - 课时输入保存
 */
const LessonLog = (() => {
  let dayRecord = null;
  let currentDateStr = "";
  const $ = s => document.querySelector(s);

  function init() {
    $("#saveNoteBtn").addEventListener("click", saveNote);
    // 课时输入变化时自动保存
    $("#lessonNo").addEventListener("change", saveLessonNo);
  }

  // 保存手记
  function saveNote() {
    if (!dayRecord) return;
    dayRecord.note = $("#lessonNote").value.trim();
    Store.setDayRecord(currentDateStr, dayRecord);
    alert("手记已保存");
  }

  // 保存课时
  function saveLessonNo() {
    if (!dayRecord) return;
    dayRecord.lessonNo = $("#lessonNo").value.trim();
    Store.setDayRecord(currentDateStr, dayRecord);
  }

  // 添加AI生成内容存档到当日记录
  function appendAiLog(content) {
    if (!content.trim() || !dayRecord) return;
    dayRecord.savedAiLogs.push({
      time: new Date().toLocaleString(),
      text: content
    });
    Store.setDayRecord(currentDateStr, dayRecord);
    renderSavedAiLogs();
  }

  // 渲染已经存档的AI教案
  function renderSavedAiLogs() {
    const box = $("#savedAiLogBox");
    box.innerHTML = "";
    if (!dayRecord.savedAiLogs || dayRecord.savedAiLogs.length === 0) {
      box.innerHTML = "<div style='color:#777;font-size:13px;'>暂无存档教案</div>";
      return;
    }
    dayRecord.savedAiLogs.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "ai-log-item";
      div.innerHTML = `
        <div class="ai-log-time">${item.time}</div>
        <div style="white-space:pre-wrap;">${item.text}</div>
        <button data-del="${index}" style="margin-top:4px;font-size:12px;padding:2px 6px;background:#dd4444;">删除本条</button>
      `;
      box.appendChild(div);
    });
    box.querySelectorAll("button[data-del]").forEach(btn => {
      btn.onclick = (e) => {
        const idx = Number(e.target.dataset.del);
        dayRecord.savedAiLogs.splice(idx, 1);
        Store.setDayRecord(currentDateStr, dayRecord);
        renderSavedAiLogs();
      };
    });
  }

  // 切换日期，加载当天手记和存档教案
  function setCurrentRecord(record, dateStr) {
    dayRecord = record;
    currentDateStr = dateStr;
    $("#lessonNo").value = dayRecord.lessonNo || "";
    $("#lessonNote").value = dayRecord.note || "";
    renderSavedAiLogs();
  }

  return {
    init,
    setCurrentRecord,
    appendAiLog,
  };
})();
