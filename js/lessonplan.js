/**
 * 教案管理模块
 * - 编写、保存新教案
 * - 历史教案列表查看、删除
 */
const LessonPlan = (() => {
  const $ = s => document.querySelector(s);

  function init() {
    $("#lpSaveBtn").addEventListener("click", savePlan);
    $("#lpClearBtn").addEventListener("click", clearInput);
    renderList();
  }

  function savePlan() {
    const title = $("#lpTitle").value.trim();
    const className = $("#lpClass").value.trim();
    const content = $("#lpContent").value.trim();

    if (!title) { alert("请输入教案标题"); return; }
    if (!content) { alert("请输入教案内容"); return; }

    Store.addLessonPlan(title, className, content);
    clearInput();
    renderList();
    alert("教案保存成功！");
  }

  function clearInput() {
    $("#lpTitle").value = "";
    $("#lpClass").value = "";
    $("#lpContent").value = "";
  }

  function renderList() {
    const box = $("#lpList");
    const plans = Store.getLessonPlans();
    box.innerHTML = "";

    if (plans.length === 0) {
      box.innerHTML = '<div style="color:#888;font-size:14px;padding:10px;">暂无教案，请在上方编写</div>';
      return;
    }

    plans.forEach(plan => {
      const item = document.createElement("div");
      item.className = "lesson-plan-item";
      item.innerHTML = `
        <div class="lp-header">
          <span class="lp-title">${plan.title}</span>
          <button class="danger" data-del="${plan.id}">删除</button>
        </div>
        <div class="lp-meta">${plan.date}${plan.className ? "｜适用班级：" + plan.className : ""}</div>
        <div class="lp-content">${plan.content}</div>
      `;
      box.appendChild(item);
    });

    box.querySelectorAll("[data-del]").forEach(btn => {
      btn.onclick = (e) => {
        const id = e.target.dataset.del;
        if (!confirm("确定要删除这份教案吗？")) return;
        Store.removeLessonPlan(id);
        renderList();
      };
    });
  }

  return { init };
})();
