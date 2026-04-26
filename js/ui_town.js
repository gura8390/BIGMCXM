/**
 * ui_town.js — 城镇/公会/酒馆/NPC 交互模块
 * 向 UICore 注册场景构建器和动作处理器
 */
var UITown = (function () {
  'use strict';

  if (typeof Logger !== 'undefined') Logger.system('ui_town.js');

  /** ══════ 注册场景构建器 ══════ **/
  UICore.registerSceneBuilder('town', function (loc, s) {
    var btns = [];
    var ts = s.tutorialStage || 'complete';
    if (loc && loc.id === 'town_square') {
      if (ts === 'home' || ts === 'complete') {
        btns.push(UICore.buildActionButton('💤 休息片刻', 'travel_rest', '恢复精力'));
        if (!s.hasHome && s.gold >= 80) btns.push(UICore.buildActionButton('🏠 建造家园 (80G)', 'home_build', '在城镇边缘建造小屋'));
        if (s.energy >= 10) btns.push(UICore.buildActionButton('🌍 外出探索', 'travel_explore', '前往野外冒险'));
      }
    }
    return btns;
  });

  UICore.registerSceneBuilder('guild', function (loc, s) {
    var btns = [];
    if (s.tutorialStage === 'complete') {
      if (!s.guild) btns.push(UICore.buildActionButton('🤝 加入公会', 'guild_join', '加入学习专属技能'));
      else if (s.guild && loc && loc.guild === s.guild) {
        btns.push(UICore.buildActionButton('📚 学习技能', 'guild_learn_skill', '学习新技能'));
        btns.push(UICore.buildActionButton('⬆️ 升级技能', 'guild_upgrade_skill', '提升技能等级'));
        // 检查是否所有技能满级
        if (allSkillsMaxed(s)) {
          btns.push({ label: '🚪 退出公会 (5000G)', desc: '学成出师，支付退会费后可加入其他公会', action: 'guild_leave', cls: (s.gold >= 5000 ? '' : 'disabled') });
        }
      }
    }
    return btns;
  });

  UICore.registerSceneBuilder('shop', function (loc, s) {
    if (s.tutorialStage !== 'complete') return [];
    return [
      UICore.buildActionButton('🛒 购买物品', 'open_shop', '浏览商人汉斯的商品'),
      UICore.buildActionButton('💰 出售物品', 'open_sell', '出售背包中的物品')
    ];
  });

  UICore.registerSceneBuilder('tavern', function (loc, s) {
    if (s.tutorialStage !== 'complete') return [];
    return [
      UICore.buildActionButton('🍽️ 享用大餐 (10G)', 'tavern_eat', '恢复饥饿60精力10'),
      UICore.buildActionButton('🍺 喝杯麦酒 (5G)', 'tavern_drink', '恢复口渴50'),
      UICore.buildActionButton('🗣️ 打听消息', 'tavern_rumor', '了解情报')
    ];
  });

  UICore.registerSceneBuilder('blacksmith', function (loc, s) {
    if (s.tutorialStage !== 'complete') return [UICore.buildActionButton('🔧 对话铁匠', 'npc_talk_blacksmith_orn', '了解铁匠铺')];
    return [
      UICore.buildActionButton('🛒 购买材料', 'blacksmith_buy', '购买矿石与材料'),
      UICore.buildActionButton('💰 出售材料', 'blacksmith_sell', '出售背包中的材料'),
      UICore.buildActionButton('🔧 对话铁匠', 'npc_talk_blacksmith_orn', '了解铁匠铺')
    ];
  });

  // 王都（预留扩展）
  UICore.registerSceneBuilder('royal', function (loc, s) {
    return [
      UICore.buildActionButton('💤 休息片刻', 'travel_rest', '在王都广场歇息'),
      UICore.buildActionButton('🏛️ 参观王宫', 'royal_visit', '参观宏伟的王宫（开发中）'),
      UICore.buildActionButton('📜 冒险者公会', 'royal_guild', '高级冒险者公会（开发中）')
    ];
  });

  /** ══════ 注册动作处理器 ══════ **/
  UICore.registerActionHandler('guild_join', function () {
    handleGuildJoin();
    return null;
  });
  UICore.registerActionHandler('guild_learn_skill', function () {
    showLearnSkillPopup();
    return null;
  });
  UICore.registerActionHandler('guild_upgrade_skill', function () {
    showUpgradeSkillPopup();
    return null;
  });
  UICore.registerActionHandler('tavern_eat', function () {
    doTavernEat();
    return null;
  });
  UICore.registerActionHandler('tavern_drink', function () {
    doTavernDrink();
    return null;
  });
  UICore.registerActionHandler('tavern_rumor', function () {
    return doTavernRumor();
  });
  UICore.registerActionHandler('open_shop', function () {
    UICore.showShopPopup();
    return null;
  });
  UICore.registerActionHandler('open_sell', function () {
    UICore.showSellPopup();
    return null;
  });
  UICore.registerActionHandler('guild_leave', function () {
    handleGuildLeave();
    return null;
  });
  UICore.registerActionHandler('royal_visit', function () {
    UICore.renderAll({ success: true, message: '🏛️ 你走进了宏伟的王宫。大理石柱和金色穹顶令人叹为观止。\n（王宫内容开发中，敬请期待）' });
    return null;
  });
  UICore.registerActionHandler('royal_guild', function () {
    UICore.renderAll({ success: true, message: '📜 冒险者公会的高级分部坐落于此，据说只有顶级冒险者才有资格进入。\n（高级公会内容开发中，敬请期待）' });
    return null;
  });
  UICore.registerActionHandler('blacksmith_buy', function () {
    UICore.showBlacksmithBuyPopup();
    return null;
  });
  UICore.registerActionHandler('blacksmith_sell', function () {
    UICore.showBlacksmithSellPopup();
    return null;
  });

  /** ══════ 辅助函数 ══════ **/
  function allSkillsMaxed(s) {
    if (!s.guild) return false;
    var guildSkills = ClassSystem.getSkillsForGuild(s.guild);
    if (!guildSkills) return false;
    var skillIds = Object.keys(guildSkills);
    for (var i = 0; i < skillIds.length; i++) {
      if ((s.skills[skillIds[i]] || 0) < 3) return false;
    }
    return skillIds.length > 0;
  }

  function handleGuildLeave() {
    var s = PlayerState.getState();
    if (!s.guild) { UICore.renderAll({ success: false, message: '你没有加入任何公会。' }); return; }
    if (!allSkillsMaxed(s)) { UICore.renderAll({ success: false, message: '你还没有学完当前公会的全部技能。全部技能需达到LV.3才能出师。' }); return; }
    if (s.gold < 5000) { UICore.renderAll({ success: false, message: '退出公会需要5000金币，你的金币不足。' }); return; }
    var oldGuild = ClassSystem.guildDefs[s.guild];
    var oldName = oldGuild ? oldGuild.name : s.guild;
    PlayerState.add('gold', -5000);
    PlayerState.set('guild', null);
    // 技能保留，不删除
    Logger.log('ui_town', '退出公会（技能保留）', { oldGuild: oldName, goldCost: 5000 });
    UICore.showToast('🚪 已退出 ' + oldName + '（技能保留）', 'toast-gold');
    UICore.renderAll({ success: true, message: '你支付了5000金币退会费，退出了【' + oldName + '】。\n你在该公会学习的技能已永久保留。现在你可以加入其他公会并学习新技能。' });
  }

  /** ══════ 王都解锁 ══════ **/
  function unlockRoyalCapital(overlay) {
    var s = PlayerState.getState();
    if (s.level < 10) { overlay && overlay.remove(); UICore.renderAll({ success: false, message: '你的等级不足Lv.10，无法前往王都。' }); return; }
    if (s.gold < 15000) { overlay && overlay.remove(); UICore.renderAll({ success: false, message: '需要15000金币的入城费，你的金币不足。' }); return; }
    if (s.discoveredLocations.indexOf('royal_capital') !== -1) { overlay && overlay.remove(); UICore.renderAll({ success: false, message: '你已经解锁了王都。' }); return; }

    PlayerState.add('gold', -15000);
    var disc = s.discoveredLocations.slice();
    disc.push('royal_capital');
    PlayerState.set('discoveredLocations', disc);
    Logger.flow('王都已解锁 — 扣除15000G');
    UICore.showToast('🚩 王都 - 光辉之城 已解锁！', 'toast-gold');
    if (overlay) overlay.remove();
    UICore.renderAll({ success: true, message: '🎉 你向村长支付了15000金币的入城费。\n王都 - 光辉之城 已解锁！你可以从城镇广场出发前往王都了。' });
  }

  // NPC 对话委托
  UICore.registerActionHandler('__npc_talk__', function (npcId) {
    handleNPCTalk(npcId);
  });
  UICore.registerActionHandler('__npc_trade__', function (npcId) {
    handleNPCTrade(npcId);
  });

  /** ══════ 公会 ══════ **/
  function handleGuildJoin() {
    var s = PlayerState.getState();
    var guildId = null;
    if (s.currentLocation === 'thief_guild') guildId = 'thief';
    else if (s.currentLocation === 'mage_guild') guildId = 'mage';
    else if (s.currentLocation === 'warrior_guild') guildId = 'warrior';
    else { UICore.renderAll({ success: false, message: '此处无法加入公会。' }); return; }
    var r = ClassSystem.joinGuild(guildId);
    Logger.log('ui_town', '加入公会', { guild: guildId, success: r.success });
    UICore.renderAll(r);
  }

  function showLearnSkillPopup() { showSkillPopup('learn'); }
  function showUpgradeSkillPopup() { showSkillPopup('upgrade'); }

  function showSkillPopup(mode) {
    var s = PlayerState.getState();
    if (!s.guild) { UICore.renderAll({ success: false, message: '请先加入公会。' }); return; }
    var guildSkills = ClassSystem.getSkillsForGuild(s.guild);
    if (!guildSkills) return;

    var content = '<div class="skill-list">';
    var has = false;
    for (var id in guildSkills) {
      var skill = guildSkills[id];
      var lvl = s.skills[id] || 0;
      if (mode === 'learn' && lvl === 0) {
        has = true;
        var c1 = skill.levels[0];
        content += '<div class="skill-item"><span>' + (skill.icon || '') + ' ' + skill.name + '</span><span class="skill-cost">' + c1.cost + 'G</span>' +
          (s.gold >= c1.cost ? '<button class="popup-btn small" data-skill="' + id + '" data-action="learn">学习</button>' : '<span class="no-gold">金币不足</span>') + '</div>';
      } else if (mode === 'upgrade' && lvl > 0 && lvl < 3) {
        has = true;
        var cN = skill.levels[lvl];
        content += '<div class="skill-item"><span>' + (skill.icon || '') + ' ' + skill.name + ' LV.' + lvl + '</span><span class="skill-cost">' + cN.cost + 'G</span>' +
          (s.gold >= cN.cost ? '<button class="popup-btn small" data-skill="' + id + '" data-action="upgrade">升 LV.' + (lvl + 1) + '</button>' : '<span class="no-gold">金币不足</span>') + '</div>';
      }
    }
    if (!has) content += '<div class="inv-empty-popup">' + (mode === 'learn' ? '所有技能已学习。' : '无可升级技能。') + '</div>';
    content += '</div>';

    UICore.showPopup(mode === 'learn' ? '📚 学习技能' : '⬆️ 升级技能', content, [
      { label: '关闭', action: function () { UICore.closeAllPopups(); } }
    ]);

    setTimeout(function () {
      document.querySelectorAll('[data-skill]').forEach(function (btn) {
        btn.onclick = function () {
          var sid = btn.getAttribute('data-skill');
          var act = btn.getAttribute('data-action');
          var r = act === 'learn' ? ClassSystem.learnSkill(sid) : ClassSystem.upgradeSkill(sid);
          Logger.log('ui_town', '技能操作', { skill: sid, action: act, success: r.success });
          UICore.closeAllPopups();
          UICore.renderAll(r);
        };
      });
    }, 50);
  }

  /** ══════ 酒馆 ══════ **/
  function doTavernEat() {
    var s = PlayerState.getState();
    if (s.gold < 10) { UICore.renderAll({ success: false, message: '金币不足10G。' }); return; }
    PlayerState.add('gold', -10);
    PlayerState.set('hunger', Math.min(100, s.hunger + 60));
    PlayerState.set('energy', Math.min(100, s.energy + 10));
    Logger.log('survival', '酒馆进食', { hunger: 60, energy: 10 });
    UICore.renderAll({ success: true, message: '你享用了一顿丰盛的大餐，恢复了60点饥饿和10点精力。' });
  }
  function doTavernDrink() {
    var s = PlayerState.getState();
    if (s.gold < 5) { UICore.renderAll({ success: false, message: '金币不足5G。' }); return; }
    PlayerState.add('gold', -5);
    PlayerState.set('thirst', Math.min(100, s.thirst + 50));
    Logger.log('survival', '酒馆饮水', { thirst: 50 });
    UICore.renderAll({ success: true, message: '你喝了一大杯麦酒，清爽解渴！' });
  }
  function doTavernRumor() {
    var tips = ['吟游诗人："幽暗森林藏着炼金配方……"', '老冒险者："沙漠遗迹的法老宝藏富可敌国。"', '猎人："冰霜洞穴的冰晶是宝贝。"', '商人："加入公会学技能更有效率。"', '酒保："别忘了补充食物和水，否则会没命的。"'];
    var msg = tips[Math.floor(Math.random() * tips.length)];
    Logger.log('ui_town', '打听消息', { rumor: msg });
    return { success: true, message: '你竖起耳朵四处打听……\n「' + msg + '」' };
  }

  /** ══════ NPC 对话 ══════ **/
  function handleNPCTalk(npcId) {
    var npc = NPCSystem.getNPC(npcId);
    if (!npc) { UICore.renderAll({ success: false, message: 'NPC不存在。' }); return; }
    if (npc.onTalk) npc.onTalk();

    Logger.log('ui_town', 'NPC对话', { npcId: npcId, name: npc.name });

    var s = PlayerState.getState();
    if (npcId === 'chief' && s.tutorialStage === 'init') {
      Logger.flow('触发教程对话 — 村长');
      showTutorialChiefDialog(npc);
      return;
    }

    var dialog = NPCSystem.getDialogOptions(npc, 'greeting');
    showNPCDialog(npc, dialog);
  }

  function showTutorialChiefDialog(npc) {
    PlayerState.set('tutorialStage', 'dialogue');
    UICore.closeAllPopups();

    var container = document.getElementById('popup-container');
    if (!container) return;

    var overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    var popup = document.createElement('div');
    popup.className = 'popup';

    var content = '<div class="npc-desc">' + npc.description + '</div>' +
      '<div class="npc-dialog-text">啊，一位新来的冒险者！欢迎来到我们的城镇。我叫老查理，是这里的村长。\n\n最近城外不太平，怪物活动频繁，许多旅行者都遭了殃。你看起来像是能派上用场的人。\n\n拿着，这是一些初始物资——一张破旧的木床和一些面包。你可以在城镇广场花80金币建造家园，然后把木床安放进去，这样就有个能安心休息的地方了。</div>' +
      '<div class="npc-dialog-options">' +
      '<button class="npc-option-btn" data-action="accept">🤝 感谢村长（接受物资）</button>' +
      '</div>' +
      '<div class="npc-dialog-end" style="display:none">— 对话结束 —</div>';

    popup.innerHTML = '<div class="popup-header"><div class="popup-title">💬 ' + npc.name + ' — ' + npc.title + '</div><button class="popup-close-btn" onclick="this.closest(\'.popup-overlay\').remove()">✕</button></div>' +
      '<div class="popup-content">' + content + '</div>' +
      '<div class="popup-buttons"><button class="popup-btn" onclick="this.closest(\'.popup-overlay\').remove()">告别</button></div>';

    overlay.appendChild(popup);
    container.appendChild(overlay);

    popup.querySelector('.npc-option-btn').onclick = function () {
      PlayerState.addItem(createItem('04003', 1));
      PlayerState.addItem(createItem('04004', 3));
      PlayerState.set('tutorialStage', 'home');
      PlayerState.set('hasHome', true);
      PlayerState.set('homeFacilities', []);

      Logger.flow('村长物资已发放 — 教程阶段→home');
      Logger.log('ui_town', '获得教程物品', { items: ['04003 破旧的木床 x1', '04004 新手面包 x3'] });

      popup.querySelector('.npc-dialog-text').textContent = '很好！我已经帮你登记了家园地块（免费赠送！）。现在你的背包里有一张破旧的木床和一些面包。\n\n前往【家园】，把木床安放好。之后你就可以自由探索这个世界了！';
      popup.querySelector('.npc-dialog-options').style.display = 'none';
      var endEl = popup.querySelector('.npc-dialog-end');
      if (endEl) endEl.style.display = 'block';

      UICore.showToast('🎁 获得 破旧的木床 x1', 'toast-item');
      UICore.showToast('🎁 获得 新手面包 x3', 'toast-item');
      UICore.showToast('🏠 家园已解锁！请前往家园安放木床', 'toast-gold');

      UICore.renderAll({ success: true, message: '🎉 村长赠送了破旧的木床和3个面包！家园已解锁，请前往家园安放木床。' });
    };
  }

  function showNPCDialog(npc, dialog) {
    UICore.closeAllPopups();
    var container = document.getElementById('popup-container');
    if (!container) return;

    var overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    var popup = document.createElement('div');
    popup.className = 'popup';

    var content = '<div class="npc-desc">' + npc.description + '</div><div class="npc-dialog-text">' + dialog.text.replace(/\n/g, '<br>') + '</div>';
    if (dialog.options && dialog.options.length > 0) {
      content += '<div class="npc-dialog-options">';
      for (var i = 0; i < dialog.options.length; i++) {
        content += '<button class="npc-option-btn" data-index="' + i + '">' + dialog.options[i].label + '</button>';
      }
      content += '</div>';
    } else {
      content += '<div class="npc-dialog-end">— 对话结束 —</div>';
    }

    popup.innerHTML = '<div class="popup-header"><div class="popup-title">💬 ' + npc.name + ' — ' + npc.title + '</div><button class="popup-close-btn" onclick="this.closest(\'.popup-overlay\').remove()">✕</button></div>' +
      '<div class="popup-content">' + content + '</div>' +
      '<div class="popup-buttons"><button class="popup-btn" onclick="this.closest(\'.popup-overlay\').remove()">告别</button></div>';

    overlay.appendChild(popup);
    container.appendChild(overlay);

    popup.querySelectorAll('.npc-option-btn').forEach(function (btn) {
      btn.onclick = function () {
        var idx = parseInt(btn.getAttribute('data-index'));
        var opt = dialog.options[idx];
        if (!opt) return;

        if (opt.action) {
          overlay.remove();
          if (opt.action === 'open_trade') { handleNPCTrade(npc.id); return; }
          if (opt.action === 'guild_join_thief') { handleGuildJoinSpecific('thief'); return; }
          if (opt.action === 'guild_join_mage') { handleGuildJoinSpecific('mage'); return; }
          if (opt.action === 'guild_join_warrior') { handleGuildJoinSpecific('warrior'); return; }
          if (opt.action === 'guild_learn_skill') { showLearnSkillPopup(); return; }
          if (opt.action === 'guild_upgrade_skill') { showUpgradeSkillPopup(); return; }
          if (opt.action === 'tavern_eat') { doTavernEat(); return; }
          if (opt.action === 'tavern_drink') { doTavernDrink(); return; }
          if (opt.action === 'tavern_rumor') { UICore.renderAll(doTavernRumor()); return; }
          if (opt.action === 'unlock_royal') { unlockRoyalCapital(overlay); return; }
          return;
        }

        if (opt.response) {
          popup.querySelector('.npc-dialog-text').innerHTML = (opt.response || '').replace(/\n/g, '<br>');
          var optsEl = popup.querySelector('.npc-dialog-options');
          if (optsEl) optsEl.style.display = 'none';
          var endEl = popup.querySelector('.npc-dialog-end');
          if (endEl) endEl.style.display = 'block';
        }
      };
    });
  }

  function handleNPCTrade(npcId) {
    Logger.log('ui_town', 'NPC交易', { npcId: npcId });
    UICore.showShopPopup();
  }

  function handleGuildJoinSpecific(guildId) {
    var s = PlayerState.getState();
    var targetLoc = guildId + '_guild';
    if (s.currentLocation !== targetLoc) {
      var tr = MapSystem.travel(targetLoc);
      if (!tr.success) { UICore.renderAll(tr); return; }
    }
    var r = ClassSystem.joinGuild(guildId);
    Logger.log('ui_town', 'NPC对话加入公会', { guild: guildId, success: r.success });
    UICore.renderAll(r);
  }

  return {
    handleNPCTalk: handleNPCTalk,
    handleNPCTrade: handleNPCTrade,
    showLearnSkillPopup: showLearnSkillPopup,
    showUpgradeSkillPopup: showUpgradeSkillPopup
  };
})();
