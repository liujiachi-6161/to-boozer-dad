/**
 * 学生名册管理模块
 * - 创建班级、录入名单
 * - 转入新增学生、转出删除学生
 * - 学期结束删除整个班级
 * - 名册变更后通知首页点名模块刷新下拉
 */
const Roster = (() => {
  const $ = s => document.querySelector(s);

  function init() {
    $("#rosterAddClassBtn").addEventListener("click", addClass);
    renderClassList();
  }

  // ========== 创建班级 ==========
  function addClass() {
    const name = $("#rosterClassName").value.trim();
    const text = $("#rosterStudentText").value.trim();

    if (!name) {
      alert("请输入班级名称");
      return;
    }
    if (!text) {
      alert("请输入学生名单，每行一名学生");
      return;
    }

    const studentNames = text.split("\n").map(n => n.trim()).filter(n => n !== "");
    if (studentNames.length === 0) {
      alert("学生名单不能为空");
      return;
    }

    // 检查班级名是否重复
    const classes = Store.getClasses();
    if (classes.find(c => c.name === name)) {
      if (!confirm(`班级"${name}"已存在，是否继续创建同名班级？`)) return;
    }

    Store.addClass(name, studentNames);

    // 清空输入
    $("#rosterClassName").value = "";
    $("#rosterStudentText").value = "";

    renderClassList();
    // 通知首页点名模块刷新班级下拉
    if (typeof RollCall !== "undefined") {
      RollCall.notifyClassesChanged();
    }
    if (typeof Stats !== "undefined" && Stats.notifyClassesChanged) {
      Stats.notifyClassesChanged();
    }

    alert(`班级"${name}"创建成功，共 ${studentNames.length} 名学生`);
  }

  // ========== 渲染班级列表 ==========
  function renderClassList() {
    const box = $("#rosterClassList");
    const classes = Store.getClasses();
    box.innerHTML = "";

    if (classes.length === 0) {
      box.innerHTML = '<div style="color:#888;font-size:14px;padding:10px;">暂无班级，请在上方创建</div>';
      return;
    }

    classes.forEach(cls => {
      const item = document.createElement("div");
      item.className = "roster-class-item";
      item.innerHTML = `
        <div class="roster-class-header">
          <div>
            <span class="roster-class-name">${cls.name}</span>
            <span class="roster-student-count">${cls.students.length} 人</span>
          </div>
          <button class="danger" data-del-class="${cls.id}">删除整个班级</button>
        </div>
        <div class="roster-students" id="roster-students-${cls.id}"></div>
        <div class="roster-add-student">
          <input type="text" placeholder="输入新学生姓名，转入添加" data-add-input="${cls.id}">
          <button data-add-btn="${cls.id}">添加学生</button>
        </div>
      `;
      box.appendChild(item);

      // 渲染学生标签
      const stuBox = item.querySelector(`#roster-students-${cls.id}`);
      cls.students.forEach((stuName, idx) => {
        const tag = document.createElement("span");
        tag.className = "roster-student-tag";
        tag.innerHTML = `${idx + 1}. ${stuName} <span class="remove-stu" data-class="${cls.id}" data-stu="${stuName}" title="转出删除">×</span>`;
        stuBox.appendChild(tag);
      });
    });

    // 绑定删除班级
    box.querySelectorAll("[data-del-class]").forEach(btn => {
      btn.onclick = (e) => {
        const classId = e.target.dataset.delClass;
        const cls = Store.getClassById(classId);
        if (!cls) return;
        if (!confirm(`确定要删除班级"${cls.name}"吗？\n该班所有学生名单将被清除。\n（历史出勤记录会保留在统计页面）`)) return;
        Store.removeClass(classId);
        renderClassList();
        if (typeof RollCall !== "undefined") RollCall.notifyClassesChanged();
        if (typeof Stats !== "undefined" && Stats.notifyClassesChanged) Stats.notifyClassesChanged();
      };
    });

    // 绑定删除学生
    box.querySelectorAll(".remove-stu").forEach(span => {
      span.onclick = (e) => {
        const classId = e.target.dataset.class;
        const stuName = e.target.dataset.stu;
        if (!confirm(`确定要将学生"${stuName}"转出（删除）吗？`)) return;
        Store.removeStudentFromClass(classId, stuName);
        renderClassList();
        if (typeof RollCall !== "undefined") RollCall.notifyClassesChanged();
      };
    });

    // 绑定添加学生
    box.querySelectorAll("[data-add-btn]").forEach(btn => {
      btn.onclick = (e) => {
        const classId = e.target.dataset.addBtn;
        const input = box.querySelector(`[data-add-input="${classId}"]`);
        const name = input.value.trim();
        if (!name) {
          alert("请输入学生姓名");
          return;
        }
        const ok = Store.addStudentToClass(classId, name);
        if (!ok) {
          alert("添加失败：学生已存在或姓名为空");
          return;
        }
        input.value = "";
        renderClassList();
        if (typeof RollCall !== "undefined") RollCall.notifyClassesChanged();
      };
    });
  }

  // 外部调用：刷新列表
  function refresh() {
    renderClassList();
  }

  return { init, refresh };
})();
