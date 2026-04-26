/**
 * ui_home.js — 家园建设 + 科技研究 交互模块
 * 向 UICore 注册场景构建器和动作处理器
 */
var UIHome = (function () {
  'use strict';

  if (typeof Logger !== 'undefined') Logger.system('ui_home.js');

  /** ══════ 注册场景构建器 ══════ **/
  UICore.registerSceneBuilder('home', function (loc, s) {
    var btns = [];
    var ts = s.tutorialStage || 'complete';

    btns.push(UICore.buildActionButton('😴 休息', 'home_rest', '恢复精力与生命'));

    if (ts === 'home') {
      var hasBed = s.homeFacilities && s.homeFacilities.includes('bed');
      if (!hasBed) {
        Logger.log('ui_home', '教程阶段：显示安放木床按钮');
        btns.push({ label: '🛏️ 安放木床', desc: '将村长赠送的木床放入家园', action: 'tutorial_build_bed', cls: 'tutorial-highlight' });
      } else {
        btns.push(UICore.buildActionButton('🔨 建造设施', 'home_build', '添置家居设施'));
        btns.push(UICore.buildActionButton('🔬 科研台', 'tech_research', '研究科技'));
      }
    } else if (ts === 'complete') {
      btns.push(UICore.buildActionButton('🔨 建造设施', 'home_build', '添置家居设施'));
      btns.push(UICore.buildActionButton('🔬 科研台', 'tech_research', '研究科技'));
    }

    // 已建造设施的专属操作
    var facs = s.homeFacilities || [];
    if (facs.includes('forge')) {
      btns.push(UICore.buildActionButton('⚒️ 锻造装备', 'forge_craft', '使用锻造台打造或强化装备'));
    }
    if (facs.includes('alchemy_station')) {
      btns.push(UICore.buildActionButton('⚗️ 制作药水', 'alchemy_craft', '使用炼药台制作药水'));
    }

    return btns;
  });

  /** ══════ 注册动作处理器 ══════ **/
  UICore.registerActionHandler('home_build', function () {
    handleHomeBuild();
    return null;
  });
  UICore.registerActionHandler('tech_research', function () {
    showTechResearchPopup();
    return null;
  });
  UICore.registerActionHandler('forge_craft', function () {
    showForgeCraftPopup();
    return null;
  });
  UICore.registerActionHandler('alchemy_craft', function () {
    showAlchemyCraftPopup();
    return null;
  });

  /** ══════ 建造设施 ══════ **/
  function handleHomeBuild() {
    var s = PlayerState.getState();
    if (!s.hasHome) {
      var r = HomeSystem.buildHome();
      Logger.log('ui_home', '建造家园', { success: r.success });
      UICore.renderAll(r);
      return;
    }
    var facilities = HomeSystem.getAvailableFacilities();
    if (facilities.length === 0) {
      UICore.renderAll({ success: false, message: '所有设施已建造或需要科技前置。' });
      return;
    }
    var content = '<div class="facility-list">';
    for (var i = 0; i < facilities.length; i++) {
      var f = facilities[i];
      content += '<div class="facility-item"><div class="fac-header"><b>' + f.name + '</b><span class="fac-cost">' + f.cost + 'G</span></div><div class="fac-desc">' + f.desc + '</div><div class="fac-effect">效果：' + (f.effect || '无') + '</div>' +
        (f.canBuild ? '<button class="popup-btn small fac-build-btn" data-fac="' + f.id + '">建造</button>' : '<span class="fac-locked">🔒 ' + (f.reason || '无法建造') + '</span>') + '</div>';
    }
    content += '</div>';
    UICore.showPopup('🔨 建造家园设施', content, [
      { label: '关闭', action: function () { UICore.closeAllPopups(); } }
    ]);
    setTimeout(function () {
      document.querySelectorAll('.fac-build-btn').forEach(function (btn) {
        btn.onclick = function () {
          var facId = btn.getAttribute('data-fac');
          var r = HomeSystem.buildFacility(facId);
          Logger.log('ui_home', '建造设施', { facility: facId, success: r.success });
          UICore.closeAllPopups();
          UICore.renderAll(r);
        };
      });
    }, 50);
  }

  /** ══════ 科研 ══════ **/
  function showTechResearchPopup() {
    var s = PlayerState.getState();
    if (s.researching) {
      var t = TechSystem.techTree[s.researching];
      UICore.showPopup('🔬 科研台', '<p>研究中：<b>' + (t ? t.name : s.researching) + '</b></p><p>进度：' + s.researchProgress + '/' + (t ? t.time : '?') + '</p>', [
        { label: '🔬 推进', action: function () { var r = TechSystem.progressResearch(); Logger.log('ui_home', '推进研究', { result: r.success }); UICore.closeAllPopups(); UICore.renderAll(r); } },
        { label: '❌ 取消', action: function () { var r = TechSystem.cancelResearch(); UICore.closeAllPopups(); UICore.renderAll(r); } },
        { label: '关闭', action: function () { UICore.closeAllPopups(); } }
      ]);
      return;
    }
    var list = TechSystem.getTechList();
    var content = '<div class="tech-list">';
    for (var i = 0; i < list.length; i++) {
      var tech = list[i];
      var act = '';
      if (tech.status === 'available') act = '<button class="popup-btn small tech-start-btn" data-tech="' + tech.id + '">研究 (' + tech.cost + 'G)</button>';
      else if (tech.status === 'unaffordable') act = '<span class="no-gold">金币不足</span>';
      else if (tech.status === 'locked') act = '<span class="tech-locked">🔒 前置未满足</span>';
      else if (tech.status === 'researched') act = '<span class="tech-done">✓ 已研究</span>';
      content += '<div class="tech-item"><div class="tech-name">' + tech.name + '</div><div class="tech-desc">' + tech.desc + '</div><div class="tech-cost">' + tech.cost + 'G | ' + tech.time + '次</div><div class="tech-effect">' + tech.effect + '</div>' + act + '</div>';
    }
    content += '</div>';
    UICore.showPopup('🔬 科研台 — 研究科技', content, [
      { label: '关闭', action: function () { UICore.closeAllPopups(); } }
    ]);
    setTimeout(function () {
      document.querySelectorAll('.tech-start-btn').forEach(function (btn) {
        btn.onclick = function () {
          var techId = btn.getAttribute('data-tech');
          var r = TechSystem.startResearch(techId);
          Logger.log('ui_home', '开始研究', { tech: techId, success: r.success });
          UICore.closeAllPopups();
          UICore.renderAll(r);
        };
      });
    }, 50);
  }

  /** ══════ 锻造装备 ══════ **/
  function showForgeCraftPopup() {
    var s = PlayerState.getState();
    var recipes = [
      { id: '03001', name: '短剑', cost: 5, requires: [{ id: '01002', qty: 2 }], desc: '基础武器 攻击+3' },
      { id: '03002', name: '皮甲', cost: 5, requires: [{ id: '01001', qty: 3 }], desc: '基础防具 防御+2' },
      { id: '03003', name: '长剑', cost: 20, requires: [{ id: '01002', qty: 5 }, { id: '01011', qty: 1 }], desc: '精钢长剑 攻击+8' },
      { id: '03004', name: '铁甲', cost: 15, requires: [{ id: '01002', qty: 6 }], desc: '厚重铁甲 防御+6' }
    ];

    var content = '<div class="shop-list"><div class="shop-popup-header">🔨 可用材料 | 💰 ' + s.gold + ' G</div>';
    for (var i = 0; i < recipes.length; i++) {
      var r = recipes[i];
      var missing = [];
      for (var j = 0; j < r.requires.length; j++) {
        var req = r.requires[j];
        var owned = 0;
        var invItem = s.inventory.find(function(x) { return x.id === req.id; });
        if (invItem) owned = invItem.qty;
        if (owned < req.qty) {
          var name = getItemName(req.id);
          missing.push(name + ' x' + req.qty + '(缺' + (req.qty - owned) + ')');
        }
      }
      var canCraft = missing.length === 0 && s.gold >= r.cost;
      content += '<div class="shop-item-row">' +
        '<span>' + r.name + '</span><span class="shop-desc">' + r.desc + '</span>' +
        '<span class="shop-price">' + r.cost + 'G</span>' +
        (missing.length > 0 ? '<span class="shop-no-gold">缺: ' + missing.join(', ') + '</span>' :
         canCraft ? '<button class="popup-btn small forge-craft-btn" data-id="' + r.id + '" data-cost="' + r.cost + '">锻造</button>' :
         '<span class="shop-no-gold">金币不足</span>') +
      '</div>';
    }
    content += '</div>';

    UICore.showPopup('⚒️ 锻造台 — 打造装备', content, [
      { label: '关闭', action: function () { UICore.closeAllPopups(); } }
    ]);

    setTimeout(function () {
      document.querySelectorAll('.forge-craft-btn').forEach(function (btn) {
        btn.onclick = function () {
          var itemId = btn.getAttribute('data-id');
          var cost = parseInt(btn.getAttribute('data-cost'));
          var recipe = recipes.find(function(x) { return x.id === itemId; });
          if (!recipe || s.gold < cost) return;
          // 消耗材料
          for (var k = 0; k < recipe.requires.length; k++) {
            PlayerState.removeItem(recipe.requires[k].id, recipe.requires[k].qty);
          }
          PlayerState.add('gold', -cost);
          PlayerState.addItem(createItem(itemId, 1));
          Logger.log('ui_home', '锻造装备', { item: itemId, cost: cost });
          UICore.showToast('⚒️ 打造了 ' + recipe.name, 'toast-gold');
          UICore.closeAllPopups();
          UICore.renderAll({ success: true, message: '成功锻造了【' + recipe.name + '】！' });
        };
      });
    }, 50);
  }

  /** ══════ 炼药 ══════ **/
  function showAlchemyCraftPopup() {
    var s = PlayerState.getState();
    var recipes = [
      { id: '02004', name: '生命药水', cost: 3, requires: [{ id: '01003', qty: 2 }], desc: '恢复生命30' },
      { id: '02007', name: '大生命药水', cost: 8, requires: [{ id: '01003', qty: 4 }, { id: '01012', qty: 1 }], desc: '恢复生命60' },
      { id: '02008', name: '精力药水', cost: 5, requires: [{ id: '01003', qty: 3 }, { id: '01007', qty: 2 }], desc: '恢复精力50' }
    ];

    var content = '<div class="shop-list"><div class="shop-popup-header">🧪 可用材料 | 💰 ' + s.gold + ' G</div>';
    for (var i = 0; i < recipes.length; i++) {
      var r = recipes[i];
      var missing = [];
      for (var j = 0; j < r.requires.length; j++) {
        var req = r.requires[j];
        var owned = 0;
        var invItem = s.inventory.find(function(x) { return x.id === req.id; });
        if (invItem) owned = invItem.qty;
        if (owned < req.qty) {
          var name = getItemName(req.id);
          missing.push(name + ' x' + req.qty + '(缺' + (req.qty - owned) + ')');
        }
      }
      var canCraft = missing.length === 0 && s.gold >= r.cost;
      content += '<div class="shop-item-row">' +
        '<span>' + r.name + '</span><span class="shop-desc">' + r.desc + '</span>' +
        '<span class="shop-price">' + r.cost + 'G</span>' +
        (missing.length > 0 ? '<span class="shop-no-gold">缺: ' + missing.join(', ') + '</span>' :
         canCraft ? '<button class="popup-btn small alchemy-craft-btn" data-id="' + r.id + '" data-cost="' + r.cost + '">炼制</button>' :
         '<span class="shop-no-gold">金币不足</span>') +
      '</div>';
    }
    content += '</div>';

    UICore.showPopup('⚗️ 炼药台 — 制作药水', content, [
      { label: '关闭', action: function () { UICore.closeAllPopups(); } }
    ]);

    setTimeout(function () {
      document.querySelectorAll('.alchemy-craft-btn').forEach(function (btn) {
        btn.onclick = function () {
          var itemId = btn.getAttribute('data-id');
          var cost = parseInt(btn.getAttribute('data-cost'));
          var recipe = recipes.find(function(x) { return x.id === itemId; });
          if (!recipe || s.gold < cost) return;
          for (var k = 0; k < recipe.requires.length; k++) {
            PlayerState.removeItem(recipe.requires[k].id, recipe.requires[k].qty);
          }
          PlayerState.add('gold', -cost);
          PlayerState.addItem(createItem(itemId, 1));
          Logger.log('ui_home', '炼制药水', { item: itemId, cost: cost });
          UICore.showToast('⚗️ 炼制了 ' + recipe.name, 'toast-item');
          UICore.closeAllPopups();
          UICore.renderAll({ success: true, message: '成功炼制了【' + recipe.name + '】！' });
        };
      });
    }, 50);
  }

  return {
    handleHomeBuild: handleHomeBuild,
    showTechResearchPopup: showTechResearchPopup
  };
})();
