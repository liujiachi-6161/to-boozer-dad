/**
 * 课堂活动资源模块
 * - 添加活动资源（热身、游戏、练习、放松等）
 * - 资源库列表查看、删除
 * - 随机抽取一个活动
 */
const Activity = (() => {
  const $ = s => document.querySelector(s);

  function init() {
    $("#actSaveBtn").addEventListener("click", saveActivity);
    $("#actClearBtn").addEventListener("click", clearInput);
    $("#actRandomBtn").addEventListener("click", randomPick);
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

  function renderList() {
    const box = $("#actList");
    const activities = Store.getActivities();
    box.innerHTML = "";

    if (activities.length === 0) {
      box.innerHTML = '<div style="color:#888;font-size:14px;padding:10px;">暂无活动资源，请在上方添加</div>';
      return;
    }

    activities.forEach(act => {
      const item = document.createElement("div");
      item.className = "activity-item";
      item.innerHTML = `
        <div class="act-header">
          <div>
            <span class="act-title">${act.title}</span>
            <span class="act-category">${act.category}</span>
          </div>
          <button class="danger" data-del="${act.id}">删除</button>
        </div>
        <div class="act-content">${act.content}</div>
      `;
      box.appendChild(item);
    });

    box.querySelectorAll("[data-del]").forEach(btn => {
      btn.onclick = (e) => {
        const id = e.target.dataset.del;
        if (!confirm("确定要删除这个活动吗？")) return;
        Store.removeActivity(id);
        renderList();
      };
    });
  }

  return { init };
})();
