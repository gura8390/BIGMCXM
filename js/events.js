/**
 * events.js — 事件系统模块
 * 管理随机遭遇、战斗、战利品等动态事件
 */
const EventSystem = (function () {
  'use strict';

  /** 怪物定义 */
  const monsters = {
    '哥布林': { hp: 30, attack: 6, defense: 1, exp: 20, gold: [5, 15] },
    '洞穴蜘蛛': { hp: 25, attack: 5, defense: 0, exp: 15, gold: [3, 10] },
    '巨鼠': { hp: 20, attack: 4, defense: 0, exp: 10, gold: [2, 8] },
    '巢穴之主': { hp: 60, attack: 12, defense: 3, exp: 60, gold: [30, 60], isBoss: true },
    '盗贼喽啰': { hp: 25, attack: 5, defense: 1, exp: 15, gold: [8, 20] },
    '暗影斥候': { hp: 35, attack: 8, defense: 2, exp: 25, gold: [10, 25] },
    '盗贼头目': { hp: 55, attack: 10, defense: 3, exp: 50, gold: [35, 70], isBoss: true },
    '石像鬼': { hp: 40, attack: 10, defense: 4, exp: 30, gold: [15, 30] },
    '亡灵守卫': { hp: 45, attack: 9, defense: 3, exp: 35, gold: [15, 35] },
    '遗迹守护者': { hp: 80, attack: 14, defense: 5, exp: 80, gold: [50, 100], isBoss: true },
    '发光蠕虫': { hp: 20, attack: 4, defense: 0, exp: 15, gold: [5, 15] },
    '洞穴巨蜥': { hp: 40, attack: 8, defense: 2, exp: 30, gold: [10, 25] },
    '晶石巨兽': { hp: 70, attack: 13, defense: 4, exp: 70, gold: [40, 80], isBoss: true },
    '矿坑巨鼠': { hp: 30, attack: 6, defense: 1, exp: 20, gold: [8, 20] },
    '岩石傀儡': { hp: 50, attack: 9, defense: 5, exp: 35, gold: [15, 30] },
    '矿洞之主': { hp: 75, attack: 12, defense: 4, exp: 65, gold: [45, 90], isBoss: true },
    '森林狼': { hp: 28, attack: 7, defense: 1, exp: 20, gold: [5, 15] },
    '树精': { hp: 45, attack: 6, defense: 3, exp: 30, gold: [10, 20] },
    '暗影猎手': { hp: 65, attack: 11, defense: 3, exp: 55, gold: [35, 70], isBoss: true },
    '沙漠蝎': { hp: 35, attack: 9, defense: 3, exp: 25, gold: [12, 25] },
    '沙虫': { hp: 55, attack: 10, defense: 2, exp: 40, gold: [20, 40] },
    '法老之魂': { hp: 90, attack: 16, defense: 6, exp: 100, gold: [60, 120], isBoss: true },
    '冰元素': { hp: 40, attack: 8, defense: 4, exp: 30, gold: [15, 30] },
    '雪怪': { hp: 60, attack: 11, defense: 3, exp: 45, gold: [25, 50] },
    '冰霜领主': { hp: 85, attack: 15, defense: 6, exp: 90, gold: [55, 110], isBoss: true }
  };

  /** 战斗（简单回合制） */
  function fight(monsterName) {
    const monsterData = monsters[monsterName];
    if (!monsterData) return { success: false, message: '怪物数据异常。' };

    const state = PlayerState.getState();
    if (state.health <= 0) return { success: false, message: '你的生命值过低，无法战斗。' };

    let monsterHP = monsterData.hp;
    let playerHP = state.health;
    const playerAttack = ClassSystem.calcAttack();
    const playerDefense = ClassSystem.calcDefense();
    const dodgeChance = ClassSystem.calcDodgeChance();
    const sneakChance = ClassSystem.calcSneakChance();

    const battleLog = [];
    let turn = 0;
    const maxTurns = 30;

    battleLog.push('════ 战斗开始 ════');
    battleLog.push('你 vs ' + monsterName + '（HP:' + monsterHP + ' ATK:' + monsterData.attack + ' DEF:' + monsterData.defense + '）');

    // 战吼回血
    const battleHeal = ClassSystem.calcBattleHeal();
    if (battleHeal > 0) {
      const healAmount = Math.floor(state.maxHealth * battleHeal);
      playerHP = Math.min(state.maxHealth, playerHP + healAmount);
      battleLog.push('【战吼】恢复了 ' + healAmount + ' 点生命！');
    }

    // 潜行判定
    let sneakSuccess = false;
    if (sneakChance > 0 && Math.random() < sneakChance) {
      sneakSuccess = true;
      battleLog.push('【潜行】成功！你悄无声息地接近了敌人！');
    }

    while (monsterHP > 0 && playerHP > 0 && turn < maxTurns) {
      turn++;

      // 潜行成功 = 先手额外一击
      if (sneakSuccess && turn === 1) {
        const critDmg = playerAttack * 2;
        monsterHP -= critDmg;
        battleLog.push('先手偷袭造成 ' + critDmg + ' 点暴击伤害！');
        sneakSuccess = false;
        continue;
      }

      // 玩家攻击
      const dmg = Math.max(1, playerAttack - monsterData.defense + Math.floor(Math.random() * 5));
      monsterHP -= dmg;
      battleLog.push('你对 ' + monsterName + ' 造成了 ' + dmg + ' 点伤害（' + monsterHP + ' HP剩余）');

      if (monsterHP <= 0) break;

      // 怪物攻击
      const monsterDmg = Math.max(1, monsterData.attack - playerDefense + Math.floor(Math.random() * 4));

      // 闪避判定
      if (Math.random() < dodgeChance) {
        battleLog.push('【闪避】你躲开了 ' + monsterName + ' 的攻击！');
        continue;
      }

      playerHP -= monsterDmg;
      battleLog.push(monsterName + ' 对你造成了 ' + monsterDmg + ' 点伤害（你的 HP:' + playerHP + '）');
    }

    if (playerHP <= 0) {
      playerHP = 1; // 不会真的死亡
      battleLog.push('你被击败了……拖着残躯逃回了安全地带。');
      PlayerState.set('health', 1);
      // 逃回城镇
      PlayerState.set('currentLocation', 'town_square');
      return { success: false, message: battleLog.join('\n'), fled: true };
    }

    // 胜利
    const goldBase = monsterData.gold[0] + Math.floor(Math.random() * (monsterData.gold[1] - monsterData.gold[0] + 1));
    const bonusGold = Math.floor(goldBase * ClassSystem.calcBonusGold());
    const totalGold = goldBase + bonusGold;
    const exp = monsterData.exp;

    battleLog.push('你击败了 ' + monsterName + '！');
    battleLog.push('获得金币：' + totalGold + (bonusGold > 0 ? '（含妙手空空加成+' + bonusGold + '）' : ''));
    battleLog.push('获得经验：' + exp);

    PlayerState.add('gold', totalGold);
    const leveledUp = PlayerState.gainExp(exp);
    PlayerState.set('health', Math.min(state.maxHealth, playerHP));
    PlayerState.add('kills', 1);

    if (leveledUp) {
      battleLog.push('🎉 恭喜升级！当前等级：LV.' + PlayerState.get('level'));
    }

    battleLog.push('════ 战斗结束 ════');

    const result = {
      success: true,
      message: battleLog.join('\n'),
      gold: totalGold,
      exp: exp,
      leveledUp: leveledUp
    };

    // 战利品掉落
    if (monsterData.isBoss) {
      const lootChance = 0.6;
      if (Math.random() < lootChance) {
        const rareItems = [
          createItem('01008', 1), // 稀有材料
          createItem('04001', 1), // 技能卷轴
          createItem('01009', 1)  // 附魔宝石
        ];
        const item = rareItems[Math.floor(Math.random() * rareItems.length)];
        PlayerState.addItem(item);
        result.loot = item;
        result.message += '\n额外掉落：' + item.name + '！';
      }
    }

    return result;
  }

  /** 在随机地点触发探索事件 */
  function exploreArea() {
    const state = PlayerState.getState();
    const locData = MapSystem.getCurrentLocation();
    if (!locData || !locData.monster) return { success: false, message: '此地没有发现怪物。' };

    const rand = Math.random();
    if (rand < 0.4) {
      // 发现资源
      const gold = 5 + Math.floor(Math.random() * 15);
      PlayerState.add('gold', gold);
      return {
        success: true,
        message: '你仔细搜索了周围，找到了 ' + gold + ' 金币！'
      };
    } else if (rand < 0.7) {
      // 发现物品
      const items = [
        createItem('01004', 1), // 怪物獠牙
        createItem('01003', 1), // 草药
        createItem('01002', 1)  // 铁矿石
      ];
      const item = items[Math.floor(Math.random() * items.length)];
      PlayerState.addItem(item);
      return {
        success: true,
        message: '你找到了【' + item.name + '】！'
      };
    } else {
      // 战斗
      return fight(locData.monster);
    }
  }

  return {
    monsters,
    fight,
    exploreArea
  };
})();

if (typeof Logger !== 'undefined') Logger.system('events.js');
