/**
 * home.js — 家园系统模块
 * 管理房屋建造、设施添加及设施效果
 */
const HomeSystem = (function () {
  'use strict';

  const facilities = {
    bed: {
      id: 'bed',
      name: '木床',
      desc: '一张松软的木质床铺，能让你得到充分的休息。',
      cost: 30,
      effect: '休息时精力恢复+20，额外恢复5点生命'
    },
    kitchen: {
      id: 'kitchen',
      name: '厨房',
      desc: '一个简陋但功能齐全的灶台和食材储藏区。',
      cost: 50,
      effect: '在家园中饥饿值不再自动下降，可烹饪食物'
    },
    fireplace: {
      id: 'fireplace',
      name: '壁炉',
      desc: '石头砌成的壁炉，冬天时提供温暖。',
      cost: 25,
      effect: '在家园中体温缓慢恢复至正常水平'
    },
    well: {
      id: 'well',
      name: '水井',
      desc: '一口深井，水源清澈甘甜。',
      cost: 20,
      effect: '在家园中口渴值不再自动下降'
    },
    storage: {
      id: 'storage',
      name: '储物箱',
      desc: '结实的木箱，用来存放多余的物资。',
      cost: 15,
      effect: '背包容量+10格'
    },
    alchemy_station: {
      id: 'alchemy_station',
      name: '炼药台',
      desc: '一张摆放着烧瓶和药草的石台，用来炼制药剂。',
      cost: 40,
      effect: '解锁药水制作功能',
      requiresTech: 'herbology'
    },
    forge: {
      id: 'forge',
      name: '锻造台',
      desc: '一个铁砧和熔炉，可以打造和强化装备。',
      cost: 60,
      effect: '解锁装备打造功能',
      requiresTech: 'basic_metallurgy'
    }
  };

  /** 建造家园 */
  function buildHome() {
    const state = PlayerState.getState();
    if (state.hasHome) return { success: false, message: '你已经拥有家园了。' };
    if (state.gold < 80) return { success: false, message: '建造家园需要 80 金币，你的金币不足。' };
    if (state.currentLocation !== 'town_square') return { success: false, message: '你必须在城镇广场才能建造家园。' };

    PlayerState.add('gold', -80);
    PlayerState.set('hasHome', true);
    PlayerState.set('homeFacilities', []);

    return {
      success: true,
      message: '你在城镇边缘建造了一座简陋的小屋！虽然不大，但足够遮风避雨了。现在你可以前往家园，开始添置设施。'
    };
  }

  /** 建造设施 */
  function buildFacility(facilityId) {
    const state = PlayerState.getState();
    if (!state.hasHome) return { success: false, message: '你还没有家园。' };
    if (state.currentLocation !== 'home') return { success: false, message: '你必须在家园中才能建造设施。' };

    const fac = facilities[facilityId];
    if (!fac) return { success: false, message: '该设施不存在。' };

    if (state.homeFacilities.includes(facilityId)) return { success: false, message: fac.name + ' 已经建造过了。' };

    // 检查科技前置
    if (fac.requiresTech && !state.researchedTech.includes(fac.requiresTech)) {
      return { success: false, message: '建造 ' + fac.name + ' 需要先研究【' + getTechName(fac.requiresTech) + '】科技。' };
    }

    if (state.gold < fac.cost) return { success: false, message: '金币不足！需要 ' + fac.cost + ' 金币。' };

    PlayerState.add('gold', -fac.cost);
    const newFac = [...state.homeFacilities, facilityId];
    PlayerState.set('homeFacilities', newFac);

    return {
      success: true,
      message: '你建造了【' + fac.name + '】！\n' + fac.effect
    };
  }

  function getTechName(techId) {
    const map = { basic_metallurgy: '基础冶金', herbology: '草药学', architecture: '建筑学', enchanting: '附魔', automation: '自动化' };
    return map[techId] || techId;
  }

  /** 获取可建造设施列表 */
  function getAvailableFacilities() {
    const state = PlayerState.getState();
    const available = [];
    for (const [id, fac] of Object.entries(facilities)) {
      if (state.homeFacilities.includes(id)) continue;
      let canBuild = true;
      let reason = '';
      if (fac.requiresTech && !state.researchedTech.includes(fac.requiresTech)) {
        canBuild = false;
        reason = '需要科技：' + getTechName(fac.requiresTech);
      }
      if (state.gold < fac.cost) {
        canBuild = false;
        reason = '金币不足 (' + fac.cost + 'G)';
      }
      available.push({ ...fac, canBuild, reason });
    }
    return available;
  }

  function getFacilityDef(id) {
    return facilities[id] || null;
  }

  function getAllFacilities() {
    return facilities;
  }

  return {
    buildHome,
    buildFacility,
    getAvailableFacilities,
    getFacilityDef,
    getAllFacilities
  };
})();

if (typeof Logger !== 'undefined') Logger.system('home.js');
