/**
 * tech.js — 科技系统模块
 * 管理科技树、科研台研究与解锁逻辑
 */
const TechSystem = (function () {
  'use strict';

  const techTree = {
    basic_metallurgy: {
      id: 'basic_metallurgy',
      name: '基础冶金',
      desc: '掌握基础的金属冶炼与加工技术，可锻造更好的武器和防具。',
      cost: 100,
      time: 3,        // 需要点击研究的次数
      effect: '解锁锻造台建造；武器攻击力+5',
      requires: []
    },
    herbology: {
      id: 'herbology',
      name: '草药学',
      desc: '研究各种草药的药性和配方，学会制作药水。',
      cost: 80,
      time: 2,
      effect: '解锁炼药台建造；药水效果+20%',
      requires: []
    },
    architecture: {
      id: 'architecture',
      name: '建筑学',
      desc: '学习建筑原理，能建造更高级的家园设施。',
      cost: 120,
      time: 3,
      effect: '解锁高级家园设施；家园休息效果+30%',
      requires: ['basic_metallurgy']
    },
    enchanting: {
      id: 'enchanting',
      name: '附魔',
      desc: '研究魔法符文，为装备附加特殊效果。',
      cost: 200,
      time: 4,
      effect: '解锁装备附魔功能；全属性+10%',
      requires: ['herbology']
    },
    automation: {
      id: 'automation',
      name: '自动化',
      desc: '设计简易机关装置，让部分工作自动完成。',
      cost: 250,
      time: 5,
      effect: '每10秒自动获得1-3金币（研究台界面可见）',
      requires: ['architecture', 'basic_metallurgy']
    }
  };

  /** 开始研究 */
  function startResearch(techId) {
    const state = PlayerState.getState();
    if (state.currentLocation !== 'home') return { success: false, message: '你必须在家园的科研台才能进行研究。' };
    if (!state.hasHome) return { success: false, message: '你还没有建造家园。' };
    if (state.researching) return { success: false, message: '你正在研究【' + state.researching + '】，完成或取消后再开始新的研究。' };

    const tech = techTree[techId];
    if (!tech) return { success: false, message: '该科技不存在。' };

    if (state.researchedTech.includes(techId)) return { success: false, message: '你已经研究过【' + tech.name + '】了。' };

    // 检查前置
    for (const req of tech.requires) {
      if (!state.researchedTech.includes(req)) {
        return { success: false, message: '需要先研究【' + (techTree[req] ? techTree[req].name : req) + '】。' };
      }
    }

    if (state.gold < tech.cost) return { success: false, message: '金币不足！需要 ' + tech.cost + ' 金币。' };

    PlayerState.add('gold', -tech.cost);
    PlayerState.set('researching', techId);
    PlayerState.set('researchProgress', 0);

    return {
      success: true,
      message: '开始研究【' + tech.name + '】！投入了 ' + tech.cost + ' 金币。请点击"推进研究"来继续。'
    };
  }

  /** 推进研究 */
  function progressResearch() {
    const state = PlayerState.getState();
    if (!state.researching) return { success: false, message: '当前没有正在进行的研究。' };

    const tech = techTree[state.researching];
    if (!tech) {
      PlayerState.set('researching', null);
      return { success: false, message: '研究数据异常，已取消。' };
    }

    const newProgress = state.researchProgress + 1;
    PlayerState.set('researchProgress', newProgress);

    if (newProgress >= tech.time) {
      // 研究完成
      const newTechs = [...state.researchedTech, state.researching];
      PlayerState.set('researchedTech', newTechs);
      PlayerState.set('researching', null);
      PlayerState.set('researchProgress', 0);
      return {
        success: true,
        message: '研究完成！你成功解锁了【' + tech.name + '】！\n' + tech.effect
      };
    }

    return {
      success: true,
      message: '研究推进中……进度：' + newProgress + '/' + tech.time + '。还需要 ' + (tech.time - newProgress) + ' 次推进。'
    };
  }

  /** 取消研究（不退款） */
  function cancelResearch() {
    const state = PlayerState.getState();
    if (!state.researching) return { success: false, message: '当前没有正在进行的研究。' };
    const name = techTree[state.researching] ? techTree[state.researching].name : state.researching;
    PlayerState.set('researching', null);
    PlayerState.set('researchProgress', 0);
    return { success: true, message: '已取消【' + name + '】的研究（金币不退还）。' };
  }

  /** 获取科技列表 */
  function getTechList() {
    const state = PlayerState.getState();
    const list = [];
    for (const [id, tech] of Object.entries(techTree)) {
      let status = 'locked';
      if (state.researchedTech.includes(id)) {
        status = 'researched';
      } else if (state.researching === id) {
        status = 'researching';
      } else {
        // 检查前置
        let prereqMet = true;
        for (const req of tech.requires) {
          if (!state.researchedTech.includes(req)) {
            prereqMet = false;
            break;
          }
        }
        if (prereqMet && state.gold >= tech.cost) {
          status = 'available';
        } else if (prereqMet) {
          status = 'unaffordable';
        }
      }
      list.push({ ...tech, status, progress: state.researching === id ? state.researchProgress : 0 });
    }
    return list;
  }

  /** 自动化金币产出（由游戏循环调用） */
  function autoGoldTick() {
    const state = PlayerState.getState();
    if (!state.researchedTech.includes('automation')) return 0;
    const gold = 1 + Math.floor(Math.random() * 3);
    PlayerState.add('gold', gold);
    return gold;
  }

  return {
    techTree,
    startResearch,
    progressResearch,
    cancelResearch,
    getTechList,
    autoGoldTick
  };
})();

if (typeof Logger !== 'undefined') Logger.system('tech.js');
