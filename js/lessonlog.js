const LessonLog = (() => {
    let dayRecord = null;
    const $ = s => document.querySelector(s);

    function bindEvents() {
        $("#saveNoteBtn").addEventListener("click", saveNote);
    }

    // 保存随堂手记
    function saveNote() {
        dayRecord.note = $("#lessonNote").value.trim();
        Store.setDayRecord(Calendar.getSelectedDate(), dayRecord);
        alert("手记已保存");
    }

    // 添加AI生成内容存档到当日记录
    function appendAiLog(content) {
        if (!content.trim()) return;
        dayRecord.savedAiLogs.push({
            time: new Date().toLocaleString(),
            text: content
        });
        Store.setDayRecord(Calendar.getSelectedDate(), dayRecord);
        renderSavedAiLogs();
    }

    // 渲染已经存档的AI教案
    function renderSavedAiLogs() {
        const box = $("#savedAiLogBox");
        box.innerHTML = "";
        if (!dayRecord.savedAiLogs || dayRecord.savedAiLogs.length === 0) {
            box.innerHTML = "<div style='color:#777'>暂无存档教案</div>";
            return;
        }
        dayRecord.savedAiLogs.forEach((item, index) => {
            const div = document.createElement("div");
            div.style.borderBottom = "1px solid #eee";
            div.style.padding = "6px 0";
            div.innerHTML = `<div style="font-size:12px;color:#666">${item.time}</div>
            <div>${item.text}</div>
            <button data-del="${index}" style="margin-top:4px;font-size:12px;padding:2px 6px;background:#dd4444">删除本条</button>`;
            box.appendChild(div);
        });
        box.querySelectorAll("button[data-del]").forEach(btn=>{
            btn.onclick=(e)=>{
                const idx=Number(e.target.dataset.del);
                dayRecord.savedAiLogs.splice(idx,1);
                Store.setDayRecord(Calendar.getSelectedDate(),dayRecord);
                renderSavedAiLogs();
            }
        })
    }

    //切换日期，加载当天手记和存档教案
    function setCurrentRecord(record) {
        dayRecord = record;
        $("#className").value = dayRecord.className || "";
        $("#lessonNo").value = dayRecord.lessonNo || "";
        $("#lessonNote").value = dayRecord.note || "";
        renderSavedAiLogs();
    }

    function init() {
        bindEvents();
    }

    return {
        init,
        setCurrentRecord,
        appendAiLog
    };
})();