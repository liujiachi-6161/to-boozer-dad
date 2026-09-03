/**
 * 点名签到模块
 * - 顺序点名：放大显示当前学生，两大按钮快速标记
 * - 下方汇总纠错列表：可修正出勤状态，不能修改名单
 * - 保存出勤到当日课堂记录
 */
const RollCall = (() => {
  const $ = s => document.querySelector(s);

  let dayRecord = null;
  let currentDateStr = "";
  let rollCallStudents = [];  // [{name, status}]
  let currentIndex = -1;       // 当前点到第几个
  let isRolling = false;

  // ========== 初始化绑定 ==========
  function init() {
    $("#startRollCallBtn").addEventListener("click", startRollCall);
    $("#resetRollCallBtn").addEventListener("click", resetRollCall);
    $("#saveAttendanceBtn").addEventListener("click", saveAttendance);

    // 班级选择变化时，加载该班名单到点名区
    $("#classNameSelect").addEventListener("change", onClassChange);
  }

  // ========== 班级下拉选择 ==========
  function refreshClassSelect() {
    const select = $("#classNameSelect");
    const currentVal = select.value;
    select.innerHTML = '<option value="">请选择班级（先在名册管理中创建）</option>';
    const classes = Store.getClasses();
    classes.forEach(cls => {
      const opt = document.createElement("option");
      opt.value = cls.id;
      opt.textContent = `${cls.name}（${cls.students.length}人）`;
      select.appendChild(opt);
    });
    // 恢复之前选中的
    if (currentVal && classes.find(c => c.id === currentVal)) {
      select.value = currentVal;
    }
  }

  function onClassChange() {
    const classId = $("#classNameSelect").value;
    if (!classId) {
      rollCallStudents = [];
      renderSeqArea();
      renderReviewList();
      return;
    }
    const cls = Store.getClassById(classId);
    if (!cls) return;

    // 如果当日记录已有该班学生出勤，沿用；否则新建全到场
    if (dayRecord && dayRecord.students && dayRecord.students.length > 0
        && dayRecord.className === cls.name) {
      rollCallStudents = JSON.parse(JSON.stringify(dayRecord.students));
    } else {
      rollCallStudents = cls.students.map(name => ({ name, status: "present" }));
    }
    currentIndex = -1;
    isRolling = false;
    renderSeqArea();
    renderReviewList();

    // 同步班级名到当日记录
    if (dayRecord) {
      dayRecord.className = cls.name;
      Store.setDayRecord(currentDateStr, dayRecord);
    }
  }

  // ========== 顺序点名 ==========
  function startRollCall() {
    if (rollCallStudents.length === 0) {
      alert("请先选择班级并载入名单");
      return;
    }
    isRolling = true;
    // 如果已经点完了，从头开始
    if (currentIndex >= rollCallStudents.length - 1) {
      currentIndex = -1;
    }
    // 找到第一个还没标记的（status可能已有值，但从头开始确认）
    currentIndex = 0;
    renderSeqArea();
  }

  function resetRollCall() {
    if (rollCallStudents.length === 0) return;
    if (!confirm("确定要重新点名吗？所有已标记的出勤状态将重置为到场。")) return;
    rollCallStudents.forEach(s => s.status = "present");
    currentIndex = -1;
    isRolling = false;
    renderSeqArea();
    renderReviewList();
  }

  function markStatus(status) {
    if (!isRolling || currentIndex < 0 || currentIndex >= rollCallStudents.length) return;
    rollCallStudents[currentIndex].status = status;
    // 跳到下一个
    if (currentIndex < rollCallStudents.length - 1) {
      currentIndex++;
    } else {
      currentIndex = rollCallStudents.length; // 标记完成
      isRolling = false;
    }
    renderSeqArea();
    renderReviewList();
  }

  // ========== 渲染顺序点名区 ==========
  function renderSeqArea() {
    const area = $("#rollcallSeqArea");

    if (rollCallStudents.length === 0) {
      area.innerHTML = '<div class="seq-placeholder">请先在上方选择班级，然后点击"开始点名"</div>';
      return;
    }

    if (!isRolling && currentIndex === -1) {
      area.innerHTML = `
        <div class="seq-placeholder">已载入 ${rollCallStudents.length} 名学生，点击"开始点名"开始顺序点名</div>
      `;
      return;
    }

    if (currentIndex >= rollCallStudents.length) {
      const presentCount = rollCallStudents.filter(s => s.status === "present").length;
      const absentCount = rollCallStudents.length - presentCount;
      area.innerHTML = `
        <div class="seq-done">点名完成！</div>
        <div style="margin-top:8px;font-size:14px;color:#666;">
          共 ${rollCallStudents.length} 人｜到场 ${presentCount} 人｜缺勤 ${absentCount} 人
        </div>
        <div style="margin-top:6px;font-size:13px;color:#888;">如有错误，可在下方列表修正，然后点击"保存本次出勤"</div>
      `;
      return;
    }

    const stu = rollCallStudents[currentIndex];
    area.innerHTML = `
      <div class="seq-progress">第 ${currentIndex + 1} / ${rollCallStudents.length} 位</div>
      <div class="seq-student-name">${stu.name}</div>
      <div class="seq-buttons">
        <button class="seq-btn-present" id="seqPresentBtn">到场</button>
        <button class="seq-btn-absent" id="seqAbsentBtn">缺勤</button>
      </div>
    `;
    $("#seqPresentBtn").onclick = () => markStatus("present");
    $("#seqAbsentBtn").onclick = () => markStatus("absent");
  }

  // ========== 渲染下方纠错列表 ==========
  function renderReviewList() {
    const list = $("#reviewList");
    list.innerHTML = "";

    if (rollCallStudents.length === 0) {
      list.innerHTML = '<div style="color:#888;font-size:13px;padding:8px;">暂无学生名单</div>';
      return;
    }

    rollCallStudents.forEach((stu, idx) => {
      const item = document.createElement("div");
      item.className = `review-item ${stu.status}`;
      item.innerHTML = `
        <span class="review-name">${idx + 1}. ${stu.name}</span>
        <span class="review-status ${stu.status}">${stu.status === "present" ? "到场" : "缺勤"}</span>
        <button class="review-toggle-btn ${stu.status === "present" ? "gray" : "success"}" data-idx="${idx}">
          ${stu.status === "present" ? "改为缺勤" : "改为到场"}
        </button>
      `;
      list.appendChild(item);
    });

    // 绑定切换按钮
    list.querySelectorAll(".review-toggle-btn").forEach(btn => {
      btn.onclick = (e) => {
        const i = Number(e.target.dataset.idx);
        rollCallStudents[i].status = rollCallStudents[i].status === "present" ? "absent" : "present";
        renderSeqArea();
        renderReviewList();
      };
    });
  }

  // ========== 保存出勤 ==========
  function saveAttendance() {
    if (!dayRecord) {
      alert("请先选择日期");
      return;
    }
    if (rollCallStudents.length === 0) {
      alert("请先选择班级并载入名单");
      return;
    }
    dayRecord.students = JSON.parse(JSON.stringify(rollCallStudents));
    Store.setDayRecord(currentDateStr, dayRecord);

    const presentCount = rollCallStudents.filter(s => s.status === "present").length;
    const absentCount = rollCallStudents.length - presentCount;
    alert(`出勤已保存！\n共 ${rollCallStudents.length} 人｜到场 ${presentCount} 人｜缺勤 ${absentCount} 人\n可在"课时出勤统计"页面查看历史记录。`);
  }

  // ========== 切换日期时加载当日记录 ==========
  function setCurrentRecord(record, dateStr) {
    dayRecord = record;
    currentDateStr = dateStr;

    // 刷新班级下拉
    refreshClassSelect();

    // 如果当日记录有班级，尝试选中对应班级
    if (dayRecord.className) {
      const classes = Store.getClasses();
      const matched = classes.find(c => c.name === dayRecord.className);
      if (matched) {
        $("#classNameSelect").value = matched.id;
      }
    }

    // 载入当日出勤数据
    if (dayRecord.students && dayRecord.students.length > 0) {
      rollCallStudents = JSON.parse(JSON.stringify(dayRecord.students));
    } else {
      rollCallStudents = [];
    }
    currentIndex = -1;
    isRolling = false;

    // 停课标记
    $("#cancelledCheck").checked = !!dayRecord.cancelled;

    renderSeqArea();
    renderReviewList();
  }

  // 停课标记变化时保存
  function bindCancelledCheck() {
    $("#cancelledCheck").addEventListener("change", () => {
      if (!dayRecord) return;
      dayRecord.cancelled = $("#cancelledCheck").checked;
      Store.setDayRecord(currentDateStr, dayRecord);
    });
  }

  // 外部调用：名册变更后刷新下拉
  function notifyClassesChanged() {
    refreshClassSelect();
  }

  return {
    init() {
      init();
      bindCancelledCheck();
    },
    setCurrentRecord,
    notifyClassesChanged,
  };
})();
