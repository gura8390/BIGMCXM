/**
 * map.js — 地图系统模块
 * 管理地点切换、探索、旅行逻辑
 */
const MapSystem = (function () {
  'use strict';

  let currentRandomLocation = null;

  /** 获取当前位置对象 */
  function getCurrentLocation() {
    const state = PlayerState.getState();
    if (currentRandomLocation && state.currentLocation === currentRandomLocation.id) {
      return currentRandomLocation;
    }
    const fixed = Locations.getFixed(state.currentLocation);
    if (!fixed) {
      // 从存档恢复时如果在随机地点，则重置到城镇
      PlayerState.set('currentLocation', 'town_square');
      return Locations.getFixed('town_square');
    }
    return fixed;
  }

  /** 前往指定地点 */
  function travel(targetId) {
    const state = PlayerState.getState();
    const current = getCurrentLocation();

    // 检查是否允许前往
    if (!current) return { success: false, message: '当前位置不存在。' };

    if (current.connections && current.connections.includes(targetId)) {
      return doTravel(targetId);
    }

    // 从随机地点返回城镇
    if (targetId === 'town_square' && currentRandomLocation) {
      return doTravel(targetId);
    }

    // 检查条件连接 (如家园需要先建造)
    if (current.conditionalConnections) {
      for (var ci = 0; ci < current.conditionalConnections.length; ci++) {
        var cc = current.conditionalConnections[ci];
        var condMet = (typeof cc.condition === 'function') ? cc.condition() : true;
        if (cc.target === targetId && condMet) {
          return doTravel(targetId);
        }
      }
    }

    return { success: false, message: '无法前往该地点。' };
  }

  function doTravel(targetId) {
    const state = PlayerState.getState();
    const oldLoc = state.currentLocation;

    PlayerState.set('currentLocation', targetId);

    // 记录发现的新地点
    if (!state.discoveredLocations.includes(targetId)) {
      const disc = [...state.discoveredLocations, targetId];
      PlayerState.set('discoveredLocations', disc);
    }

    // 旅行消耗生存值
    SurvivalSystem.forceTick(1);

    // 如果是回到城镇，清除随机地点
    if (targetId === 'town_square' && currentRandomLocation) {
      currentRandomLocation = null;
    }

    const loc = getCurrentLocation();
    return {
      success: true,
      location: loc,
      from: oldLoc,
      message: '你来到了【' + loc.name + '】。'
    };
  }

  /** 外出探索 - 生成随机地点 */
  function explore() {
    const state = PlayerState.getState();
    if (state.currentLocation !== 'town_square') {
      return { success: false, message: '你必须从城镇广场出发才能外出探索。' };
    }

    // 检查精力
    if (state.energy < 10) {
      return { success: false, message: '你太疲惫了，无法外出探索。先休息一下吧。' };
    }

    currentRandomLocation = Locations.generateRandomLocation();
    PlayerState.set('currentLocation', currentRandomLocation.id);

    // 探索消耗更多生存值
    SurvivalSystem.forceTick(2);

    return {
      success: true,
      location: currentRandomLocation,
      message: '你离开城镇，跋涉了一段时间后，发现了【' + currentRandomLocation.name + '】！\n' + currentRandomLocation.desc
    };
  }

  /** 获取可前往的地点列表 */
  function getAvailableTravels() {
    const current = getCurrentLocation();
    if (!current) return [];

    const targets = [];
    if (current.connections) {
      for (const conn of current.connections) {
        const loc = Locations.getFixed(conn);
        if (loc) targets.push({ id: conn, name: loc.name });
      }
    }
    if (current.conditionalConnections) {
      for (var ci = 0; ci < current.conditionalConnections.length; ci++) {
        var cc = current.conditionalConnections[ci];
        var condMet = (typeof cc.condition === 'function') ? cc.condition() : true;
        if (condMet) {
          const loc = Locations.getFixed(cc.target);
          if (loc) targets.push({ id: cc.target, name: loc.name });
        }
      }
    }
    return targets;
  }

  return {
    getCurrentLocation,
    travel,
    explore,
    getAvailableTravels,
    getDiscoveredLocations: function () { return PlayerState.get('discoveredLocations'); }
  };
})();

if (typeof Logger !== 'undefined') Logger.system('map.js');
