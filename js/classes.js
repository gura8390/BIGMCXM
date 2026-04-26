/**
 * classes.js — 职业与公会系统模块
 * 定义三大公会的技能树、加入/学习/升级逻辑
 */
const ClassSystem = (function () {
  'use strict';

  const guildDefs = {
    thief: {
      id: 'thief',
      name: '盗贼公会',
      skills: {
        stealth: {
          id: 'stealth', name: '潜行', icon: '🌑',
          levels: [
            { level: 1, cost: 100, desc: '潜行 — 降低被怪物发现的概率', effect: { sneakChance: 0.2 } },
            { level: 2, cost: 250, desc: '隐匿 — 大幅降低被发现概率', effect: { sneakChance: 0.4 } },
            { level: 3, cost: 500, desc: '无形 — 几乎不会被发现', effect: { sneakChance: 0.7 } }
          ]
        },
        pickpocket: {
          id: 'pickpocket', name: '妙手空空', icon: '🤏',
          levels: [
            { level: 1, cost: 80, desc: '顺手牵羊 — 战斗后可获得额外金币', effect: { bonusGold: 0.1 } },
            { level: 2, cost: 200, desc: '探囊取物 — 额外金币增加', effect: { bonusGold: 0.25 } },
            { level: 3, cost: 450, desc: '神偷 — 大量额外金币', effect: { bonusGold: 0.5 } }
          ]
        },
        dagger_mastery: {
          id: 'dagger_mastery', name: '匕首精通', icon: '🗡️',
          levels: [
            { level: 1, cost: 120, desc: '基础匕首术 — 攻击+5', effect: { attackBonus: 5 } },
            { level: 2, cost: 300, desc: '进阶匕首术 — 攻击+12', effect: { attackBonus: 12 } },
            { level: 3, cost: 600, desc: '匕首大师 — 攻击+25', effect: { attackBonus: 25 } }
          ]
        },
        lockpick: {
          id: 'lockpick', name: '开锁', icon: '🔑',
          levels: [
            { level: 1, cost: 100, desc: '撬锁入门 — 可打开简单宝箱', effect: { lockpick: 1 } },
            { level: 2, cost: 250, desc: '专业开锁 — 可打开中等宝箱', effect: { lockpick: 2 } },
            { level: 3, cost: 500, desc: '开锁大师 — 可打开任何宝箱', effect: { lockpick: 3 } }
          ]
        }
      }
    },
    mage: {
      id: 'mage',
      name: '法师公会',
      skills: {
        fireball: {
          id: 'fireball', name: '火球术', icon: '🔥',
          levels: [
            { level: 1, cost: 150, desc: '小火球 — 攻击+8', effect: { attackBonus: 8 } },
            { level: 2, cost: 350, desc: '炎爆术 — 攻击+18', effect: { attackBonus: 18 } },
            { level: 3, cost: 700, desc: '陨石术 — 攻击+35', effect: { attackBonus: 35 } }
          ]
        },
        ice_shield: {
          id: 'ice_shield', name: '冰霜护盾', icon: '❄️',
          levels: [
            { level: 1, cost: 120, desc: '冰盾 — 防御+5', effect: { defenseBonus: 5 } },
            { level: 2, cost: 280, desc: '寒冰屏障 — 防御+12', effect: { defenseBonus: 12 } },
            { level: 3, cost: 550, desc: '绝对零度 — 防御+25', effect: { defenseBonus: 25 } }
          ]
        },
        teleport: {
          id: 'teleport', name: '传送术', icon: '🌀',
          levels: [
            { level: 1, cost: 200, desc: '短距传送 — 战斗中有概率闪避', effect: { dodgeChance: 0.15 } },
            { level: 2, cost: 400, desc: '城镇传送 — 可随时返回城镇', effect: { townTeleport: true } },
            { level: 3, cost: 800, desc: '群体传送 — 闪避概率大幅提升', effect: { dodgeChance: 0.35 } }
          ]
        },
        alchemy: {
          id: 'alchemy', name: '炼金术', icon: '⚗️',
          levels: [
            { level: 1, cost: 100, desc: '基础炼金 — 可制作小药水', effect: { alchemy: 1 } },
            { level: 2, cost: 250, desc: '进阶炼金 — 可制作中药水', effect: { alchemy: 2 } },
            { level: 3, cost: 500, desc: '炼金大师 — 可制作大药水', effect: { alchemy: 3 } }
          ]
        }
      }
    },
    warrior: {
      id: 'warrior',
      name: '战士公会',
      skills: {
        power_strike: {
          id: 'power_strike', name: '猛击', icon: '💥',
          levels: [
            { level: 1, cost: 120, desc: '重击 — 攻击+7', effect: { attackBonus: 7 } },
            { level: 2, cost: 300, desc: '粉碎打击 — 攻击+16', effect: { attackBonus: 16 } },
            { level: 3, cost: 600, desc: '毁灭一击 — 攻击+30', effect: { attackBonus: 30 } }
          ]
        },
        iron_defense: {
          id: 'iron_defense', name: '铁壁防御', icon: '🛡️',
          levels: [
            { level: 1, cost: 120, desc: '稳固防御 — 防御+6', effect: { defenseBonus: 6 } },
            { level: 2, cost: 280, desc: '铁壁 — 防御+14', effect: { defenseBonus: 14 } },
            { level: 3, cost: 550, desc: '不破之盾 — 防御+28', effect: { defenseBonus: 28 } }
          ]
        },
        battle_cry: {
          id: 'battle_cry', name: '战吼', icon: '📯',
          levels: [
            { level: 1, cost: 100, desc: '激励 — 战斗开始恢复10%生命', effect: { battleHeal: 0.10 } },
            { level: 2, cost: 250, desc: '咆哮 — 恢复20%生命', effect: { battleHeal: 0.20 } },
            { level: 3, cost: 500, desc: '不屈战吼 — 恢复35%生命', effect: { battleHeal: 0.35 } }
          ]
        },
        toughness: {
          id: 'toughness', name: '坚韧', icon: '💪',
          levels: [
            { level: 1, cost: 100, desc: '强壮 — 最大生命+15', effect: { maxHealthBonus: 15 } },
            { level: 2, cost: 250, desc: '坚韧不拔 — 最大生命+35', effect: { maxHealthBonus: 35 } },
            { level: 3, cost: 500, desc: '钢铁之躯 — 最大生命+60', effect: { maxHealthBonus: 60 } }
          ]
        }
      }
    }
  };

  /** 加入公会 */
  function joinGuild(guildId) {
    const state = PlayerState.getState();
    const guild = guildDefs[guildId];
    if (!guild) return { success: false, message: '该公会不存在。' };
    if (state.guild) return { success: false, message: '你已经加入了' + (guildDefs[state.guild] ? guildDefs[state.guild].name : '') + '，无法再加入其他公会。' };
    if (state.currentLocation !== guildId + '_guild') return { success: false, message: '你必须在公会内才能加入。' };

    PlayerState.set('guild', guildId);
    PlayerState.set('skills', {});

    return {
      success: true,
      message: '你正式加入了' + guild.name + '！从今天起，你就是我们的一员了。你可以在公会中学习专属技能。'
    };
  }

  /** 学习技能 */
  function learnSkill(skillId) {
    const state = PlayerState.getState();
    if (!state.guild) return { success: false, message: '你还没有加入任何公会。' };
    const guild = guildDefs[state.guild];
    if (!guild) return { success: false, message: '公会数据错误。' };

    const skillDef = guild.skills[skillId];
    if (!skillDef) return { success: false, message: '该技能不存在。' };

    if (state.skills[skillId]) return { success: false, message: '你已经学会了' + skillDef.name + '，可以升级它。' };

    const level1 = skillDef.levels[0];
    if (state.gold < level1.cost) return { success: false, message: '金币不足！需要 ' + level1.cost + ' 金币。' };

    PlayerState.add('gold', -level1.cost);
    const newSkills = { ...state.skills, [skillId]: 1 };
    PlayerState.set('skills', newSkills);

    return {
      success: true,
      message: '你学会了【' + skillDef.name + ' LV.1】！\n' + level1.desc
    };
  }

  /** 升级技能 */
  function upgradeSkill(skillId) {
    const state = PlayerState.getState();
    if (!state.guild) return { success: false, message: '你还没有加入任何公会。' };
    const guild = guildDefs[state.guild];
    if (!guild) return { success: false, message: '公会数据错误。' };

    const skillDef = guild.skills[skillId];
    if (!skillDef) return { success: false, message: '该技能不存在。' };

    const currentLevel = state.skills[skillId] || 0;
    if (currentLevel >= 3) return { success: false, message: skillDef.name + ' 已达最高等级（LV.3）。' };
    if (currentLevel === 0) return { success: false, message: '你还没有学习' + skillDef.name + '，需要先学习。' };

    const nextLevel = skillDef.levels[currentLevel]; // currentLevel=1 => index 1
    if (!nextLevel) return { success: false, message: '无法升级。' };
    if (state.gold < nextLevel.cost) return { success: false, message: '金币不足！需要 ' + nextLevel.cost + ' 金币。' };

    PlayerState.add('gold', -nextLevel.cost);
    const newSkills = { ...state.skills, [skillId]: currentLevel + 1 };
    PlayerState.set('skills', newSkills);

    return {
      success: true,
      message: skillDef.name + ' 升级至 LV.' + (currentLevel + 1) + '！\n' + nextLevel.desc
    };
  }

  /** 获取技能列表 */
  function getSkillsForGuild(guildId) {
    const guild = guildDefs[guildId];
    if (!guild) return null;
    return guild.skills;
  }

  /** 构建全公会技能平表（用于跨公会技能计算） */
  function _buildAllSkillDefs() {
    var map = {};
    for (var gid in guildDefs) {
      var guild = guildDefs[gid];
      for (var sid in guild.skills) {
        map[sid] = guild.skills[sid];
      }
    }
    return map;
  }

  var _allSkillDefs = _buildAllSkillDefs();

  /** 获取技能定义的通用方法 */
  function _getSkillDef(skillId) {
    return _allSkillDefs[skillId] || null;
  }

  /** 计算总攻击力（基于所有已学技能，不限于当前公会） */
  function calcAttack() {
    var state = PlayerState.getState();
    var base = 5 + state.level * 2;
    var skills = state.skills || {};
    for (var skillId in skills) {
      var level = skills[skillId];
      if (level < 1) continue;
      var skillDef = _allSkillDefs[skillId];
      if (skillDef && skillDef.levels[level - 1] && skillDef.levels[level - 1].effect.attackBonus) {
        base += skillDef.levels[level - 1].effect.attackBonus;
      }
    }
    return base;
  }

  /** 计算总防御力（基于所有已学技能） */
  function calcDefense() {
    var state = PlayerState.getState();
    var base = 2 + state.level;
    var skills = state.skills || {};
    for (var skillId in skills) {
      var level = skills[skillId];
      if (level < 1) continue;
      var skillDef = _allSkillDefs[skillId];
      if (skillDef && skillDef.levels[level - 1] && skillDef.levels[level - 1].effect.defenseBonus) {
        base += skillDef.levels[level - 1].effect.defenseBonus;
      }
    }
    return base;
  }

  /** 获取闪避概率（基于所有已学技能） */
  function calcDodgeChance() {
    var state = PlayerState.getState();
    var dodge = 0;
    var skills = state.skills || {};
    for (var skillId in skills) {
      var level = skills[skillId];
      if (level < 1) continue;
      var skillDef = _allSkillDefs[skillId];
      if (skillDef && skillDef.levels[level - 1] && skillDef.levels[level - 1].effect.dodgeChance != null) {
        dodge = Math.max(dodge, skillDef.levels[level - 1].effect.dodgeChance);
      }
    }
    return dodge;
  }

  /** 获取潜行概率（基于 stealth 技能等级） */
  function calcSneakChance() {
    var state = PlayerState.getState();
    var level = state.skills['stealth'] || 0;
    if (level < 1) return 0;
    var skillDef = _allSkillDefs['stealth'];
    if (skillDef && skillDef.levels[level - 1]) {
      return skillDef.levels[level - 1].effect.sneakChance || 0;
    }
    return 0;
  }

  /** 战吼回血比例（基于 battle_cry 技能等级） */
  function calcBattleHeal() {
    var state = PlayerState.getState();
    var level = state.skills['battle_cry'] || 0;
    if (level < 1) return 0;
    var skillDef = _allSkillDefs['battle_cry'];
    if (skillDef && skillDef.levels[level - 1]) {
      return skillDef.levels[level - 1].effect.battleHeal || 0;
    }
    return 0;
  }

  /** 额外金币比例（基于 pickpocket 技能等级） */
  function calcBonusGold() {
    var state = PlayerState.getState();
    var level = state.skills['pickpocket'] || 0;
    if (level < 1) return 0;
    var skillDef = _allSkillDefs['pickpocket'];
    if (skillDef && skillDef.levels[level - 1]) {
      return skillDef.levels[level - 1].effect.bonusGold || 0;
    }
    return 0;
  }

  function getGuildDefs() {
    return guildDefs;
  }

  return {
    guildDefs,
    joinGuild,
    learnSkill,
    upgradeSkill,
    getSkillsForGuild,
    calcAttack,
    calcDefense,
    calcDodgeChance,
    calcSneakChance,
    calcBattleHeal,
    calcBonusGold,
    getGuildDefs
  };
})();

if (typeof Logger !== 'undefined') Logger.system('classes.js');
