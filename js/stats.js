/**
 * 课时出勤统计模块
 * - 按日期倒序展示所有出勤记录
 * - 按班级筛选
 * - 汇总统计（总课时、出勤、缺勤、出勤率）
 * - 每条记录可编辑修正出勤状态
 * - 停课标记显示
 */
const Stats = (() => {
  const $ = s => document.querySelector(s);
  let editingDate = null; // 当前正在编辑的日期

  function init() {
    $("#statsClassFilter").addEventListener("change", renderAll);
    // 点击统计标签时刷新
    const statTab = document.querySelector('[data-tab="stats"]');
    if (statTab) statTab.addEventListener("click", renderAll);
  }

  // 刷新班级筛选下拉
  function refreshClassFilter() {
    const select = $("#statsClassFilter");
    const currentVal = select.value;
    select.innerHTML = '<option value="">全部班级</option>';

    // 从记录中收集所有出现过的班级名
    const records = Store.getAllRecords();
    const classNames = new Set();
    Object.values(records).forEach(r => {
      if (r.className) classNames.add(r.className);
    });
    // 也从班级名册中收集
    Store.getClasses().forEach(c => classNames.add(c.name));

    classNames.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });

    if (currentVal && classNames.has(currentVal)) {
      select.value = currentVal;
    }
  }

  // 外部通知：班级名册变更时刷新
  function notifyClassesChanged() {
    refreshClassFilter();
  }

  // 获取筛选后的记录列表（按日期倒序）
  function getFilteredRecords() {
    const filterClass = $("#statsClassFilter").value;
    const records = Store.getAllRecords();
    let list = [];

    for (const dateStr in records) {
      const r = records[dateStr];
      // 只显示有班级或有学生出勤或有停课标记的记录
      if (!r.className && (!r.students || r.students.length === 0) && !r.cancelled) continue;
      if (filterClass && r.className !== filterClass) continue;
      list.push({ date: dateStr, ...r });
    }

    // 按日期倒序（最新在前）
    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }

  // 渲染全部
  function renderAll() {
    refreshClassFilter();
    renderSummary();
    renderRecordList();
  }

  // 渲染汇总统计
  function renderSummary() {
    const list = getFilteredRecords();
    const box = $("#statsSummary");

    let totalLessons = 0;
    let totalCancelled = 0;
    let totalPresent = 0;
    let totalAbsent = 0;

    list.forEach(r => {
      if (r.cancelled) {
        totalCancelled++;
        return;
      }
      if (r.students && r.students.length > 0) {
        totalLessons++;
        r.students.forEach(s => {
          if (s.status === "present") totalPresent++;
          else totalAbsent++;
        });
      }
    });

    const totalStudents = totalPresent + totalAbsent;
    const attendanceRate = totalStudents > 0 ? ((totalPresent / totalStudents) * 100).toFixed(1) : "0.0";

    box.innerHTML = `
      <div class="stat-card">
        <div class="stat-num">${totalLessons}</div>
        <div class="stat-label">实际上课节数</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${totalCancelled}</div>
        <div class="stat-label">停课节数</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${totalPresent}</div>
        <div class="stat-label">出勤人次</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${totalAbsent}</div>
        <div class="stat-label">缺勤人次</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${attendanceRate}%</div>
        <div class="stat-label">平均出勤率</div>
      </div>
    `;
  }

  // 渲染记录明细列表
  function renderRecordList() {
    const list = getFilteredRecords();
    const box = $("#statsRecordList");
    box.innerHTML = "";

    if (list.length === 0) {
      box.innerHTML = '<div style="color:#888;font-size:14px;padding:10px;">暂无出勤记录</div>';
      return;
    }

    list.forEach(r => {
      const item = document.createElement("div");
      item.className = "stat-record-item";

      const presentCount = r.students ? r.students.filter(s => s.status === "present").length : 0;
      const absentCount = r.students ? r.students.length - presentCount : 0;
      const absentNames = r.students ? r.students.filter(s => s.status === "absent").map(s => s.name).join("、") : "";

      item.innerHTML = `
        <div class="stat-record-header">
          <div>
            <span class="stat-record-date">${r.date}</span>
            ${r.className ? `<span class="stat-record-class">${r.className}</span>` : ""}
            ${r.cancelled ? '<span class="stat-record-cancelled">已停课</span>' : ""}
          </div>
          <div>
            ${r.lessonNo ? `<span style="font-size:13px;color:#666;margin-right:10px;">${r.lessonNo}</span>` : ""}
            <button class="gray" data-edit="${r.date}">${editingDate === r.date ? "收起" : "编辑修正"}</button>
          </div>
        </div>
        <div class="stat-record-info">
          ${r.cancelled
            ? "本节课取消（停课）"
            : `应到 ${r.students ? r.students.length : 0} 人｜实到 ${presentCount} 人｜缺勤 ${absentCount} 人`
          }
        </div>
        ${absentNames ? `<div class="stat-record-absent-list">缺勤名单：${absentNames}</div>` : ""}
        ${r.note ? `<div style="font-size:13px;color:#555;margin-top:4px;">手记：${r.note}</div>` : ""}
        <div class="stat-edit-area" id="edit-area-${r.date}" style="display:${editingDate === r.date ? "block" : "none"};">
          <div style="font-size:13px;color:#666;margin-bottom:6px;">修正出勤状态（仅改状态，不改动名单）：</div>
          <div class="stat-edit-students" id="edit-students-${r.date}"></div>
          <div style="display:flex;gap:8px;align-items:center;">
            <label style="font-size:13px;">
              <input type="checkbox" id="edit-cancelled-${r.date}" ${r.cancelled ? "checked" : ""}> 标记为停课
            </label>
            <button data-save-edit="${r.date}" class="success">保存修正</button>
          </div>
        </div>
      `;
      box.appendChild(item);

      // 渲染编辑区的学生列表
      if (editingDate === r.date && r.students) {
        const editStuBox = item.querySelector(`#edit-students-${r.date}`);
        r.students.forEach((stu, idx) => {
          const row = document.createElement("div");
          row.className = "review-item " + stu.status;
          row.style.marginBottom = "4px";
          row.innerHTML = `
            <span class="review-name">${idx + 1}. ${stu.name}</span>
            <span class="review-status ${stu.status}">${stu.status === "present" ? "到场" : "缺勤"}</span>
            <button class="review-toggle-btn ${stu.status === "present" ? "gray" : "success"}" data-edit-idx="${idx}">
              ${stu.status === "present" ? "改为缺勤" : "改为到场"}
            </button>
          `;
          editStuBox.appendChild(row);
        });

        // 绑定编辑区切换按钮
        editStuBox.querySelectorAll("[data-edit-idx]").forEach(btn => {
          btn.onclick = (e) => {
            const i = Number(e.target.dataset.editIdx);
            const dayRec = Store.getDayRecord(r.date);
            dayRec.students[i].status = dayRec.students[i].status === "present" ? "absent" : "present";
            Store.setDayRecord(r.date, dayRec);
            renderRecordList(); // 重新渲染保持编辑状态
            editingDate = r.date;
          };
        });
      }
    });

    // 绑定编辑/收起按钮
    box.querySelectorAll("[data-edit]").forEach(btn => {
      btn.onclick = (e) => {
        const date = e.target.dataset.edit;
        editingDate = editingDate === date ? null : date;
        renderRecordList();
      };
    });

    // 绑定保存修正按钮
    box.querySelectorAll("[data-save-edit]").forEach(btn => {
      btn.onclick = (e) => {
        const date = e.target.dataset.saveEdit;
        const dayRec = Store.getDayRecord(date);
        dayRec.cancelled = document.querySelector(`#edit-cancelled-${date}`).checked;
        Store.setDayRecord(date, dayRec);
        editingDate = null;
        renderAll();
        alert("修正已保存！");
      };
    });
  }

  return {
    init,
    renderAll,
    notifyClassesChanged,
  };
})();
