/**
 * locations.js — 地点定义模块
 * 包含所有固定地点和随机地点模板的数据定义
 */
const Locations = (function () {
  'use strict';

  /** 固定地点 */
  const fixed = {

    town_square: {
      id: 'town_square',
      name: '城镇广场',
      desc: '繁华的城镇中心广场，石板铺就的地面上人来人往。中央的喷泉在阳光下折射出彩虹。四周通往各个重要场所。',
      connections: ['guild_district', 'market', 'tavern', 'blacksmith'],
      conditionalConnections: [
        { target: 'home', condition: function () { return PlayerState.get('hasHome'); } },
        { target: 'royal_capital', condition: function () { var s = PlayerState.getState(); return s.level >= 10 && s.discoveredLocations.indexOf('royal_capital') !== -1; } }
      ],
      actions: [
        { id: 'rest', label: '休息片刻', desc: '在广场长椅上歇息，恢复少许精力', fn: 'travel_rest' },
        { id: 'explore', label: '外出探索', desc: '离开城镇，前往未知区域冒险', fn: 'travel_explore' },
        { id: 'build_home', label: '🏠 建造家园 (80G)', desc: '在城镇边缘建造属于自己的小屋', fn: 'home_build', condition: function () { var s = PlayerState.getState(); return !s.hasHome && s.gold >= 80; } }
      ]
    },

    guild_district: {
      id: 'guild_district',
      name: '公会区',
      desc: '一条宽阔的大道，两旁矗立着三座宏伟的建筑——盗贼公会藏于阴影之中，法师公会塔尖闪烁奥术光芒，战士公会门前立着巨剑雕像。',
      connections: ['town_square', 'thief_guild', 'mage_guild', 'warrior_guild']
    },

    thief_guild: {
      id: 'thief_guild',
      name: '盗贼公会 - 暗影之握',
      desc: '昏暗的大厅中只有几根蜡烛提供微弱光线。戴着兜帽的成员们无声地穿梭。墙上挂着的告示板上钉满了悬赏任务。',
      guild: 'thief',
      connections: ['guild_district'],
      actions: [
        { id: 'join_thief', label: '加入盗贼公会', fn: 'guild_join', arg: 'thief' },
        { id: 'learn_skill', label: '学习技能', fn: 'guild_learn_skill' },
        { id: 'upgrade_skill', label: '升级技能', fn: 'guild_upgrade_skill' }
      ]
    },

    mage_guild: {
      id: 'mage_guild',
      name: '法师公会 - 奥术之塔',
      desc: '高耸的塔楼内，空气中弥漫着魔法的气息。书架从地板延伸到天花板，魔法符纹在墙壁上微微发光。学者们围着长桌讨论着古老的咒语。',
      guild: 'mage',
      connections: ['guild_district'],
      actions: [
        { id: 'join_mage', label: '加入法师公会', fn: 'guild_join', arg: 'mage' },
        { id: 'learn_skill', label: '学习技能', fn: 'guild_learn_skill' },
        { id: 'upgrade_skill', label: '升级技能', fn: 'guild_upgrade_skill' }
      ]
    },

    warrior_guild: {
      id: 'warrior_guild',
      name: '战士公会 - 钢铁誓言',
      desc: '大厅中回荡着刀剑交击的声音。训练场上战士们在切磋武艺，角落里陈列着历代英雄的盔甲和武器。火盆在石柱间熊熊燃烧。',
      guild: 'warrior',
      connections: ['guild_district'],
      actions: [
        { id: 'join_warrior', label: '加入战士公会', fn: 'guild_join', arg: 'warrior' },
        { id: 'learn_skill', label: '学习技能', fn: 'guild_learn_skill' },
        { id: 'upgrade_skill', label: '升级技能', fn: 'guild_upgrade_skill' }
      ]
    },

    market: {
      id: 'market',
      name: '市场',
      desc: '热闹的集市上，商贩们叫卖着各种商品。从食物饮水到武器防具，应有尽有。讨价还价的声音此起彼伏。',
      connections: ['town_square'],
      actions: [
        { id: 'buy_food', label: '购买干粮 (5金币)', fn: 'market_buy', arg: 'food' },
        { id: 'buy_water', label: '购买水袋 (3金币)', fn: 'market_buy', arg: 'water' },
        { id: 'buy_potion', label: '购买生命药水 (15金币)', fn: 'market_buy', arg: 'potion' },
        { id: 'buy_bread', label: '购买面包 (8金币)', fn: 'market_buy', arg: 'bread' }
      ]
    },

    tavern: {
      id: 'tavern',
      name: '酒馆 - 旅人驿站',
      desc: '温暖的炉火照亮了整个酒馆。空气中飘散着麦酒的香气和烤肉的焦香。角落里吟游诗人拨弄着鲁特琴，讲述着远方的传说。',
      connections: ['town_square'],
      actions: [
        { id: 'eat_meal', label: '享用大餐 (10金币)', desc: '恢复大量饥饿值', fn: 'tavern_eat' },
        { id: 'drink_ale', label: '喝杯麦酒 (5金币)', desc: '恢复口渴值', fn: 'tavern_drink' },
        { id: 'rumor', label: '打听消息 (免费)', desc: '或许能发现新地点的线索', fn: 'tavern_rumor' }
      ]
    },

    home: {
      id: 'home',
      name: '我的家园',
      desc: '你在城镇边缘建造的温馨小屋。虽然不大，但足够遮风避雨。可以在这里休息、研究科技、建造更多设施。',
      connections: ['town_square'],
      customDesc: function () {
        const fac = PlayerState.get('homeFacilities');
        if (fac.length === 0) return '你的小屋还很简陋，只有四面墙壁和一个屋顶。需要添置一些家具和设施。';
        const names = { bed: '木床', kitchen: '厨房', fireplace: '壁炉', well: '水井', storage: '储物箱', alchemy_station: '炼药台', forge: '锻造台' };
        return '你的小屋已经配备了：' + fac.map(f => names[f] || f).join('、') + '。小屋逐渐有了家的样子。';
      },
      actions: [
        { id: 'rest_home', label: '在床上休息', desc: '大幅恢复精力与生命', fn: 'home_rest' },
        { id: 'build', label: '建造设施', desc: '修建新的家居设施', fn: 'home_build' },
        { id: 'research', label: '科研台', desc: '研究新技术', fn: 'tech_research' }
      ]
    },

    blacksmith: {
      id: 'blacksmith',
      name: '铁匠铺',
      desc: '叮叮当当的打铁声从铺子里传出。墙上挂满了各式武器和盔甲。老铁匠抬头看了你一眼，继续挥舞着铁锤。',
      connections: ['town_square'],
      actions: [
        { id: 'visit_blacksmith', label: '查看商品', fn: 'open_shop_blacksmith' }
      ]
    },

    royal_capital: {
      id: 'royal_capital',
      name: '王都 - 光辉之城',
      desc: '宏伟的王都矗立在远处山丘之上，高耸的白色城墙在阳光下熠熠生辉。守卫森严的城门两侧伫立着巨大的骑士雕像。街道铺着光滑的大理石，贵族马车与冒险者穿梭其间。这里汇聚了王国最顶尖的工匠、学者与战士。',
      connections: ['town_square'],
      isRoyal: true
    }
  };

  /** 随机地点模板 */
  const randomTemplates = [
    {
      id: 'monster_nest',
      name: '怪物巢穴',
      desc: '一股腐臭的气味扑面而来。洞穴深处传来低沉的咆哮声，地面上散落着不知名生物的骨骸。',
      difficulty: 2,
      monsters: ['哥布林', '洞穴蜘蛛', '巨鼠'],
      bossChance: 0.2,
      bossName: '巢穴之主',
      loot: [{ id: 'gold', qty: [10, 30] }, { id: 'monster_fang', qty: [1, 3] }],
      survivalMod: { thirst: -3, energy: -3 }
    },
    {
      id: 'thief_den',
      name: '盗贼据点',
      desc: '隐蔽的山谷中搭建着简陋的营地。篝火的余烬还在冒烟，显然不久前还有人在这里活动。',
      difficulty: 1,
      monsters: ['盗贼喽啰', '暗影斥候'],
      bossChance: 0.15,
      bossName: '盗贼头目',
      loot: [{ id: 'gold', qty: [15, 40] }, { id: 'lockpick', qty: [1, 2] }],
      survivalMod: { thirst: -2, hunger: -2 }
    },
    {
      id: 'ancient_ruins',
      name: '古老遗迹',
      desc: '残破的石柱和倒塌的拱门诉说着昔日的辉煌。苔藓覆盖的石板上刻着无法辨认的文字。空气中弥漫着古老魔法的残留。',
      difficulty: 3,
      monsters: ['石像鬼', '亡灵守卫'],
      bossChance: 0.25,
      bossName: '遗迹守护者',
      loot: [{ id: 'gold', qty: [20, 50] }, { id: 'ancient_relic', qty: [1, 1] }],
      survivalMod: { thirst: -2, energy: -4 }
    },
    {
      id: 'mysterious_cave',
      name: '神秘洞穴',
      desc: '洞穴入口闪烁着奇异的蓝色光芒。洞壁上生长着发光的苔藓，将整个洞穴映照得如梦似幻。',
      difficulty: 2,
      monsters: ['发光蠕虫', '洞穴巨蜥'],
      bossChance: 0.2,
      bossName: '晶石巨兽',
      loot: [{ id: 'gold', qty: [15, 35] }, { id: 'glowing_moss', qty: [1, 3] }],
      survivalMod: { thirst: -3, energy: -2 }
    },
    {
      id: 'abandoned_mine',
      name: '废弃矿井',
      desc: '年久失修的矿井入口已经长满了杂草。矿车的轨道锈迹斑斑，铁镐和矿灯散落一地。深处似乎还有人在开采。',
      difficulty: 2,
      monsters: ['矿坑巨鼠', '岩石傀儡'],
      bossChance: 0.2,
      bossName: '矿洞之主',
      loot: [{ id: 'gold', qty: [25, 60] }, { id: 'iron_ore', qty: [2, 5] }],
      survivalMod: { thirst: -2, energy: -3 }
    },
    {
      id: 'dark_forest',
      name: '幽暗森林',
      desc: '参天古树的枝叶遮蔽了大部分阳光。浓雾在林间弥漫，看不清楚前方的道路。远处传来狼嚎，令人不寒而栗。',
      difficulty: 2,
      monsters: ['森林狼', '树精'],
      bossChance: 0.2,
      bossName: '暗影猎手',
      loot: [{ id: 'gold', qty: [10, 25] }, { id: 'herb', qty: [2, 4] }],
      survivalMod: { thirst: -1, hunger: -3, bodyTemp: -0.5 }
    },
    {
      id: 'desert_ruins',
      name: '沙漠遗迹',
      desc: '烈日炙烤着黄沙，一座古老金字塔的残骸露出沙面。干燥的热风卷起沙粒，每一口呼吸都带走身体的水分。',
      difficulty: 3,
      monsters: ['沙漠蝎', '沙虫'],
      bossChance: 0.3,
      bossName: '法老之魂',
      loot: [{ id: 'gold', qty: [30, 80] }, { id: 'ancient_relic', qty: [1, 2] }],
      survivalMod: { thirst: -6, energy: -3, bodyTemp: 1.5 }
    },
    {
      id: 'frozen_cave',
      name: '冰霜洞穴',
      desc: '刺骨的寒风从洞穴深处吹来。冰柱悬挂在洞顶，反射着幽蓝的光。呼出的气息在空中凝成白雾，每一步都要小心冰面的光滑。',
      difficulty: 3,
      monsters: ['冰元素', '雪怪'],
      bossChance: 0.25,
      bossName: '冰霜领主',
      loot: [{ id: 'gold', qty: [20, 50] }, { id: 'ice_crystal', qty: [1, 3] }],
      survivalMod: { thirst: -1, energy: -4, bodyTemp: -2 }
    }
  ];

  /** 根据模板生成一个随机地点 */
  function generateRandomLocation() {
    const template = randomTemplates[Math.floor(Math.random() * randomTemplates.length)];
    const hasBoss = Math.random() < template.bossChance;
    const monster = template.monsters[Math.floor(Math.random() * template.monsters.length)];

    const instance = {
      id: template.id + '_' + Date.now(),
      name: template.name,
      desc: template.desc,
      difficulty: template.difficulty,
      monster: hasBoss ? template.bossName : monster,
      isBoss: hasBoss,
      loot: JSON.parse(JSON.stringify(template.loot)),
      survivalMod: { ...template.survivalMod },
      explored: false,
      cleared: false,
      actions: [
        { id: 'explore_area', label: '探索此地', fn: 'random_explore' },
        { id: 'fight', label: '战斗', fn: 'random_fight' },
        { id: 'leave_area', label: '离开此地', fn: 'travel_town_square' }
      ]
    };
    return instance;
  }

  /** 获取固定地点 */
  function getFixed(id) {
    const loc = fixed[id];
    if (!loc) return null;
    return JSON.parse(JSON.stringify(loc));
  }

  return {
    fixed,
    randomTemplates,
    generateRandomLocation,
    getFixed
  };
})();

if (typeof Logger !== 'undefined') Logger.system('locations.js');
