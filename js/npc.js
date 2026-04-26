/**
 * npc.js — NPC 交互系统模块
 * 管理城镇NPC定义、对话树、交易与攻击交互
 */
const NPCSystem = (function () {
  'use strict';

  /** NPC 对话状态记忆 */
  let npcMemory = {}; // { npcId: { timesTalked, questState, tradesToday } }

  const npcDefs = {

    chief: {
      id: 'chief',
      name: '老村长',
      title: '城镇管理者',
      location: 'town_square',
      description: '一位白发苍苍但精神矍铄的老者，手持橡木拐杖，眼神中透着慈祥与智慧。他是这个城镇的管理者，对每位冒险者都充满关怀。',
      type: 'quest_giver',
      dialogTree: {
        greeting: {
          text: function () {
            const s = PlayerState.getState();
            const mem = getMemory('chief');
            if (mem.timesTalked === 0) {
              return '啊，一位新来的冒险者！欢迎来到我们的城镇。我是这里的村长，大家叫我老查理就行。有什么我能帮你的吗？';
            }
            return '又见面了，' + s.name + '。今天有什么需要吗？';
          },
          options: function () {
            var s = PlayerState.getState();
            var opts = [
              { id: 'about_town', label: '介绍一下这个城镇', response: '我们的城镇虽然不大，但设施齐全。广场周围有公会区、市场和酒馆。如果你想在这里安家，花80金币就能在城镇边缘建造小屋。' },
              { id: 'about_adventure', label: '冒险建议', response: '新手的话，建议先去酒馆打听消息，然后加入一个公会学习技能。外出探索前记得带上足够的食物和水。野外有怪物巢穴和古老遗迹等待发现。' },
              { id: 'about_guild', label: '关于公会', response: '城镇的公会区有三家公会——盗贼公会适合灵巧型冒险者，法师公会专研魔法，战士公会则训练近战技巧。每人只能加入一家，慎重选择。' },
              { id: 'about_home', label: '关于建造家园', response: '如果你有80金币，就可以在广场市政官那里登记建造家园。之后可以在家园中建造床铺、厨房等设施，还可以通过科研台研究新技术。' }
            ];
            // 王都解锁条件：等级 >= 10
            if (s.level >= 10) {
              var hasDiscovered = s.discoveredLocations.indexOf('royal_capital') !== -1;
              if (!hasDiscovered && s.gold >= 15000) {
                opts.push({ id: 'royal_capital', label: '🚩 前往王都 (15000G)', response: null, action: 'unlock_royal' });
              } else if (hasDiscovered) {
                opts.push({ id: 'royal_capital_info', label: '关于王都', response: '你已经可以自由前往王都了。那里汇聚了王国最顶尖的人才，祝你好运！' });
              } else {
                opts.push({ id: 'royal_capital_hint', label: '关于外面的世界', response: '听说北方有一座宏伟的王都——光辉之城。只有真正的强者（Lv.10以上）才被允许入城，而且还需要15000金币的入城费。继续努力吧！' });
              }
            }
            opts.push({ id: 'farewell', label: '告辞', response: '祝你冒险顺利，年轻人！' });
            return opts;
          }
        }
      },
      onTalk: function () {
        const mem = getMemory('chief');
        mem.timesTalked = (mem.timesTalked || 0) + 1;
        return null; // 使用 dialogTree 默认处理
      },
      friendly: true
    },

    merchant_hans: {
      id: 'merchant_hans',
      name: '商人汉斯',
      title: '杂货商人',
      location: 'market',
      description: '一个微胖的中年商人，脸上总是挂着精明的笑容。他的摊位上摆满了各种旅行必需品。',
      type: 'merchant',
      dialogTree: {
        greeting: {
          text: function () {
            const mem = getMemory('merchant_hans');
            if (mem.timesTalked === 0) {
              return '嘿，冒险者！看看我的货摊吧，都是野外生存的必需品。干粮、水袋、药水，应有尽有！';
            }
            return '欢迎回来！今天需要补充些什么？老顾客我给你算便宜点。';
          },
          options: [
            { id: 'trade', label: '看看商品', response: null, action: 'open_trade' },
            { id: 'about_items', label: '有什么推荐？', response: '干粮和水袋是出门必备。如果你要去危险的地方，生命药水能救命。大面包比干粮抗饿，就是贵了点。' },
            { id: 'farewell', label: '下次再来', response: '一路平安，冒险者！' }
          ]
        }
      },
      tradeInventory: {
        buy: [
          { id: 'food', name: '干粮', price: 5, type: 'food', hungerRestore: 30, desc: '恢复饥饿值30' },
          { id: 'water', name: '水袋', price: 3, type: 'drink', thirstRestore: 40, desc: '恢复口渴值40' },
          { id: 'potion', name: '生命药水', price: 15, type: 'potion', healthRestore: 30, desc: '恢复生命值30' },
          { id: 'bread', name: '大面包', price: 8, type: 'food', hungerRestore: 50, desc: '恢复饥饿值50' }
        ],
        sell: [] // 玩家卖给商人的物品列表
      },
      onTalk: function () {
        const mem = getMemory('merchant_hans');
        mem.timesTalked = (mem.timesTalked || 0) + 1;
        return null;
      },
      friendly: true
    },

    guild_master_thief: {
      id: 'guild_master_thief',
      name: '影刃·凯恩',
      title: '盗贼公会会长',
      location: 'thief_guild',
      description: '一位身形修长、动作敏捷的男子，脸庞隐藏在兜帽的阴影下。他说话声音很低，但每个字都带着权威。',
      type: 'guild_master',
      guildId: 'thief',
      dialogTree: {
        greeting: {
          text: function () {
            const s = PlayerState.getState();
            if (s.guild === 'thief') {
              return '凯恩微微点头："欢迎回来，我的兄弟。有什么需要训练的？"';
            }
            return '凯恩从阴影中审视着你："你看起来有点潜力。想加入暗影之握吗？我们不需要光明正大的英雄，只需要能完成任务的人。"';
          },
          options: function () {
            const s = PlayerState.getState();
            const opts = [];
            if (s.guild !== 'thief' && !s.guild) {
              opts.push({ id: 'join', label: '加入盗贼公会', response: '很好。记住我们的信条：在暗影中行动，不留下痕迹。现在你是我们的一员了。', action: 'guild_join_thief' });
            } else if (s.guild === 'thief') {
              opts.push({ id: 'skills', label: '查看技能', response: null, action: 'guild_learn_skill' });
              opts.push({ id: 'upgrade', label: '升级技能', response: null, action: 'guild_upgrade_skill' });
            }
            opts.push({ id: 'about', label: '聊聊盗贼之道', response: '潜行、妙手空空、匕首精通、开锁——这是暗影之握的四大绝技。在战斗中潜行可以打出先手偷袭，妙手空空能让你获得额外的金币。' });
            opts.push({ id: 'farewell', label: '告退', response: '暗影庇护你。' });
            return opts;
          }
        }
      },
      onTalk: function () { return null; },
      friendly: true
    },

    guild_master_mage: {
      id: 'guild_master_mage',
      name: '奥术师·艾琳',
      title: '法师公会会长',
      location: 'mage_guild',
      description: '身穿蓝色法袍的女性精灵，银色的长发在魔法光芒中微微飘动。她手中的法杖顶端悬浮着一颗不断旋转的水晶球。',
      type: 'guild_master',
      guildId: 'mage',
      dialogTree: {
        greeting: {
          text: function () {
            const s = PlayerState.getState();
            if (s.guild === 'mage') {
              return '艾琳优雅地挥手："啊，我的学徒，魔法的道路永无止境。今天想学些什么？"';
            }
            return '艾琳用睿智的目光看着你："我能感应到你体内的魔力潜质。你想加入奥术之塔，学习真正的魔法吗？"';
          },
          options: function () {
            const s = PlayerState.getState();
            const opts = [];
            if (s.guild !== 'mage' && !s.guild) {
              opts.push({ id: 'join', label: '加入法师公会', response: '欢迎来到奥术之塔。魔法需要智慧与耐心，但回报是无穷的。现在开始你的魔法之路吧。', action: 'guild_join_mage' });
            } else if (s.guild === 'mage') {
              opts.push({ id: 'skills', label: '查看技能', response: null, action: 'guild_learn_skill' });
              opts.push({ id: 'upgrade', label: '升级技能', response: null, action: 'guild_upgrade_skill' });
            }
            opts.push({ id: 'about', label: '聊聊魔法', response: '火球术是最直接的攻击魔法，冰霜护盾保护自身，传送术让你在战场上灵活移动，而炼金术则能将普通材料变成强大的药水。' });
            opts.push({ id: 'farewell', label: '告退', response: '愿奥术之光指引你。' });
            return opts;
          }
        }
      },
      onTalk: function () { return null; },
      friendly: true
    },

    guild_master_warrior: {
      id: 'guild_master_warrior',
      name: '铁拳·巴顿',
      title: '战士公会会长',
      location: 'warrior_guild',
      description: '一位身材魁梧的壮汉，裸露的双臂上布满了战斗留下的伤疤。他的声音如同打雷，但笑容却意外地和善。',
      type: 'guild_master',
      guildId: 'warrior',
      dialogTree: {
        greeting: {
          text: function () {
            const s = PlayerState.getState();
            if (s.guild === 'warrior') {
              return '巴顿大笑着拍打你的肩膀："小子，又来找虐了？好！我就喜欢有干劲的年轻人。"';
            }
            return '巴顿双臂抱胸俯视着你："想加入钢铁誓言？我们只收真正的战士！你有那个胆量吗？"';
          },
          options: function () {
            const s = PlayerState.getState();
            const opts = [];
            if (s.guild !== 'warrior' && !s.guild) {
              opts.push({ id: 'join', label: '加入战士公会', response: '好！就欣赏你的勇气。从今天起你就是钢铁誓言的一员了。记住：荣誉高于一切！', action: 'guild_join_warrior' });
            } else if (s.guild === 'warrior') {
              opts.push({ id: 'skills', label: '查看技能', response: null, action: 'guild_learn_skill' });
              opts.push({ id: 'upgrade', label: '升级技能', response: null, action: 'guild_upgrade_skill' });
            }
            opts.push({ id: 'about', label: '聊聊战斗', response: '猛击提高攻击力，铁壁防御让你坚不可摧，战吼在战斗中恢复生命，坚韧则提升你的生命上限。战士就是要在前线硬扛！' });
            opts.push({ id: 'farewell', label: '告退', response: '好好训练，别给钢铁誓言丢脸！' });
            return opts;
          }
        }
      },
      onTalk: function () { return null; },
      friendly: true
    },

    tavern_keeper: {
      id: 'tavern_keeper',
      name: '酒保老汤姆',
      title: '旅人驿站老板',
      location: 'tavern',
      description: '一个光头大胡子的男人，一边擦着酒杯一边哼着小曲。据说他年轻时也是位颇有名气的冒险者。',
      type: 'tavern_keeper',
      dialogTree: {
        greeting: {
          text: function () {
            return '老汤姆把擦好的杯子放下："哟，冒险者！要吃点喝点什么？还是想打听些消息？"';
          },
          options: [
            { id: 'eat', label: '来份大餐 (10G)', response: null, action: 'tavern_eat' },
            { id: 'drink', label: '喝杯麦酒 (5G)', response: null, action: 'tavern_drink' },
            { id: 'rumor', label: '打听消息', response: null, action: 'tavern_rumor' },
            { id: 'story', label: '听老汤姆讲过去的故事', response: '老汤姆眼睛一亮："当年我闯冰霜洞穴的时候，遇到了冰霜领主……那家伙一个喷嚏差点把我冻成冰块！还好我跑得快，嘿嘿。后来有个法师告诉我，冰元素掉的冰晶可是好东西。"' },
            { id: 'farewell', label: '下次再来', response: '老汤姆挥挥手："路上小心，冒险者！记得常来光顾。"' }
          ]
        }
      },
      onTalk: function () { return null; },
      friendly: true
    },

    blacksmith_orn: {
      id: 'blacksmith_orn',
      name: '老铁匠奥恩',
      title: '铁匠铺主人',
      location: 'blacksmith',
      description: '一位肌肉结实的老铁匠，胡子上沾着煤灰。他身后的熔炉里火光熊熊，铁砧上还放着一件未完成的武器。',
      type: 'blacksmith',
      dialogTree: {
        greeting: {
          text: function () {
            return '奥恩擦了擦额头上的汗："你好，冒险者。需要修理装备还是想看看武器？不过说实话，现在店里的好货不多，材料紧缺啊。"';
          },
          options: [
            { id: 'about', label: '这里能做什么？', response: '我这里可以出售和修理武器防具。不过目前库存不多——如果你能在野外找到铁矿石和稀有材料，我可以帮你打造好装备。' },
            { id: 'research', label: '关于冶金技术', response: '你要是能在家里弄个科研台研究基础冶金，再来我这造个锻造台，那就能自己打造装备了。不过我这也能提供一些基础服务。' },
            { id: 'farewell', label: '告辞', response: '奥恩挥了挥铁锤："慢走！找到好材料记得来找我。"' }
          ]
        }
      },
      onTalk: function () { return null; },
      friendly: true
    }
  };

  /** 获取 NPC 记忆 */
  function getMemory(npcId) {
    if (!npcMemory[npcId]) {
      npcMemory[npcId] = { timesTalked: 0 };
    }
    return npcMemory[npcId];
  }

  /** 根据位置获取该地点的所有 NPC */
  function getNPCsAtLocation(locationId) {
    const npcs = [];
    for (const [id, npc] of Object.entries(npcDefs)) {
      if (npc.location === locationId) {
        npcs.push(npc);
      }
    }
    return npcs;
  }

  /** 获取当前场景的所有 NPC */
  function getCurrentNPCs() {
    const state = PlayerState.getState();
    return getNPCsAtLocation(state.currentLocation);
  }

  /** 获取指定 NPC 定义 */
  function getNPC(npcId) {
    return npcDefs[npcId] || null;
  }

  /** 从对话树中获取选项 */
  function getDialogOptions(npc, dialogId) {
    const node = npc.dialogTree[dialogId || 'greeting'];
    if (!node) return { text: '（该NPC暂时无话可说）', options: [] };

    let text = typeof node.text === 'function' ? node.text() : node.text;
    let options = typeof node.options === 'function' ? node.options() : node.options;

    return { text, options: options || [] };
  }

  /** 重置 NPC 记忆（新游戏时调用） */
  function resetMemory() {
    npcMemory = {};
  }

  return {
    npcDefs,
    getNPCsAtLocation,
    getCurrentNPCs,
    getNPC,
    getDialogOptions,
    getMemory,
    resetMemory
  };
})();

if (typeof Logger !== 'undefined') Logger.system('npc.js');
