/**
 * items.js — 统一物品数据库
 * 所有物品的唯一真实来源，采用 5 位数字 ID 编码
 * 前两位 = 类型 (01材料 02消耗品 03装备 04特殊)
 * 后三位 = 序号
 */
var ItemDB = {};

(function () {
  'use strict';

  var db = {
    // ========== 01 — 材料 ==========
    '01001': { id: '01001', name: '木材',           type: 'material', desc: '基础建筑材料，可在家园使用',              stackable: true,  price: 2 },
    '01002': { id: '01002', name: '铁矿石',          type: 'material', desc: '可冶炼的矿石，铁匠铺需要它',              stackable: true,  price: 5 },
    '01003': { id: '01003', name: '草药',            type: 'material', desc: '基础炼金材料，可制作药水',                stackable: true,  price: 3 },
    '01004': { id: '01004', name: '怪物獠牙',         type: 'material', desc: '野兽的锋利牙齿，有一定价值',              stackable: true,  price: 4 },
    '01005': { id: '01005', name: '冰晶',            type: 'material', desc: '极寒洞穴中的天然结晶，炼金材料',          stackable: true,  price: 8 },
    '01006': { id: '01006', name: '古代遗物',         type: 'material', desc: '遗迹中找到的古老物件，蕴含历史价值',      stackable: true,  price: 12 },
    '01007': { id: '01007', name: '发光苔藓',         type: 'material', desc: '洞穴深处会发光的苔藓，可做光源',          stackable: true,  price: 3 },
    '01008': { id: '01008', name: '稀有材料',         type: 'material', desc: '珍贵的合成材料，用途广泛',                stackable: true,  price: 15 },
    '01009': { id: '01009', name: '附魔宝石',         type: 'material', desc: '蕴含魔力的宝石，附魔装备所需',            stackable: true,  price: 20 },
    '01010': { id: '01010', name: '秘银矿石',         type: 'material', desc: '稀有矿石，打造高级装备的核心材料',          stackable: true,  price: 25 },
    '01011': { id: '01011', name: '龙鳞',            type: 'material', desc: '龙类生物脱落的鳞片，坚不可摧',              stackable: true,  price: 40 },
    '01012': { id: '01012', name: '魔法粉尘',         type: 'material', desc: '蕴含魔力的粉末，附魔与炼金的关键材料',      stackable: true,  price: 18 },
    '01013': { id: '01013', name: '精灵之木',         type: 'material', desc: '来自古老森林的魔法木材，用于高级建造',      stackable: true,  price: 22 },

    // ========== 02 — 消耗品 ==========
    '02001': { id: '02001', name: '干粮',            type: 'food',    desc: '恢复饥饿值30',   price: 5,  hungerRestore: 30, stackable: true },
    '02002': { id: '02002', name: '水袋',            type: 'drink',   desc: '恢复口渴值40',   price: 3,  thirstRestore: 40, stackable: true },
    '02003': { id: '02003', name: '大面包',          type: 'food',    desc: '恢复饥饿值50',   price: 8,  hungerRestore: 50, stackable: true },
    '02004': { id: '02004', name: '生命药水',         type: 'potion',  desc: '恢复生命值30',   price: 15, healthRestore: 30, stackable: true },
    '02005': { id: '02005', name: '麦酒',            type: 'drink',   desc: '恢复口渴30精力5', price: 5,  thirstRestore: 30, energyRestore: 5, stackable: true },
    '02006': { id: '02006', name: '烤肉',            type: 'food',    desc: '恢复饥饿值70',   price: 12, hungerRestore: 70, stackable: true },
    '02007': { id: '02007', name: '大生命药水',       type: 'potion',  desc: '恢复生命值60',   price: 30, healthRestore: 60, stackable: true },
    '02008': { id: '02008', name: '精力药水',         type: 'potion',  desc: '恢复精力值50',   price: 20, energyRestore: 50, stackable: true },
    '02009': { id: '02009', name: '魔法面包',         type: 'food',    desc: '恢复饥饿值40，附带微量生命恢复', price: 18, hungerRestore: 40, healthRestore: 10, stackable: true },
    '02010': { id: '02010', name: '蜂蜜酒',          type: 'drink',   desc: '恢复口渴40精力10', price: 10, thirstRestore: 40, energyRestore: 10, stackable: true },
    '02011': { id: '02011', name: '解毒药剂',         type: 'potion',  desc: '解除中毒状态（暂未实装中毒）', price: 12, stackable: true },

    // ========== 03 — 装备 ==========
    '03001': { id: '03001', name: '短剑',            type: 'weapon',  desc: '基础武器，攻击力+3',  price: 30, attackBonus: 3,  stackable: false },
    '03002': { id: '03002', name: '皮甲',            type: 'armor',   desc: '基础防具，防御力+2',  price: 25, defenseBonus: 2, stackable: false },
    '03003': { id: '03003', name: '长剑',            type: 'weapon',  desc: '精钢打造的长剑，攻击力+8',  price: 80,  attackBonus: 8,  stackable: false },
    '03004': { id: '03004', name: '铁甲',            type: 'armor',   desc: '厚重铁甲，防御力+6',        price: 70,  defenseBonus: 6, stackable: false },
    '03005': { id: '03005', name: '法师长袍',         type: 'armor',   desc: '附有魔力的长袍，防御力+4，法伤+2', price: 90, defenseBonus: 4, attackBonus: 2, stackable: false },
    '03006': { id: '03006', name: '盗贼匕首',         type: 'weapon',  desc: '淬毒匕首，攻击力+6，潜行概率+5%', price: 65, attackBonus: 6, stackable: false },
    '03007': { id: '03007', name: '战斧',            type: 'weapon',  desc: '重型战斧，攻击力+10，防御-1', price: 100, attackBonus: 10, defenseBonus: -1, stackable: false },
    '03008': { id: '03008', name: '守护者盾牌',       type: 'armor',   desc: '坚不可摧的盾牌，防御力+10',   price: 120, defenseBonus: 10, stackable: false },

    // ========== 04 — 特殊 ==========
    '04001': { id: '04001', name: '技能卷轴',         type: 'scroll',   desc: '记载古老技能的卷轴',                     stackable: false, price: 50 },
    '04002': { id: '04002', name: '开锁工具',         type: 'tool',     desc: '盗贼的常用工具，可打开锁住的宝箱',        stackable: false, price: 10 },
    '04003': { id: '04003', name: '破旧的木床',       type: 'furniture', desc: '村长赠送的简陋木床，放在家园恢复精力',    stackable: false, tutorial: true },
    '04004': { id: '04004', name: '新手面包',         type: 'food',     desc: '村长给的面包，恢复饥饿值25',              hungerRestore: 25, stackable: true,  tutorial: true },
    '04005': { id: '04005', name: '藏宝图碎片',        type: 'quest',    desc: '古老藏宝图的一部分，集齐可寻宝',          stackable: true,  price: 30 },
    '04006': { id: '04006', name: '回城卷轴',         type: 'scroll',   desc: '使用后立即返回城镇广场',                  stackable: true,  price: 25 }
  };

  ItemDB = db;

  /** 按 ID 查询 */
  function get(id) {
    return db[id] || null;
  }

  /** 按名称模糊查询 */
  function findByName(name) {
    name = (name || '').toLowerCase();
    for (var key in db) {
      if (db[key].name.toLowerCase().indexOf(name) !== -1) return db[key];
    }
    return null;
  }

  /** 按类型过滤 */
  function getByType(type) {
    var result = [];
    for (var key in db) {
      if (db[key].type === type) result.push(db[key]);
    }
    return result;
  }

  /** 获取物品显示名 */
  function getName(id) {
    var item = db[id];
    return item ? item.name : ('???' + id);
  }

  /** 创建背包物品实例（带数量） */
  function create(id, qty) {
    var item = db[id];
    if (!item) return null;
    return {
      id: id,
      name: item.name,
      type: item.type,
      qty: qty || 1,
      stackable: item.stackable !== false,
      hungerRestore: item.hungerRestore || 0,
      thirstRestore: item.thirstRestore || 0,
      healthRestore: item.healthRestore || 0,
      energyRestore: item.energyRestore || 0,
      attackBonus: item.attackBonus || 0,
      defenseBonus: item.defenseBonus || 0,
      price: item.price || 0,
      desc: item.desc || ''
    };
  }

  // 暴露到全局
  window.ItemDB = db;
  window.getItem = get;
  window.getItemName = getName;
  window.getItemByType = getByType;
  window.createItem = create;
})();

if (typeof Logger !== 'undefined') Logger.system('items.js');
