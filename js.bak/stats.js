const Stats = (() => {
  const $ = s => document.querySelector(s);

  function renderStatistics() {
    const records = Store.getAllRecords();
    const resultBox = $("#statResult");
    if (!records || Object.keys(records).length === 0) {
      resultBox.innerHTML = "<p>暂无课堂记录</p>";
      return;
    }
    let totalLessons = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    const classMap = {};

    Object.values(records).forEach(dayData => {
      if (!dayData.className || dayData.students.length === 0) return;
      totalLessons++;
      if (!classMap[dayData.className]) {
        classMap[dayData.className] = { present: 0, absent: 0 };
      }
      dayData.students.forEach(stu => {
        if (stu.status === "present") {
          totalPresent++;
          classMap[dayData.className].present++;
        } else {
          totalAbsent++;
          classMap[dayData.className].absent++;
        }
      });
    });
    let html = `<p>总课时：${totalLessons}</p>
    <p>全部出勤人次：${totalPresent}</p>
    <p>全部缺勤人次：${totalAbsent}</p>
    <h4 style="margin-top:14px">各班明细</h4>`;
    for (const c in classMap) {
      const p = classMap[c].present;
      const a = classMap[c].absent;
      const rate = ((p / (p + a)) * 100).toFixed(1);
      html += `<div style="margin:6px 0;">${c}：出勤${p}人｜缺勤${a}人｜出勤率 ${rate}%</div>`;
    }
    resultBox.innerHTML = html;
  }

  function init() {
    const statTab = document.querySelector('[data-tab="stats"]');
    statTab.addEventListener("click", renderStatistics);
  }

  return {
    init,
    refresh: renderStatistics
  };
})();