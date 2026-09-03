/**
 * 数据管理层：本地LocalStorage兜底 + Vercel KV云端同步
 * 数据分层：
 *   records      - 按日期存储的课堂记录（班级、课时、手记、出勤、AI存档、停课标记）
 *   classes      - 班级名册 [{id, name, students:[name]}]
 *   lessonPlans  - 教案存档 [{id, date, className, title, content}]
 *   activities   - 课堂活动资源 [{id, title, category, content}]
 */
const Store = (() => {
  const LOCAL_KEY = "sports-teacher-data-v2";

  let localData = {
    records: {},      // 日期key => 当日记录
    classes: [],      // 班级名册
    lessonPlans: [],  // 教案
    activities: [],   // 活动资源
  };

  // 生成唯一ID
  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  // 从本地缓存加载
  function loadLocal() {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        localData = {
          records: parsed.records || {},
          classes: parsed.classes || [],
          lessonPlans: parsed.lessonPlans || [],
          activities: parsed.activities || [],
        };
      } catch (e) {
        localData = { records: {}, classes: [], lessonPlans: [], activities: [] };
      }
    }
    return localData;
  }

  // 保存到本地缓存
  function saveLocal() {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(localData));
  }

  // ========== 当日课堂记录 ==========
  function getDayRecord(dateStr) {
    if (!localData.records[dateStr]) {
      localData.records[dateStr] = {
        className: "",
        lessonNo: "",
        note: "",
        students: [],       // [{name, status}]
        savedAiLogs: [],    // [{time, text}]
        cancelled: false,   // 是否停课
      };
      saveLocal();
    }
    return localData.records[dateStr];
  }

  function setDayRecord(dateStr, data) {
    localData.records[dateStr] = data;
    saveLocal();
  }

  function getAllRecords() {
    return localData.records;
  }

  // ========== 班级名册 ==========
  function getClasses() {
    return localData.classes;
  }

  function getClassById(id) {
    return localData.classes.find(c => c.id === id);
  }

  function addClass(name, studentNames) {
    const newClass = {
      id: genId(),
      name: name.trim(),
      students: studentNames.map(n => n.trim()).filter(n => n !== ""),
    };
    localData.classes.push(newClass);
    saveLocal();
    return newClass;
  }

  function removeClass(id) {
    localData.classes = localData.classes.filter(c => c.id !== id);
    saveLocal();
  }

  function addStudentToClass(classId, studentName) {
    const cls = getClassById(classId);
    if (!cls) return false;
    const name = studentName.trim();
    if (!name) return false;
    if (cls.students.includes(name)) return false;
    cls.students.push(name);
    saveLocal();
    return true;
  }

  function removeStudentFromClass(classId, studentName) {
    const cls = getClassById(classId);
    if (!cls) return false;
    cls.students = cls.students.filter(s => s !== studentName);
    saveLocal();
    return true;
  }

  // ========== 教案 ==========
  function getLessonPlans() {
    return localData.lessonPlans;
  }

  function addLessonPlan(title, className, content) {
    const plan = {
      id: genId(),
      date: new Date().toISOString().slice(0, 10),
      className: className.trim(),
      title: title.trim(),
      content: content,
    };
    localData.lessonPlans.unshift(plan);
    saveLocal();
    return plan;
  }

  function removeLessonPlan(id) {
    localData.lessonPlans = localData.lessonPlans.filter(p => p.id !== id);
    saveLocal();
  }

  // ========== 课堂活动资源 ==========
  function getActivities() {
    return localData.activities;
  }

  function addActivity(title, category, content) {
    const act = {
      id: genId(),
      title: title.trim(),
      category: category,
      content: content,
    };
    localData.activities.unshift(act);
    saveLocal();
    return act;
  }

  function removeActivity(id) {
    localData.activities = localData.activities.filter(a => a.id !== id);
    saveLocal();
  }

  function getRandomActivity() {
    if (localData.activities.length === 0) return null;
    const idx = Math.floor(Math.random() * localData.activities.length);
    return localData.activities[idx];
  }

  // ========== 云端同步 ==========
  async function syncUpload() {
    try {
      const res = await fetch("/api/kvStore", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localData),
      });
      const json = await res.json();
      return json;
    } catch (err) {
      return { ok: false, msg: "上传失败" };
    }
  }

  async function syncDownload() {
    try {
      const res = await fetch("/api/kvStore");
      const json = await res.json();
      if (json.ok && json.data) {
        const d = json.data;
        localData = {
          records: d.records || {},
          classes: d.classes || [],
          lessonPlans: d.lessonPlans || [],
          activities: d.activities || [],
        };
        saveLocal();
      }
      return json;
    } catch (err) {
      return { ok: false, msg: "下载失败" };
    }
  }

  return {
    init() { loadLocal(); },
    // 当日记录
    getDayRecord, setDayRecord, getAllRecords,
    // 班级名册
    getClasses, getClassById, addClass, removeClass,
    addStudentToClass, removeStudentFromClass,
    // 教案
    getLessonPlans, addLessonPlan, removeLessonPlan,
    // 活动资源
    getActivities, addActivity, removeActivity, getRandomActivity,
    // 同步
    syncUpload, syncDownload,
  };
})();

Store.init();
