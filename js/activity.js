/**
 * 课堂活动资源模块
 * - 预置25条小学体育课游戏素材库
 * - 卡片式布局展示，点击卡片弹出详情弹窗
 * - 支持自定义添加、删除、随机抽取
 */
const Activity = (() => {
  const $ = s => document.querySelector(s);
  function init() {
    $("#actSaveBtn").addEventListener("click", saveActivity);
    $("#actClearBtn").addEventListener("click", clearInput);
    $("#actRandomBtn").addEventListener("click", randomPick);
    // 弹窗关闭按钮
    $("#activityModalClose").addEventListener("click", closeModal);
    $("#activityModalMask").addEventListener("click", closeModal);
    renderList();
  }
  function saveActivity() {
    const title = $("#actTitle").value.trim();
    const category = $("#actCategory").value;
    const content = $("#actContent").value.trim();
    if (!title) { alert("请输入活动名称"); return; }
    if (!content) { alert("请输入活动玩法/规则"); return; }
    Store.addActivity(title, category, content);
    clearInput();
    renderList();
    alert("活动保存成功！");
  }
  function clearInput() {
    $("#actTitle").value = "";
    $("#actCategory").value = "热身";
    $("#actContent").value = "";
  }
  function randomPick() {
    const act = Store.getRandomActivity();
    const resultBox = $("#actRandomResult");
    if (!act) {
      resultBox.innerHTML = '<div style="color:#888;">活动库为空，请先添加活动资源</div>';
      resultBox.classList.add("show");
      return;
    }
    resultBox.innerHTML = `
      <h4>随机抽取结果</h4>
      <div style="font-weight:bold;font-size:16px;margin-bottom:4px;">
        ${act.title}
        <span class="act-category">${act.category}</span>
      </div>
      <div style="font-size:14px;white-space:pre-wrap;">${act.content}</div>
    `;
    resultBox.classList.add("show");
  }
  function openModal(act) {
    $("#modalTitle").textContent = act.title;
    $("#modalCategory").textContent = act.category;
    $("#modalContent").textContent = act.content;
    $("#activityModal").classList.add("show");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    $("#activityModal").classList.remove("show");
    document.body.style.overflow = "";
  }
  function renderList() {
    const box = $("#actList");
    const activities = Store.getActivities();
    box.innerHTML = "";
    if (activities.length === 0) {
      box.innerHTML = '<div style="color:#888;font-size:14px;padding:10px;">暂无活动资源，请在上方添加</div>';
      return;
    }
    // 卡片网格容器
    const grid = document.createElement("div");
    grid.className = "activity-grid";
    activities.forEach(act => {
      const card = document.createElement("div");
      card.className = "activity-card";
      card.innerHTML = `
        <div class="activity-card-inner">
          <div class="activity-card-header">
            <span class="activity-card-title">${act.title}</span>
            <span class="act-category">${act.category}</span>
          </div>
          <div class="activity-card-preview">${act.content.substring(0, 50)}...</div>
          <div class="activity-card-footer">
            <span class="activity-card-hint">点击查看详情</span>
            <button class="danger activity-card-del" data-del="${act.id}">删除</button>
          </div>
        </div>
      `;
      // 点击卡片打开弹窗（排除删除按钮）
      card.querySelector(".activity-card-inner").addEventListener("click", (e) => {
        if (e.target.classList.contains("activity-card-del")) return;
        openModal(act);
      });
      // 删除按钮
      card.querySelector("[data-del]").addEventListener("click", (e) => {
        e.stopPropagation();
        const id = e.target.dataset.del;
        if (!confirm("确定要删除这个活动吗？")) return;
        Store.removeActivity(id);
        renderList();
      });
      grid.appendChild(card);
    });
    box.appendChild(grid);
  }
  return { init };
})();