/**
 * 数据管理层：本地LocalStorage兜底 + Vercel KV云端同步
 */
const Store = (() => {
  const LOCAL_KEY = "sports-teacher-data";
  let localData = {
    records: {}, // 日期作为key："2026-09-03" =>当日全部记录
  };

  // 从本地缓存加载
  function loadLocal() {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      try {
        localData = JSON.parse(raw);
      } catch (e) {
        localData = { records: {} };
      }
    }
    return localData;
  }

  // 保存到本地缓存
  function saveLocal() {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(localData));
  }

  // 获取某天记录，不存在则新建空模板
  function getDayRecord(dateStr) {
    if (!localData.records[dateStr]) {
      localData.records[dateStr] = {
        className: "",
        lessonNo: "",
        note: "",
        students: [],
        savedAiLogs: [],
      };
      saveLocal();
    }
    return localData.records[dateStr];
  }

  // 更新单日记录
  function setDayRecord(dateStr, data) {
    localData.records[dateStr] = data;
    saveLocal();
  }

  // 云端同步：上传全部数据
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

  // 云端同步：拉取云端数据覆盖本地
  async function syncDownload() {
    try {
      const res = await fetch("/api/kvStore");
      const json = await res.json();
      if (json.ok && json.data) {
        localData = json.data;
        saveLocal();
      }
      return json;
    } catch (err) {
      return { ok: false, msg: "下载失败" };
    }
  }

  return {
    init() {
      loadLocal();
    },
    getDayRecord,
    setDayRecord,
    getAllRecords() {
      return localData.records;
    },
    syncUpload,
    syncDownload,
  };
})();
Store.init();