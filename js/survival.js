/**
 * survival.js — 生存系统模块
 * 管理口渴、饥饿、精力、体温四项指标，以及随时间衰减和恢复逻辑
 */
const SurvivalSystem = (function () {
  'use strict';

  const TICK_INTERVAL = 10000; // 每 10 秒一 tick

  let tickTimer = null;

  /** 执行一个生存 tick */
  function tick() {
    const state = PlayerState.getState();
    const loc = state.currentLocation;

    // 基础衰减量
    let thirstDecay = 2;
    let hungerDecay = 1.5;
    let energyDecay = 1;
    let tempChange = 0;

    // 根据地点调整
    switch (loc) {
      case 'desert':
        thirstDecay = 5;
        tempChange = 0.5;
        break;
      case 'frozen_cave':
        tempChange = -0.8;
        break;
      case 'volcano':
        thirstDecay = 4;
        tempChange = 0.8;
        break;
      case 'dark_forest':
        thirstDecay = 1.5;
        hungerDecay = 2;
        tempChange = -0.2;
        break;
      default:
        break;
    }

    // 家园设施加成
    if (loc === 'home' && state.hasHome) {
      const fac = state.homeFacilities;
      if (fac.includes('well')) thirstDecay = 0;
      if (fac.includes('kitchen')) hungerDecay = 0;
      if (fac.includes('fireplace')) tempChange = Math.min(tempChange, 0.5);
    }

    // 体温趋于正常
    const tempDiff = 37 - state.bodyTemp;
    tempChange += tempDiff * 0.05;

    // 应用变化
    PlayerState.set('thirst', Math.max(0, Math.min(100, state.thirst - thirstDecay)));
    PlayerState.set('hunger', Math.max(0, Math.min(100, state.hunger - hungerDecay)));
    PlayerState.set('energy', Math.max(0, Math.min(100, state.energy - energyDecay)));
    PlayerState.set('bodyTemp', Math.max(30, Math.min(42, state.bodyTemp + tempChange)));

    // 生存状态过低时的影响
    checkSurvivalEffects();
    PlayerState.set('lastTick', Date.now());
  }

  /** 检查生存状态过低的影响 */
  function checkSurvivalEffects() {
    const s = PlayerState.getState();
    if (s.thirst <= 0 || s.hunger <= 0 || s.energy <= 0 || s.bodyTemp <= 30 || s.bodyTemp >= 42) {
      const dmg = 5;
      PlayerState.set('health', Math.max(0, s.health - dmg));
      return true; // 触发伤害
    }
    return false;
  }

  /** 获取生存状态描述 */
  function getStatusText() {
    const s = PlayerState.getState();
    function desc(val, unit, low, mid, high) {
      if (val <= low) return `极低 ${unit}`;
      if (val <= mid) return `偏低 ${unit}`;
      if (val >= high) return `良好 ${unit}`;
      return `正常 ${unit}`;
    }
    return {
      thirst: desc(s.thirst, '口渴', 20, 40, 80),
      hunger: desc(s.hunger, '饥饿', 20, 40, 80),
      energy: desc(s.energy, '精力', 20, 40, 80),
      bodyTemp: s.bodyTemp.toFixed(1) + '°C'
    };
  }

  /** 玩家休息 */
  function rest(amount = 30) {
    const s = PlayerState.getState();
    PlayerState.set('energy', Math.min(100, s.energy + amount));
    // 家园床铺加成
    if (s.currentLocation === 'home' && s.hasHome && s.homeFacilities.includes('bed')) {
      PlayerState.set('energy', Math.min(100, s.energy + amount + 20));
      PlayerState.set('health', Math.min(s.maxHealth, s.health + 5));
    }
    if (s.currentLocation === 'town_square') {
      PlayerState.set('energy', Math.min(100, s.energy + amount * 0.7));
    }
    PlayerState.set('lastTick', Date.now());
  }

  /** 进食 */
  function eat(foodPower = 30, waterPower = 0) {
    const s = PlayerState.getState();
    PlayerState.set('hunger', Math.min(100, s.hunger + foodPower));
    if (waterPower > 0) {
      PlayerState.set('thirst', Math.min(100, s.thirst + waterPower));
    }
  }

  /** 饮水 */
  function drink(amount = 40) {
    const s = PlayerState.getState();
    PlayerState.set('thirst', Math.min(100, s.thirst + amount));
  }

  /** 启动生存时钟 */
  function start() {
    stop();
    tickTimer = setInterval(tick, TICK_INTERVAL);
  }

  /** 停止生存时钟 */
  function stop() {
    if (tickTimer) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
  }

  /** 立即执行一次 tick（如长途跋涉时） */
  function forceTick(multiplier = 1) {
    for (let i = 0; i < multiplier; i++) {
      tick();
    }
  }

  return {
    TICK_INTERVAL,
    start,
    stop,
    tick,
    forceTick,
    rest,
    eat,
    drink,
    getStatusText,
    checkSurvivalEffects
  };
})();

if (typeof Logger !== 'undefined') Logger.system('survival.js');
