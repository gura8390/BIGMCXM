/**
 * state.js — 玩家状态管理模块
 * 负责维护所有玩家数据，提供读取/修改接口，支持本地存档
 */
const PlayerState = (function () {
  'use strict';

  const STORAGE_KEY = 'adventurer_save';

  const defaults = {
    name: '冒险者',
    // 位置
    currentLocation: 'town_square',
    discoveredLocations: ['town_square'],
    // 生存指标 (0-100)
    thirst: 100,
    hunger: 100,
    energy: 100,
    bodyTemp: 37,
    // 职业
    guild: null,            // 'thief' | 'mage' | 'warrior'
    skills: {},             // { skillId: level }
    // 家园
    hasHome: false,
    homeFacilities: [],     // ['bed', 'kitchen', ...]
    // 科技
    researchedTech: [],     // ['basic_metallurgy', ...]
    // 资源
    gold: 50,
    inventory: [],          // [{ id, name, type, qty }]
    // 装备
    equipment: { weapon: null, armor: null, accessory: null },
    // 属性
    health: 100,
    maxHealth: 100,
    level: 1,
    exp: 0,
    nextLevelExp: 100,
    // 统计
    days: 0,
    kills: 0,
    // 教程
    tutorialStage: 'init',  // init | dialogue | home | complete
    // 当前研究中的科技
    researching: null,      // { techId, progress, required }
    researchProgress: 0,
    // 最后更新时间戳
    lastTick: Date.now()
  };

  let state = JSON.parse(JSON.stringify(defaults));

  /** 获取当前完整状态 */
  function getState() {
    return state;
  }

  /** 重置为新游戏 */
  function reset() {
    state = JSON.parse(JSON.stringify(defaults));
    save();
    return state;
  }

  /** 获取指定字段 */
  function get(key) {
    const keys = key.split('.');
    let val = state;
    for (const k of keys) {
      if (val == null) return undefined;
      val = val[k];
    }
    return val;
  }

  /** 设置指定字段 */
  function set(key, value) {
    const keys = key.split('.');
    let obj = state;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in obj)) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    save();
  }

  /** 批量修改（传入函数，多次 set 后自动保存一次） */
  function update(fn) {
    fn(state);
    save();
  }

  /** 增加数值 */
  function add(key, amount) {
    const keys = key.split('.');
    let obj = state;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = (obj[keys[keys.length - 1]] || 0) + amount;
    save();
  }

  /** 添加物品到背包 */
  function addItem(item) {
    const existing = state.inventory.find(i => i.id === item.id);
    if (existing && item.stackable !== false) {
      existing.qty = (existing.qty || 1) + (item.qty || 1);
    } else {
      state.inventory.push({ ...item, qty: item.qty || 1 });
    }
    save();
  }

  /** 移除物品 */
  function removeItem(itemId, qty = 1) {
    const idx = state.inventory.findIndex(i => i.id === itemId);
    if (idx === -1) return false;
    state.inventory[idx].qty -= qty;
    if (state.inventory[idx].qty <= 0) {
      state.inventory.splice(idx, 1);
    }
    save();
    return true;
  }

  /** 检查物品数量 */
  function hasItem(itemId, qty = 1) {
    const item = state.inventory.find(i => i.id === itemId);
    return item && item.qty >= qty;
  }

  /** 获取经验并升级 */
  function gainExp(amount) {
    state.exp += amount;
    while (state.exp >= state.nextLevelExp) {
      state.exp -= state.nextLevelExp;
      state.level += 1;
      state.nextLevelExp = Math.floor(state.nextLevelExp * 1.5);
      state.maxHealth += 10;
      state.health = state.maxHealth;
      return true; // 升级了
    }
    save();
    return false;
  }

  /** 存档 */
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // localStorage 不可用时忽略
    }
  }

  /** 读档 */
  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        state = JSON.parse(saved);
        return true;
      }
    } catch (e) { /* 忽略 */ }
    return false;
  }

  /** 删除存档 */
  function clearSave() {
    localStorage.removeItem(STORAGE_KEY);
  }

  return {
    getState,
    reset,
    get,
    set,
    update,
    add,
    addItem,
    removeItem,
    hasItem,
    gainExp,
    save,
    load,
    clearSave
  };
})();

if (typeof Logger !== 'undefined') Logger.system('state.js');
