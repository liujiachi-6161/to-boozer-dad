const App = (() => {
  const $ = s => document.querySelector(s);

  function bindTabSwitch() {
    const tabs = document.querySelectorAll(".tab");
    const panels = document.querySelectorAll(".panel");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const targetTab = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove("active"));
        panels.forEach(p => p.classList.remove("active"));
        tab.classList.add("active");
        $(`#${targetTab}`).classList.add("active");
      });
    });
  }

  //日历选中日期之后，加载当天全部记录，传给各个子模块
  function onDateSelected(dateStr) {
    $("#currentDateShow").textContent = dateStr;
    const dayRecord = Store.getDayRecord(dateStr);
    RollCall.setCurrentRecord(dayRecord);
    LessonLog.setCurrentRecord(dayRecord);
  }

  function bindSyncButton() {
    $("#syncBtn").onclick = async () => {
      const statusDom = $("#syncStatus");
      statusDom.textContent = "同步中…";
      //先从云端拉取覆盖本地
      const downRes = await Store.syncDownload();
      if (downRes.ok) {
        Calendar.refresh();
        const current = Calendar.getSelectedDate();
        if(current){
          onDateSelected(current);
        }
        //拉取成功再上传一次，双向同步
        await Store.syncUpload();
        statusDom.textContent = "同步完成";
      } else {
        statusDom.textContent = "同步失败";
      }
      setTimeout(()=>statusDom.textContent="",2500);
    };
  }

  function init() {
    bindTabSwitch();
    Calendar.init(onDateSelected);
    RollCall.init();
    LessonLog.init();
    AiChat.init();
    Stats.init();
    bindSyncButton();
    //默认选中今天
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
    Calendar.setSelectDate(todayStr);
    onDateSelected(todayStr);
  }
  return { init };
})();

App.init();