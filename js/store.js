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
  // 预置25条小学体育课游戏素材库
  const PRESET_ACTIVITIES = [
    { title: "老鹰捉小鸡", category: "游戏", content: "人数：8-12人一组\n器材：无\n规则：1人扮演老鹰，1人为母鸡护住身后小鸡队伍；老鹰去抓捕队尾的小鸡，被抓到的同学轮换身份。适合热身跑动，练习躲闪能力。" },
    { title: "折返接力跑", category: "练习", content: "人数：4-6人一组，多队竞赛\n器材：标志桶\n规则：设置折返点，队员跑到标记处转身跑回，接力交给下一位队友，全部完成用时最短队伍获胜。锻炼爆发力与团队配合。" },
    { title: "丢沙包", category: "游戏", content: "人数：6-10人\n器材：沙包2个\n规则：两端同学投掷沙包击打中间躲避的学生；被击中出局，接住沙包可以复活队友。训练反应速度和身体躲闪能力。" },
    { title: "木头人", category: "热身", content: "人数：全班参与\n器材：无\n规则：教师背对学生喊口令，转身瞬间所有人立刻定格不动，晃动或者发笑的同学回到起点重新开始。锻炼身体控制能力和专注力。" },
    { title: "贴膏药", category: "热身", content: "人数：全体围成圆圈\n器材：无\n规则：两人一追一逃，逃跑者贴到任意同学身前，被贴的人立刻接替逃跑角色，持续追逐热身。简单易操作，适合课前快速热身。" },
    { title: "两人三足", category: "游戏", content: "人数：双人组队\n器材：绑腿绳\n规则：两名同学相邻脚踝绑在一起，协同向前跑完规定距离，中途摔倒可以原地调整继续前进。培养协作默契和身体协调能力。" },
    { title: "跳绳接力赛", category: "练习", content: "人数：分组竞赛\n器材：跳绳若干\n规则：队员原地连续跳绳10次后跑到终点接力下一位队员，完成速度最快的小组获胜。锻炼下肢力量和心肺功能。" },
    { title: "障碍绕桩跑", category: "练习", content: "人数：单人依次出发\n器材：标志桶\n规则：S形绕过一排障碍物，快速跑完赛道，不能碰倒标志桶。练习变向跑动能力和身体灵活性。" },
    { title: "拔河对抗", category: "游戏", content: "人数：10人每队\n器材：拔河绳\n规则：中线作为分界线，双方发力向本方拉动绳索，把中线拉过己方边线即为胜利。力量类团队对抗游戏，培养团队凝聚力。" },
    { title: "踩影子", category: "热身", content: "人数：自由跑动\n器材：户外晴天场地\n规则：阳光下追逐其他同学，用脚踩到别人影子就算成功，被踩到的人转为追逐者。轻松户外热身，适合低年级学生。" },
    { title: "运球抓人", category: "游戏", content: "人数：全体学生\n器材：小皮球\n规则：持球同学需要一边运球一边躲避抓捕者，球脱手即为淘汰。练习控球能力和跑动结合，适合篮球课热身。" },
    { title: "跳房子", category: "游戏", content: "人数：单人轮流游戏\n器材：粉笔地面画线\n规则：按照格子顺序单双脚跳跃前进，踩到边线则本轮结束。练习平衡感与下肢力量，经典传统体育游戏。" },
    { title: "捕鱼达人", category: "游戏", content: "人数：全班\n器材：无\n规则：2名同学手拉手充当渔网，抓捕四散跑动的小鱼；抓到的同学加入渔网，直到全部被捕获。集体跑动游戏，锻炼奔跑能力。" },
    { title: "沙包投准", category: "练习", content: "人数：轮流投掷\n器材：沙包、地面靶盘\n规则：站在投掷线外对准标记区域投掷沙包，根据落点计分。锻炼上肢投掷控制能力和手眼协调。" },
    { title: "火车快跑", category: "游戏", content: "人数：6-8人一列\n器材：无\n规则：所有人双手搭在前一个人的肩膀上，整列小火车保持连贯向前跑动，队伍断开需要原地重组。培养团队协作和节奏配合。" },
    { title: "单脚跳接力", category: "练习", content: "人数：分组对抗\n器材：标志桶\n规则：全程单脚跳跃抵达折返点，切换队友接力，中途落地就要回到起点重新出发。锻炼下肢力量和平衡能力。" },
    { title: "彩虹伞抛球", category: "游戏", content: "人数：全班集体\n器材：彩虹伞、弹力小球\n规则：所有人抓住伞边同步抖动，把球向上抛起并且不让小球掉落伞外。集体协作游戏，适合低年级趣味活动。" },
    { title: "反向听口令", category: "热身", content: "人数：全班\n器材：无\n规则：老师发出动作指令，学生必须做出完全相反的动作，比如喊向左转向右转。考验专注力与快速反应能力，室内外都可进行。" },
    { title: "滚轮胎竞速", category: "游戏", content: "人数：单人竞赛\n器材：废旧轮胎\n规则：双手推动轮胎向前直线前进，轮胎倒地需要停下扶正再继续。锻炼上肢力量与平衡控制，适合户外大场地。" },
    { title: "排球垫球接力", category: "练习", content: "人数：小组接力\n器材：软排球\n规则：原地连续垫球3次之后传递给下一名队员，球落地就要重新计数。练习排球基本垫球动作和团队配合。" },
    { title: "数字抱团", category: "游戏", content: "人数：全体自由走动\n器材：无\n规则：教师随机喊出数字，学生快速按照数字抱成对应人数的小团体，没能成功组队的同学暂时出局。反应类集体游戏，活跃课堂气氛。" },
    { title: "平衡垫行走", category: "练习", content: "人数：单人依次挑战\n器材：体操垫\n规则：学生保持身体平稳走过窄长软垫，中途身体晃动落地即挑战结束。练习核心平衡能力和身体控制。" },
    { title: "飞盘接力传递", category: "游戏", content: "人数：分组\n器材：软飞盘\n规则：队员手持飞盘跑动传递，到达终点交给下一位队友。适合户外趣味接力，练习跑动中持物能力。" },
    { title: "限时踢毽子", category: "练习", content: "人数：单人计时挑战\n器材：毽子\n规则：30秒计时，统计单人成功踢击次数，次数最高的学生获胜。锻炼手脚协调性和下肢灵活性，适合室内外活动。" },
    { title: "地雷保卫战", category: "游戏", content: "人数：攻守两队\n器材：锥形标志物作为地雷\n规则：进攻方需要在不触碰地雷的前提下抵达目标区域，防守方进行拦截保护标志物。策略类团队对抗游戏，培养战术意识。" },
  ];
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
    // 首次打开且活动库为空时，自动加载预置素材库
    if (!localData.activities || localData.activities.length === 0) {
      localData.activities = PRESET_ACTIVITIES.map(a => ({
        id: genId(),
        title: a.title,
        category: a.category,
        content: a.content,
      }));
      saveLocal();
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