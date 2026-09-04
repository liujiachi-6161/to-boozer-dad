/**
 * 全局入口：标签切换、模块初始化、日期联动、云端同步
 */
const App = (() => {
  const $ = s => document.querySelector(s);
  // ========== 标签切换（6个页面） ==========
  function bindTabSwitch() {
    const tabs = document.querySelectorAll(".tab");
    const panels = document.querySelectorAll(".panel");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const targetTab = tab.dataset.tab;
        const targetPanel = document.getElementById(targetTab);
        tabs.forEach(t => t.classList.remove("active"));
        panels.forEach(p => p.classList.remove("active"));
        tab.classList.add("active");
        if (targetPanel) {
          targetPanel.classList.add("active");
        }
        // 切换到统计页时刷新数据
        if (targetTab === "stats" && typeof Stats !== "undefined") {
          Stats.renderAll();
        }
      });
    });
  }
  // ========== 日历选中日期后联动加载当日记录 ==========
  function onDateSelected(dateStr) {
    $("#currentDateShow").textContent = dateStr;
    const dayRecord = Store.getDayRecord(dateStr);
    // 点名模块加载当日出勤
    if (typeof RollCall !== "undefined") {
      RollCall.setCurrentRecord(dayRecord, dateStr);
    }
    // 手记模块加载当日手记
    if (typeof LessonLog !== "undefined") {
      LessonLog.setCurrentRecord(dayRecord, dateStr);
    }
  }
  // ========== 云端同步按钮 ==========
  function bindSyncButton() {
    $("#syncBtn").onclick = async () => {
      const statusDom = $("#syncStatus");
      statusDom.textContent = "同步中…";
      try {
        // 先从云端拉取覆盖本地
        const downRes = await Store.syncDownload();
        if (downRes.ok) {
          // 刷新日历
          if (typeof Calendar !== "undefined") Calendar.refresh();
          // 刷新当前日期的记录
          const current = Calendar.getSelectedDate ? Calendar.getSelectedDate() : null;
          if (current) {
            onDateSelected(current);
          }
          // 刷新名册、统计
          if (typeof Roster !== "undefined") Roster.refresh();
          if (typeof Stats !== "undefined") Stats.renderAll();
          // 拉取成功再上传一次，双向同步
          await Store.syncUpload();
          statusDom.textContent = "同步完成";
        } else {
          statusDom.textContent = "同步失败：" + (downRes.msg || "");
        }
      } catch (err) {
        statusDom.textContent = "同步出错";
      }
      setTimeout(() => { statusDom.textContent = ""; }, 3000);
    };
  }
  // ========== 主题切换（默认暗色） ==========
  function initTheme() {
    const toggleBtn = $("#themeToggle");
    const saved = localStorage.getItem("theme");
    // 默认暗色
    const theme = saved || "dark";
    document.documentElement.setAttribute("data-theme", theme);
    toggleBtn.textContent = theme === "dark" ? "☀️ 亮色" : "🌙 暗色";
    toggleBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      toggleBtn.textContent = next === "dark" ? "☀️ 亮色" : "🌙 暗色";
    });
  }
  // ========== 初始化 ==========
  function init() {
    // 主题先初始化
    initTheme();
    // 绑定标签切换
    bindTabSwitch();
    // 初始化各模块
    if (typeof Calendar !== "undefined") Calendar.init(onDateSelected);
    if (typeof RollCall !== "undefined") RollCall.init();
    if (typeof LessonLog !== "undefined") LessonLog.init();
    if (typeof AiChat !== "undefined") AiChat.init();
    if (typeof Stats !== "undefined") Stats.init();
    if (typeof Roster !== "undefined") Roster.init();
    if (typeof LessonPlan !== "undefined") LessonPlan.init();
    if (typeof Activity !== "undefined") Activity.init();
    // 同步按钮
    bindSyncButton();
    // 默认选中今天
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (typeof Calendar !== "undefined") {
      Calendar.setSelectDate(todayStr);
    }
    onDateSelected(todayStr);
  }
  return { init };
})();
App.init();