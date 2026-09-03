const Calendar = (() => {
  let currentYear;
  let currentMonth;
  let selectedDateStr = "";
  let onDateChangeCallback = null;

  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  function init(callback) {
    onDateChangeCallback = callback;
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    bindEvents();
    render();
  }

  function bindEvents() {
    $("#prevMonth").onclick = () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      render();
    };
    $("#nextMonth").onclick = () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      render();
    };
  }

  function render() {
    const titleEl = $("#calTitle");
    const daysBox = $("#calDays");
    daysBox.innerHTML = "";
    titleEl.textContent = `${currentYear}年${currentMonth + 1}月`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay() || 7;
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const records = Store.getAllRecords();

    // 前置空白格子
    for (let i = 1; i < firstDay; i++) {
      const empty = document.createElement("div");
      empty.className = "cal-day empty";
      daysBox.appendChild(empty);
    }

    // 日期格子
    const todayRaw = new Date();
    const todayStr = `${todayRaw.getFullYear()}-${String(todayRaw.getMonth() + 1).padStart(2, "0")}-${String(todayRaw.getDate()).padStart(2, "0")}`;

    for (let d = 1; d <= totalDays; d++) {
      const dayEl = document.createElement("div");
      dayEl.className = "cal-day";
      dayEl.textContent = d;
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

      if (dateStr === todayStr) dayEl.classList.add("today");
      if (records[dateStr]) dayEl.classList.add("hasLesson");
      if (dateStr === selectedDateStr) dayEl.style.background = "#74a8e8";

      dayEl.onclick = () => {
        selectedDateStr = dateStr;
        render();
        if (onDateChangeCallback) onDateChangeCallback(dateStr);
      };
      daysBox.appendChild(dayEl);
    }
  }

  function setSelectDate(dateStr) {
    selectedDateStr = dateStr;
    render();
  }

  function getSelectedDate() {
    return selectedDateStr;
  }

  return {
    init,
    setSelectDate,
    getSelectedDate,
    refresh: render
  };
})();