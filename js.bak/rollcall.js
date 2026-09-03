const RollCall = (() => {
  let dayRecord = null;
  const $ = s => document.querySelector(s);

  function bindEvent() {
    $("#loadStudentBtn").addEventListener("click", loadStudentList);
    $("#randomCallBtn").addEventListener("click", randomCall);
  }

  // 载入名单
  function loadStudentList() {
    const text = $("#studentText").value.trim();
    if (!text) return alert("请输入学生名单，每行1人");
    const lines = text.split("\n").filter(item => item.trim() !== "");
    const list = lines.map(name => ({
      name: name.trim(),
      status: "present" // present到，absent缺勤
    }));
    dayRecord.students = list;
    Store.setDayRecord(Calendar.getSelectedDate(), dayRecord);
    renderStudentBox();
  }

  // 渲染学生列表，每个学生附带【到】【缺勤】按钮
  function renderStudentBox() {
    const box = $("#studentListBox");
    box.innerHTML = "";
    if (!dayRecord || dayRecord.students.length === 0) return;
    dayRecord.students.forEach((stu, idx) => {
      const wrap = document.createElement("div");
      wrap.className = "student-item";
      if (stu.status === "absent") wrap.classList.add("absent");
      wrap.innerHTML = `
        <span>${stu.name}</span>
        <br>
        <button data-idx="${idx}" data-state="present" style="padding:2px 5px;font-size:12px">到</button>
        <button data-idx="${idx}" data-state="absent" style="padding:2px 5px;font-size:12px">缺勤</button>
      `;
      box.appendChild(wrap);
    });
    // 绑定点击状态切换
    box.querySelectorAll("button").forEach(btn => {
      btn.onclick = (e) => {
        const i = Number(e.target.dataset.idx);
        const state = e.target.dataset.state;
        dayRecord.students[i].status = state;
        Store.setDayRecord(Calendar.getSelectedDate(), dayRecord);
        renderStudentBox();
      };
    });
  }

  // 随机点名
  function randomCall() {
    if (!dayRecord || dayRecord.students.length === 0) return alert("请先载入名单");
    const arr = dayRecord.students;
    const r = arr[Math.floor(Math.random() * arr.length)];
    alert(`随机点名：${r.name}`);
  }

  // 切换日期时更新当日记录
  function setCurrentRecord(record) {
    dayRecord = record;
    $("#studentText").value = dayRecord.students.map(s => s.name).join("\n");
    renderStudentBox();
  }

  function init() {
    bindEvent();
  }

  return {
    init,
    setCurrentRecord
  };
})();