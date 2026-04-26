/**
 * ui_core.js — 核心渲染引擎
 * 弹窗系统 · 地图/背包 · 状态渲染 · 上下文分发 · 教程控制
 */
var UICore = (function () {
  'use strict';

  if (typeof Logger !== 'undefined') Logger.system('ui_core.js');

  /** ══════ 注册表 ══════ **/
  var sceneBuilders = {};  // context -> function(loc, s) returns buttons[]
  var actionHandlers = {}; // action -> function() returns result|null

  function registerSceneBuilder(context, fn) {
    sceneBuilders[context] = fn;
    Logger.log('ui_core', '注册场景构建器', { context: context });
  }

  function registerActionHandler(action, fn) {
    actionHandlers[action] = fn;
    Logger.log('ui_core', '注册动作处理器', { action: action });
  }

  var _typewriterTimer = null;

  /** ══════ 场景类型 ══════ **/
  function getContext() {
    var loc = MapSystem.getCurrentLocation();
    if (!loc) return 'unknown';
    var lid = loc.id;
    var fixedIds = Object.keys(Locations.fixed);
    if (!fixedIds.includes(lid)) return 'wild';
    if (lid === 'town_square' || lid === 'guild_district') return 'town';
    if (lid === 'thief_guild' || lid === 'mage_guild' || lid === 'warrior_guild') return 'guild';
    if (lid === 'market') return 'shop';
    if (lid === 'tavern') return 'tavern';
    if (lid === 'home') return 'home';
    if (lid === 'blacksmith') return 'blacksmith';
    if (lid === 'royal_capital') return 'royal';
    return 'town';
  }

  /** ══════ 渲染入口 ══════ **/
  function renderAll(actionResult) {
    try { renderHeaderStatus(); } catch (e) { Logger.error('ui_core', 'renderHeaderStatus失败', e); }
    try { renderLocation(); } catch (e) { Logger.error('ui_core', 'renderLocation失败', e); }
    try { renderContextActions(); } catch (e) { Logger.error('ui_core', 'renderContextActions失败', e); }
    try { renderMessages(actionResult); } catch (e) { Logger.error('ui_core', 'renderMessages失败', e); }
    try { renderFooter(); } catch (e) { Logger.error('ui_core', 'renderFooter失败', e); }
  }

  /** 轻量刷新（仅更新动态数值，游戏循环用） */
  function renderQuick() {
    try { renderHeaderStatus(); } catch (e) {}
    try { renderFooter(); } catch (e) {}
  }

  /** ══════ 头部状态条 ══════ **/
  function renderHeaderStatus() {
    var el = document.getElementById('header-status');
    if (!el) return;
    var s = PlayerState.getState();

    el.innerHTML =
      '<span class="hstat hstat-hp">❤️<div class="hstat-bar-wrap"><div class="hstat-bar-fill" style="width:' + Math.round(s.health/s.maxHealth*100) + '%"></div></div><span class="hstat-val">' + s.health + '</span></span>' +
      '<span class="hstat hstat-thirst">💧<div class="hstat-bar-wrap"><div class="hstat-bar-fill" style="width:' + Math.round(s.thirst) + '%"></div></div><span class="hstat-val">' + Math.round(s.thirst) + '</span></span>' +
      '<span class="hstat hstat-hunger">🍖<div class="hstat-bar-wrap"><div class="hstat-bar-fill" style="width:' + Math.round(s.hunger) + '%"></div></div><span class="hstat-val">' + Math.round(s.hunger) + '</span></span>' +
      '<span class="hstat hstat-energy">⚡<div class="hstat-bar-wrap"><div class="hstat-bar-fill" style="width:' + Math.round(s.energy) + '%"></div></div><span class="hstat-val">' + Math.round(s.energy) + '</span></span>' +
      '<span class="hstat" style="color:var(--gold);font-weight:700">💰 ' + s.gold + 'G</span>' +
      '<span class="hstat" style="color:var(--accent)">⭐ Lv.' + s.level + '</span>';
  }

  /** ══════ 地点渲染（打字机效果）══════ **/
  function renderLocation() {
    var el = document.getElementById('location-panel');
    if (!el) return;
    var loc = MapSystem.getCurrentLocation();
    if (!loc) { el.innerHTML = '<div class="loc-name">⚠ 位置数据异常</div>'; return; }

    var desc = loc.desc;
    if (loc.customDesc && typeof loc.customDesc === 'function') {
      try { desc = loc.customDesc(); } catch(e) { desc = loc.desc; }
    }

    var npcs = NPCSystem.getCurrentNPCs();
    var npcHtml = '';
    if (npcs.length > 0) {
      npcHtml = '<div class="npc-presence">';
      for (var i = 0; i < npcs.length; i++) {
        var npc = npcs[i];
        var cls = npc.friendly !== false ? 'npc-friendly' : 'npc-hostile';
        npcHtml += '<span class="npc-tag ' + cls + '" title="' + npc.description + '">👤 ' + npc.name + ' — ' + npc.title + '</span>';
      }
      npcHtml += '</div>';
    }

    el.innerHTML = '<div class="loc-name">📍 ' + loc.name + '</div><div class="typewriter" id="typewriter-target"><span class="cursor"></span></div>' + npcHtml;

    if (_typewriterTimer) clearInterval(_typewriterTimer);
    var target = document.getElementById('typewriter-target');
    if (!target) return;
    var idx = 0;
    var len = desc.length;
    var speed = len > 80 ? 15 : 25;
    _typewriterTimer = setInterval(function () {
      if (idx < len) {
        idx += (len > 60 ? 2 : 1);
        target.innerHTML = desc.substring(0, idx) + '<span class="cursor"></span>';
      } else {
        target.innerHTML = desc;
        clearInterval(_typewriterTimer);
        _typewriterTimer = null;
      }
    }, speed);
  }

  /** ══════ 底部状态栏 ══════ **/
  function renderFooter() {
    var s = PlayerState.getState();
    var guild = ClassSystem.guildDefs[s.guild];
    var guildName = guild ? guild.name : '无';
    function ft(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
    ft('ft-inv', s.inventory.length > 0 ? s.inventory.length + '种' : '空');
    ft('ft-home', s.hasHome ? '已建(' + s.homeFacilities.length + '设施)' : '无');
    ft('ft-guild', guildName);
    ft('ft-tech', s.researchedTech.length + '项');
    ft('ft-atk', ClassSystem.calcAttack());
    ft('ft-def', ClassSystem.calcDefense());
    ft('ft-days', s.days);
    ft('ft-kills', s.kills);
  }

  /** ══════ 消息 ══════ **/
  function renderMessages(actionResult) {
    var el = document.getElementById('message-log');
    if (!el) return;
    if (actionResult) {
      var div = document.createElement('div');
      div.className = actionResult.success ? 'msg-success' : 'msg-error';
      div.textContent = actionResult.message;
      el.appendChild(div);
      while (el.children.length > 200) el.removeChild(el.firstChild);
    }
    el.scrollTop = el.scrollHeight;
  }

  function addMessage(text, type) {
    var el = document.getElementById('message-log');
    if (!el) return;
    var ph = el.querySelector('.msg-placeholder');
    if (ph) ph.remove();
    var div = document.createElement('div');
    div.className = type || 'msg-info';
    div.textContent = text;
    el.appendChild(div);
    while (el.children.length > 200) el.removeChild(el.firstChild);
    el.scrollTop = el.scrollHeight;
  }

  /** ══════ Toast 通知 ══════ **/
  function showToast(message, type) {
    var container = document.getElementById('toast-container');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast ' + (type || '');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function () { if (toast.parentNode) toast.remove(); }, 3000);
  }

  /** ══════ 动态上下文按钮 ══════ **/
  function renderContextActions() {
    var el = document.getElementById('actions-panel');
    if (!el) return;

    try {
      var s = PlayerState.getState();
      var ctx = getContext();
      var loc = MapSystem.getCurrentLocation();
      var npcs = NPCSystem.getCurrentNPCs();
      var tutorialStage = s.tutorialStage || 'complete';

      Logger.log('ui_core', '渲染上下文按钮', { context: ctx, tutorial: tutorialStage, location: s.currentLocation });

      var groups = [];

      if (tutorialStage === 'init' || tutorialStage === 'dialogue') {
        var npcBtns = buildNPCActions(npcs, s);
        if (npcBtns.length > 0) {
          for (var i = 0; i < npcBtns.length; i++) {
            if (npcBtns[i].action.indexOf('npc_talk_chief') !== -1) {
              npcBtns[i].cls = 'tutorial-highlight';
            }
          }
          groups.push({ label: '💬 教程引导', buttons: npcBtns });
        } else {
          groups.push({
            label: '⚠ 状态异常',
            buttons: [{ label: '🔄 重置游戏', desc: '重新开始', action: 'sys_reset' }]
          });
        }
        Logger.flow('教程阶段：init/dialogue — 仅显示NPC对话');
      } else if (tutorialStage === 'home') {
        groups.push({ label: '⚙️ 系统', buttons: buildCoreActions(ctx) });
        groups.push({ label: '🚶 移动', buttons: buildTravelActions(ctx, loc, s) });
        groups.push({ label: '📍 场景', buttons: buildSceneActions(ctx, loc, s) });
        groups.push({ label: '💬 NPC', buttons: buildNPCActions(npcs, s) });
        Logger.flow('教程阶段：home — 开放地图/背包/移动/家园');
      } else {
        groups.push({ label: '⚙️ 系统', buttons: buildCoreActions(ctx) });
        groups.push({ label: '🚶 移动', buttons: buildTravelActions(ctx, loc, s) });
        groups.push({ label: '📍 场景', buttons: buildSceneActions(ctx, loc, s) });
        groups.push({ label: '💬 NPC', buttons: buildNPCActions(npcs, s) });
      }

      var html = '';
      var hasButtons = false;
      for (var g = 0; g < groups.length; g++) {
        var group = groups[g];
        if (group.buttons.length === 0) continue;
        hasButtons = true;
        html += '<div class="action-group"><div class="action-group-label">' + group.label + '</div><div class="action-group-buttons">';
        for (var b = 0; b < group.buttons.length; b++) {
          var btn = group.buttons[b];
          var cls = btn.disabled ? 'action-btn disabled' : 'action-btn';
          if (btn.cls) cls += ' ' + btn.cls;
          var onclick = btn.disabled ? '' : ' onclick="UI.handleAction(\'' + btn.action + '\')"';
          html += '<button class="' + cls + '"' + onclick + ' title="' + (btn.desc || '') + '">' + (btn.icon || '') + ' ' + btn.label + '</button>';
        }
        html += '</div></div>';
      }

      if (!hasButtons) {
        Logger.log('ui_core', '无按钮生成 — 显示保底按钮');
        html = '<div class="action-fallback"><div style="color:var(--text-muted);margin-bottom:10px">当前场景无可执行操作</div><button class="action-btn" onclick="UI.handleAction(\'open_map\')">🗺️ 打开地图</button><button class="action-btn" onclick="UI.handleAction(\'open_inventory\')">🎒 打开背包</button><button class="action-btn" onclick="location.reload()">🔄 刷新页面</button></div>';
      }

      el.innerHTML = html;
      Logger.log('ui_core', '按钮渲染完成', { buttonCount: hasButtons ? 'has buttons' : 'fallback' });

    } catch (e) {
      Logger.error('ui_core', 'renderContextActions崩溃', e);
      el.innerHTML = '<div class="action-fallback"><div style="color:var(--danger);margin-bottom:8px">⚠ 按钮生成失败: ' + (e.message || '') + ' — ' + (e.stack ? e.stack.split('\n')[1] : '') + '</div><button class="action-btn" onclick="location.reload()">🔄 刷新页面</button></div>';
    }
  }

  /** ══════ 按钮构建基础 ══════ **/
  function buildCoreActions(ctx) {
    var btns = [];
    btns.push({ label: '🗺️ 地图', desc: '查看世界地图', action: 'open_map', icon: '🗺️' });
    btns.push({ label: '🎒 背包', desc: '查看与使用物品', action: 'open_inventory', icon: '🎒' });
    if (ctx === 'wild') {
      btns.push({ label: '🏃 返回城镇', desc: '立即返回城镇广场', action: 'travel_town_square', icon: '🏃' });
    }
    return btns;
  }

  function buildTravelActions(ctx, loc, s) {
    var btns = [];
    var travels = MapSystem.getAvailableTravels();
    for (var i = 0; i < travels.length; i++) {
      var t = travels[i];
      var label = '🚪 ' + t.name;
      if (s.tutorialStage === 'home' && t.id === 'home') label = '🏠 ' + t.name + ' ⬅ 建造床铺';
      btns.push({ label: label, desc: '前往' + t.name, action: 'travel_' + t.id });
    }
    if (loc && loc.subLocations) {
      for (var j = 0; j < loc.subLocations.length; j++) {
        var sub = loc.subLocations[j];
        var fixed = Locations.getFixed(sub);
        if (fixed) btns.push({ label: '🚪 ' + fixed.name, desc: '进入' + fixed.name, action: 'travel_' + sub });
      }
    }
    return btns;
  }

  function buildSceneActions(ctx, loc, s) {
    var builder = sceneBuilders[ctx];
    if (typeof builder === 'function') {
      var result = builder(loc, s);
      Logger.log('ui_core', '场景构建器返回按钮', { context: ctx, count: result.length });
      return result;
    }
    Logger.log('ui_core', '未注册的场景构建器', { context: ctx });
    return [];
  }

  function buildNPCActions(npcs, s) {
    var btns = [];
    for (var i = 0; i < npcs.length; i++) {
      var npc = npcs[i];
      btns.push({ label: '💬 与' + npc.name + '交谈', desc: npc.title, action: 'npc_talk_' + npc.id });
      if (npc.type === 'merchant') btns.push({ label: '🛒 交易', action: 'npc_trade_' + npc.id });
    }
    return btns;
  }

  function buildActionButton(label, action, desc, icon) {
    return { label: label, action: action, desc: desc || '', icon: icon || '' };
  }

  /** ══════ 动作分发 ══════ **/
  function handleAction(action) {
    if (!action) return;
    Logger.log('ui_core', '处理动作', { action: action });

    var s = PlayerState.getState();
    var ts = s.tutorialStage || 'complete';

    // 自动完成教程（床已建好但状态未更新）
    if (ts === 'home' && s.homeFacilities && s.homeFacilities.includes('bed')) {
      PlayerState.set('tutorialStage', 'complete');
      ts = 'complete';
      Logger.flow('自动完成教程 — 床已存在');
    }

    if (ts !== 'complete') {
      var allowed = buildTutorialAllowList(ts);
      var isAllowed = false;
      for (var a = 0; a < allowed.length; a++) {
        if (action.indexOf(allowed[a]) === 0) { isAllowed = true; break; }
      }
      if (!isAllowed) {
        Logger.log('ui_core', '教程拦截操作', { action: action, stage: ts });
        renderAll({ success: false, message: '🔒 教程进行中（' + ts + '），请先完成引导任务。' });
        return;
      }
    }

    var result;
    try {
      result = dispatchAction(action);
      Logger.log('ui_core', '动作执行完成', { action: action, success: result ? result.success : 'handled' });
    } catch (e) {
      Logger.error('ui_core', '动作执行异常: ' + action, e);
      result = { success: false, message: '操作执行失败: ' + (e.message || '未知错误') + '\n位置: ' + (e.stack ? e.stack.split('\n')[1] : '?') };
    }

    if (result) renderAll(result);
  }

  function buildTutorialAllowList(stage) {
    if (stage === 'init' || stage === 'dialogue') return ['npc_talk_chief'];
    if (stage === 'home') return ['travel_home', 'travel_town_square', 'tutorial_build_bed', 'open_map', 'open_inventory', 'npc_talk_', 'home_rest', 'home_build', 'tech_research'];
    return [];
  }

  function dispatchAction(action) {
    var s = PlayerState.getState();

    // 注册的处理器优先
    var handler = actionHandlers[action];
    if (typeof handler === 'function') {
      Logger.log('ui_core', '通过注册处理器执行', { action: action });
      var result = handler();
      if (result !== undefined) return result;
      return null;
    }

    // 若注册失败，记录并继续硬编码回退
    if (action === 'home_build' || action === 'tech_research' || action === 'home_rest' ||
        action === 'tavern_eat' || action === 'tavern_drink') {
      Logger.error('ui_core', '动作未注册，使用硬编码回退: ' + action);
    }

    // 系统操作
    if (action === 'open_map') { showMapPopup(); return null; }
    if (action === 'open_inventory') { showInventoryPopup(); return null; }
    if (action === 'sys_reset') { if (window.newGame) window.newGame(); return null; }

    // —— 家园建造（硬编码回退） ——
    if (action === 'home_build') {
      if (!s.hasHome) {
        var r = HomeSystem.buildHome();
        Logger.log('ui_core', '硬编码: 建造家园', { success: r.success });
        return r;
      }
      var facilities = HomeSystem.getAvailableFacilities();
      if (facilities.length === 0) return { success: false, message: '所有设施已建造或需要科技前置。' };
      var fc = '<div class="facility-list">';
      for (var fi = 0; fi < facilities.length; fi++) {
        var f = facilities[fi];
        fc += '<div class="facility-item"><div class="fac-header"><b>' + f.name + '</b><span class="fac-cost">' + f.cost + 'G</span></div><div class="fac-desc">' + f.desc + '</div><div class="fac-effect">效果：' + (f.effect || '无') + '</div>' +
          (f.canBuild ? '<button class="popup-btn small fac-build-btn" data-fac="' + f.id + '">建造</button>' : '<span class="fac-locked">🔒 ' + (f.reason || '无法建造') + '</span>') + '</div>';
      }
      fc += '</div>';
      showPopup('🔨 建造家园设施', fc, [{ label: '关闭', action: function () { closeAllPopups(); } }]);
      setTimeout(function () {
        document.querySelectorAll('.fac-build-btn').forEach(function (b) {
          b.onclick = function () {
            var r = HomeSystem.buildFacility(b.getAttribute('data-fac'));
            closeAllPopups();
            renderAll(r);
          };
        });
      }, 50);
      return null;
    }

    // —— 科研台（硬编码回退） ——
    if (action === 'tech_research') {
      if (s.researching) {
        var ct = TechSystem.techTree[s.researching];
        showPopup('🔬 科研台', '<p>研究中：<b>' + (ct ? ct.name : s.researching) + '</b></p><p>进度：' + s.researchProgress + '/' + (ct ? ct.time : '?') + '</p>', [
          { label: '🔬 推进', action: function () { var r = TechSystem.progressResearch(); closeAllPopups(); renderAll(r); } },
          { label: '❌ 取消', action: function () { var r = TechSystem.cancelResearch(); closeAllPopups(); renderAll(r); } },
          { label: '关闭', action: function () { closeAllPopups(); } }
        ]);
        return null;
      }
      var tl = TechSystem.getTechList();
      var tc = '<div class="tech-list">';
      for (var ti = 0; ti < tl.length; ti++) {
        var tech = tl[ti];
        var act = '';
        if (tech.status === 'available') act = '<button class="popup-btn small tech-start-btn" data-tech="' + tech.id + '">研究 (' + tech.cost + 'G)</button>';
        else if (tech.status === 'unaffordable') act = '<span class="no-gold">金币不足</span>';
        else if (tech.status === 'locked') act = '<span class="tech-locked">🔒 前置未满足</span>';
        else if (tech.status === 'researched') act = '<span class="tech-done">✓ 已研究</span>';
        tc += '<div class="tech-item"><div class="tech-name">' + tech.name + '</div><div class="tech-desc">' + tech.desc + '</div><div class="tech-cost">' + tech.cost + 'G | ' + tech.time + '次</div><div class="tech-effect">' + tech.effect + '</div>' + act + '</div>';
      }
      tc += '</div>';
      showPopup('🔬 科研台', tc, [{ label: '关闭', action: function () { closeAllPopups(); } }]);
      setTimeout(function () {
        document.querySelectorAll('.tech-start-btn').forEach(function (b) {
          b.onclick = function () {
            var r = TechSystem.startResearch(b.getAttribute('data-tech'));
            closeAllPopups();
            renderAll(r);
          };
        });
      }, 50);
      return null;
    }

    // 教程 — 建造床铺
    if (action === 'tutorial_build_bed') {
      if (s.currentLocation !== 'home') return { success: false, message: '请先前往家园再安放木床。' };
      if (!PlayerState.hasItem('04003', 1)) return { success: false, message: '背包中没有破旧的木床。请先与村长对话获取。' };
      PlayerState.removeItem('04003', 1);
      var newFacs = s.homeFacilities.slice();
      if (!newFacs.includes('bed')) newFacs.push('bed');
      PlayerState.set('homeFacilities', newFacs);
      PlayerState.set('tutorialStage', 'complete');
      showToast('🎉 教程完成！全部功能已解锁', 'toast-gold');
      Logger.flow('教程完成 — 全部功能解锁');
      return { success: true, message: '🛏️ 你将破旧的木床安放在家园中。\n\n🎉 教程完成！你可以自由探索这个世界了。右侧面板中所有操作按钮已解锁。' };
    }

    // 休息
    if (action === 'travel_rest') { SurvivalSystem.rest(20); Logger.log('survival', '城镇休息', { energy: 20 }); return { success: true, message: '你在长椅上休息了片刻，恢复了20点精力。' }; }
    if (action === 'home_rest') { SurvivalSystem.rest(40); Logger.log('survival', '家园休息', { energy: 40 }); return { success: true, message: '你在床上美美地睡了一觉，恢复40点精力。' }; }
    if (action === 'rest_wild') { SurvivalSystem.rest(10); SurvivalSystem.forceTick(1); return { success: true, message: '你找了个角落休息，恢复10点精力。野外不太安全……' }; }

    // 旅行
    if (action === 'travel_town_square') { Logger.log('ui_core', '场景切换', { to: 'town_square' }); return MapSystem.travel('town_square'); }
    if (action === 'travel_guild_district') { Logger.log('ui_core', '场景切换', { to: 'guild_district' }); return MapSystem.travel('guild_district'); }
    if (action === 'travel_thief_guild') { Logger.log('ui_core', '场景切换', { to: 'thief_guild' }); return MapSystem.travel('thief_guild'); }
    if (action === 'travel_mage_guild') { Logger.log('ui_core', '场景切换', { to: 'mage_guild' }); return MapSystem.travel('mage_guild'); }
    if (action === 'travel_warrior_guild') { Logger.log('ui_core', '场景切换', { to: 'warrior_guild' }); return MapSystem.travel('warrior_guild'); }
    if (action === 'travel_market') { Logger.log('ui_core', '场景切换', { to: 'market' }); return MapSystem.travel('market'); }
    if (action === 'travel_tavern') { Logger.log('ui_core', '场景切换', { to: 'tavern' }); return MapSystem.travel('tavern'); }
    if (action === 'travel_home') { Logger.log('ui_core', '场景切换', { to: 'home' }); return MapSystem.travel('home'); }
    if (action === 'travel_royal_capital') { Logger.log('ui_core', '场景切换', { to: 'royal_capital' }); return MapSystem.travel('royal_capital'); }
    // 外出探索必须在泛型 travel_ 前缀检查之前
    if (action === 'travel_explore') { Logger.log('ui_core', '外出探索'); return MapSystem.explore(); }
    if (action.indexOf('travel_') === 0) {
      var target = action.replace('travel_', '');
      Logger.log('ui_core', '场景切换', { to: target });
      return MapSystem.travel(target);
    }

    // 野外战斗/探索
    if (action === 'random_fight') {
      var locW = MapSystem.getCurrentLocation();
      if (!locW || !locW.monster) return { success: false, message: '没有可战斗目标。' };
      return EventSystem.fight(locW.monster);
    }
    if (action === 'random_explore') { return EventSystem.exploreArea(); }

    // —— 公会（硬编码回退） ——
    if (action === 'guild_join') {
      var gId = null;
      if (s.currentLocation === 'thief_guild') gId = 'thief';
      else if (s.currentLocation === 'mage_guild') gId = 'mage';
      else if (s.currentLocation === 'warrior_guild') gId = 'warrior';
      if (gId) return ClassSystem.joinGuild(gId);
      return { success: false, message: '此处无法加入公会。' };
    }

    // —— 酒馆（硬编码回退） ——
    if (action === 'tavern_eat') {
      if (s.gold < 10) return { success: false, message: '金币不足10G。' };
      PlayerState.add('gold', -10);
      PlayerState.set('hunger', Math.min(100, s.hunger + 60));
      PlayerState.set('energy', Math.min(100, s.energy + 10));
      return { success: true, message: '你享用了一顿丰盛的大餐，恢复了60点饥饿和10点精力。' };
    }
    if (action === 'tavern_drink') {
      if (s.gold < 5) return { success: false, message: '金币不足5G。' };
      PlayerState.add('gold', -5);
      PlayerState.set('thirst', Math.min(100, s.thirst + 50));
      return { success: true, message: '你喝了一大杯麦酒，清爽解渴！' };
    }
    if (action === 'tavern_rumor') {
      var tips = ['吟游诗人："幽暗森林藏着炼金配方……"','老冒险者："沙漠遗迹的法老宝藏富可敌国。"','猎人："冰霜洞穴的冰晶是宝贝。"','商人："加入公会学技能更有效率。"','酒保："别忘了补充食物和水。"'];
      return { success: true, message: '你竖起耳朵四处打听……\n「' + tips[Math.floor(Math.random() * tips.length)] + '」' };
    }

    // —— NPC 对话（双重回退：注册表优先，其次直接调用 UITown） ——
    if (action.indexOf('npc_talk_') === 0) {
      var npcId = action.replace('npc_talk_', '');
      // 优先注册表
      var talkH = actionHandlers['__npc_talk__'];
      if (typeof talkH === 'function') { talkH(npcId); return null; }
      // 回退：直接调用 UITown
      if (typeof UITown !== 'undefined' && typeof UITown.handleNPCTalk === 'function') {
        Logger.log('ui_core', 'NPC对话 直接回退 UITown', { npcId: npcId });
        UITown.handleNPCTalk(npcId);
        return null;
      }
      Logger.error('ui_core', 'NPC对话模块完全未加载');
      return { success: false, message: 'NPC对话模块未加载，请刷新页面。' };
    }
    if (action.indexOf('npc_trade_') === 0) {
      var tradeId = action.replace('npc_trade_', '');
      var tradeH = actionHandlers['__npc_trade__'];
      if (typeof tradeH === 'function') { tradeH(tradeId); return null; }
      if (typeof UITown !== 'undefined' && typeof UITown.handleNPCTrade === 'function') {
        UITown.handleNPCTrade(tradeId);
        return null;
      }
      // 默认打开商店
      showShopPopup();
      return null;
    }

    // 商店快捷
    if (action === 'open_shop') { showShopPopup(); return null; }
    if (action === 'open_sell') { showSellPopup(); return null; }

    // 铁匠铺（硬编码回退）
    if (action === 'blacksmith_buy') { showBlacksmithBuyPopup(); return null; }
    if (action === 'blacksmith_sell') { showBlacksmithSellPopup(); return null; }

    // 公会退出（硬编码回退）
    if (action === 'guild_leave') {
      Logger.error('ui_core', 'guild_leave 未注册，请检查 ui_town.js');
      return { success: false, message: '退出公会功能未加载，请刷新页面。' };
    }

    // 家园锻造/炼药（硬编码回退）
    if (action === 'forge_craft' || action === 'alchemy_craft') {
      Logger.error('ui_core', '锻造/炼药模块未注册，请检查 ui_home.js');
      return { success: false, message: '锻造/炼药功能未加载。请确保已建造对应设施并刷新页面。' };
    }

    Logger.error('ui_core', '完全未知操作: ' + action);
    return { success: false, message: '❌ 未知操作: ' + action + '\n请刷新页面后重试。' };
  }

  /** ══════ 弹窗系统 ══════ **/
  function showPopup(title, content, buttons, opts) {
    closeAllPopups();
    var container = document.getElementById('popup-container');
    if (!container) return;
    var overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    var popup = document.createElement('div');
    popup.className = 'popup';
    if (opts && opts.wide) popup.classList.add('popup-wide');
    var buttonsHtml = '';
    if (buttons && buttons.length > 0) {
      buttonsHtml = '<div class="popup-buttons">';
      for (var i = 0; i < buttons.length; i++) {
        var b = buttons[i];
        var cls = b.cls || 'popup-btn';
        buttonsHtml += '<button class="' + cls + '" onclick="(' + (b.action ? b.action.toString() : 'this.closest(\'.popup-overlay\').remove()') + ')()">' + b.label + '</button>';
      }
      buttonsHtml += '</div>';
    }
    popup.innerHTML = '<div class="popup-header"><div class="popup-title">' + title + '</div><button class="popup-close-btn" onclick="this.closest(\'.popup-overlay\').remove()">✕</button></div><div class="popup-content">' + content + '</div>' + buttonsHtml;
    overlay.appendChild(popup);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    container.appendChild(overlay);
    if (buttons) {
      var btnEls = popup.querySelectorAll('.popup-buttons button');
      for (var j = 0; j < btnEls.length; j++) {
        if (buttons[j] && buttons[j].onclick) btnEls[j].onclick = buttons[j].onclick;
      }
    }
  }

  function closeAllPopups() {
    var container = document.getElementById('popup-container');
    if (container) container.innerHTML = '';
  }

  /** ══════ 地图弹窗 ══════ **/
  function showMapPopup() {
    var s = PlayerState.getState();
    var allLocs = Locations.fixed;
    var discovered = s.discoveredLocations;

    function status(id) {
      if (!discovered.includes(id)) return 'undiscovered';
      if (id === s.currentLocation) return 'current';
      return 'discovered';
    }

    var content = '<div class="map-grid">';
    for (var id in allLocs) {
      var loc = allLocs[id];
      if (id === 'guild_district') continue;
      var st = status(id);
      var name = st === 'undiscovered' ? '❓ 未知' : loc.name;
      var act = '';
      if (st === 'current') act = '<span class="map-tag-current">📍 当前</span>';
      else if (st === 'discovered') act = '<button class="popup-btn small map-travel-btn" data-target="' + id + '">前往</button>';
      content += '<div class="map-loc ' + st + '"><div class="map-loc-name">' + name + '</div><div class="map-loc-actions">' + act + '</div></div>';
    }
    content += '</div>';

    showPopup('🗺️ 世界地图', content, [
      { label: '关闭', action: function () { closeAllPopups(); } }
    ]);

    setTimeout(function () {
      document.querySelectorAll('.map-travel-btn').forEach(function (btn) {
        btn.onclick = function () {
          var target = btn.getAttribute('data-target');
          closeAllPopups();
          renderAll(MapSystem.travel(target));
        };
      });
    }, 50);
  }

  /** ══════ 背包弹窗 ══════ **/
  function showInventoryPopup() {
    var s = PlayerState.getState();
    var items = s.inventory.slice();
    if (items.length === 0) {
      showPopup('🎒 背包', '<div class="inv-empty-popup">背包空空如也<br>在野外探索或商店购买可获得物品。</div>', [
        { label: '关闭', action: function () { closeAllPopups(); } }
      ]);
      return;
    }

    var sortMode = 'name';
    var filterType = 'all';
    var sortAsc = true;

    function renderInv() {
      var filtered = items;
      if (filterType !== 'all') filtered = items.filter(function (i) { return i.type === filterType; });
      filtered.sort(function (a, b) {
        if (sortMode === 'name') return (a.name || '').localeCompare(b.name || '') * (sortAsc ? 1 : -1);
        if (sortMode === 'qty') return ((a.qty || 0) - (b.qty || 0)) * (sortAsc ? 1 : -1);
        if (sortMode === 'type') return ((a.type || '').localeCompare(b.type || '')) * (sortAsc ? 1 : -1);
        return 0;
      });
      if (filtered.length === 0) return '<div class="inv-empty-popup">此分类下没有物品</div>';
      var h = '<div class="inv-popup-list">';
      for (var i = 0; i < filtered.length; i++) {
        var item = filtered[i];
        var typeIcons = { food: '🍞', drink: '💧', potion: '🧪', material: '🔮', scroll: '📜', weapon: '⚔️', armor: '🛡️', furniture: '🛏️', tool: '🔧' };
        var icon = typeIcons[item.type] || '📦';
        var useBtn = '';
        if (item.type === 'food' || item.type === 'drink' || item.type === 'potion') {
          useBtn = '<button class="popup-btn small" data-use="' + item.id + '">使用</button>';
        }
        h += '<div class="inv-popup-item"><span>' + icon + ' ' + item.name + '</span><span class="inv-item-qty">x' + (item.qty || 1) + '</span><span class="inv-item-type">[' + (item.type || '?') + ']</span>' + useBtn + '<button class="popup-btn small danger" data-drop="' + item.id + '">丢弃</button></div>';
      }
      h += '</div><div class="inv-popup-footer">共 ' + filtered.length + ' 种 | 💰 ' + s.gold + ' G</div>';
      return h;
    }

    var tabBar = '<div class="inv-tabs">' +
      '<button class="inv-tab active" data-filter="all">全部</button>' +
      '<button class="inv-tab" data-filter="food">🍞 食物</button>' +
      '<button class="inv-tab" data-filter="drink">💧 饮水</button>' +
      '<button class="inv-tab" data-filter="potion">🧪 药水</button>' +
      '<button class="inv-tab" data-filter="material">🔮 材料</button>' +
      '</div>' +
      '<div class="inv-sort">' +
      '<button class="inv-sort-btn active" data-sort="name">名称 ' + (sortAsc ? '▲' : '▼') + '</button>' +
      '<button class="inv-sort-btn" data-sort="qty">数量</button>' +
      '<button class="inv-sort-btn" data-sort="type">类型</button>' +
      '<button class="inv-sort-btn" id="inv-toggle-order">' + (sortAsc ? '升序' : '降序') + '</button>' +
      '</div>';

    showPopup('🎒 背包', tabBar + '<div id="inv-popup-body">' + renderInv() + '</div>', [
      { label: '🔄 整理', action: function () { autoSort(); closeAllPopups(); showInventoryPopup(); } },
      { label: '关闭', action: function () { closeAllPopups(); } }
    ], { wide: true });

    setTimeout(bindInvEvents, 50);
  }

  function bindInvEvents() {
    document.querySelectorAll('.inv-tab').forEach(function (tab) {
      tab.onclick = function () {
        document.querySelectorAll('.inv-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        // 由于闭包限制，这里重新调用 showInventoryPopup 更安全
        closeAllPopups();
        showInventoryPopup();
      };
    });
    document.querySelectorAll('[data-use]').forEach(function (btn) {
      btn.onclick = function () {
        var itemId = btn.getAttribute('data-use');
        doUseItem(itemId);
        closeAllPopups();
      };
    });
    document.querySelectorAll('[data-drop]').forEach(function (btn) {
      btn.onclick = function () {
        var itemId = btn.getAttribute('data-drop');
        var name = getItemName(itemId);
        if (confirm('确定丢弃 ' + name + '？')) {
          PlayerState.removeItem(itemId, 99);
          showToast('已丢弃 ' + name, 'toast-error');
          closeAllPopups();
          renderAll();
        }
      };
    });
  }

  function doUseItem(itemId) {
    var s = PlayerState.getState();
    var item = s.inventory.find(function (i) { return i.id === itemId; });
    if (!item) return;

    Logger.log('ui_core', '使用物品', { itemId: itemId, name: item.name, type: item.type });

    if (item.type === 'food' && item.hungerRestore) {
      SurvivalSystem.eat(item.hungerRestore, 0);
      PlayerState.removeItem(itemId, 1);
      addMessage('你食用了' + item.name + '，恢复了' + item.hungerRestore + '点饥饿。', 'msg-success');
      showToast('🍞 使用 ' + item.name + ' — 饥饿 +' + item.hungerRestore, 'toast-item');
    } else if (item.type === 'drink' && item.thirstRestore) {
      SurvivalSystem.drink(item.thirstRestore);
      if (item.energyRestore) PlayerState.set('energy', Math.min(100, PlayerState.get('energy') + item.energyRestore));
      PlayerState.removeItem(itemId, 1);
      var extra = item.energyRestore ? '，精力+' + item.energyRestore : '';
      addMessage('你饮用了' + item.name + '，恢复了' + item.thirstRestore + '点口渴。' + extra, 'msg-success');
      showToast('💧 使用 ' + item.name + ' — 口渴 +' + item.thirstRestore + extra, 'toast-item');
    } else if (item.type === 'potion' && item.healthRestore) {
      PlayerState.set('health', Math.min(s.maxHealth, s.health + item.healthRestore));
      if (item.energyRestore) PlayerState.set('energy', Math.min(100, s.energy + item.energyRestore));
      PlayerState.removeItem(itemId, 1);
      addMessage('你使用了' + item.name + '，恢复了' + item.healthRestore + '点生命。', 'msg-success');
      showToast('🧪 使用 ' + item.name + ' — 生命 +' + item.healthRestore, 'toast-item');
    } else if (item.type === 'potion' && item.energyRestore) {
      PlayerState.set('energy', Math.min(100, s.energy + item.energyRestore));
      PlayerState.removeItem(itemId, 1);
      addMessage('你使用了' + item.name + '，恢复了' + item.energyRestore + '点精力。', 'msg-success');
      showToast('⚡ 使用 ' + item.name + ' — 精力 +' + item.energyRestore, 'toast-item');
    }
    renderAll();
  }

  function autoSort() {
    var s = PlayerState.getState();
    var order = { food: 0, drink: 1, potion: 2, material: 3, scroll: 4, weapon: 5, armor: 6, tool: 7, furniture: 8 };
    s.inventory.sort(function (a, b) {
      var oa = order[a.type] != null ? order[a.type] : 99;
      var ob = order[b.type] != null ? order[b.type] : 99;
      if (oa !== ob) return oa - ob;
      return (a.name || '').localeCompare(b.name || '');
    });
    PlayerState.save();
    Logger.log('ui_core', '背包自动整理');
  }

  /** ══════ 商店弹窗 ══════ **/
  function showShopPopup() {
    var s = PlayerState.getState();
    var shopItems = ['02001', '02002', '02003', '02004', '02007', '02008', '02009', '02010'];
    var content = '<div class="shop-popup-header">💰 持有金币: <b style="color:var(--gold)">' + s.gold + ' G</b></div><div class="shop-list">';
    for (var i = 0; i < shopItems.length; i++) {
      var item = getItem(shopItems[i]);
      if (!item) continue;
      var canBuy = s.gold >= item.price;
      content += '<div class="shop-item-row"><span>' + item.name + '</span><span class="shop-desc">' + item.desc + '</span><span class="shop-price">' + item.price + 'G</span>' +
        (canBuy ? '<button class="popup-btn small shop-buy-btn" data-id="' + item.id + '">购买</button>' : '<span class="shop-no-gold">金币不足</span>') + '</div>';
    }
    content += '</div>';

    showPopup('🛒 市场', content, [{ label: '关闭', action: function () { closeAllPopups(); } }]);

    setTimeout(function () {
      document.querySelectorAll('.shop-buy-btn').forEach(function (btn) {
        btn.onclick = function () {
          var id = btn.getAttribute('data-id');
          var dbItem = getItem(id);
          if (!dbItem || PlayerState.get('gold') < dbItem.price) return;
          PlayerState.add('gold', -dbItem.price);
          PlayerState.addItem(createItem(id, 1));
          Logger.log('ui_core', '购买物品', { itemId: id, name: dbItem.name, price: dbItem.price });
          showToast('🛒 购买 ' + dbItem.name + ' -' + dbItem.price + 'G', 'toast-gold');
          closeAllPopups();
          renderAll({ success: true, message: '购买了 ' + dbItem.name + '，花费 ' + dbItem.price + ' 金币。' });
        };
      });
    }, 50);
  }

  /** ══════ 出售弹窗 ══════ **/
  function showSellPopup() {
    var s = PlayerState.getState();
    var items = s.inventory.slice();
    if (items.length === 0) {
      showPopup('💰 出售物品', '<div class="inv-empty-popup">背包空空如也，没有可出售的物品。</div>', [
        { label: '关闭', action: function () { closeAllPopups(); } }
      ]);
      return;
    }

    var content = '<div class="shop-popup-header">💰 持有金币: <b style="color:var(--gold)">' + s.gold + ' G</b></div><div class="shop-list">';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var dbItem = getItem(item.id);
      var sellPrice = Math.floor((dbItem ? dbItem.price : 1) * 0.5); // 半价出售
      if (sellPrice < 1) sellPrice = 1;
      content += '<div class="shop-item-row">' +
        '<span>' + item.name + '</span>' +
        '<span class="shop-desc">x' + (item.qty || 1) + '</span>' +
        '<span class="shop-price">' + sellPrice + 'G</span>' +
        '<button class="popup-btn small sell-btn" data-id="' + item.id + '" data-price="' + sellPrice + '">出售</button>' +
      '</div>';
    }
    content += '</div>';

    showPopup('💰 出售物品 — 商人汉斯收购', content, [
      { label: '关闭', action: function () { closeAllPopups(); } }
    ]);

    setTimeout(function () {
      document.querySelectorAll('.sell-btn').forEach(function (btn) {
        btn.onclick = function () {
          var itemId = btn.getAttribute('data-id');
          var price = parseInt(btn.getAttribute('data-price'));
          var curState = PlayerState.getState();
          var item = curState.inventory.find(function(x) { return x.id === itemId; });
          if (!item) return;
          PlayerState.removeItem(itemId, 1);
          PlayerState.add('gold', price);
          Logger.log('ui_core', '出售物品', { itemId: itemId, name: item.name, price: price });
          showToast('💰 出售 ' + item.name + ' +' + price + 'G', 'toast-gold');
          closeAllPopups();
          renderAll({ success: true, message: '出售了【' + item.name + '】，获得 ' + price + ' 金币。' });
        };
      });
    }, 50);
  }

  /** ══════ 铁匠铺购买材料 ══════ **/
  function showBlacksmithBuyPopup() {
    var s = PlayerState.getState();
    var materialItems = ['01001', '01002', '01003', '01004', '01005', '01010', '01011', '01012', '01013'];
    var content = '<div class="shop-popup-header">🔨 老铁匠奥恩的材料铺 | 💰 持有: <b style="color:var(--gold)">' + s.gold + ' G</b></div><div class="shop-list">';
    for (var i = 0; i < materialItems.length; i++) {
      var item = getItem(materialItems[i]);
      if (!item) continue;
      var canBuy = s.gold >= item.price;
      content += '<div class="shop-item-row">' +
        '<span>' + item.name + '</span><span class="shop-desc">' + (item.desc || '') + '</span>' +
        '<span class="shop-price">' + item.price + 'G</span>' +
        (canBuy ? '<button class="popup-btn small bs-buy-btn" data-id="' + item.id + '">购买</button>' : '<span class="shop-no-gold">金币不足</span>') +
      '</div>';
    }
    content += '</div>';

    showPopup('🔨 铁匠铺 — 购买材料', content, [
      { label: '关闭', action: function () { closeAllPopups(); } }
    ]);

    setTimeout(function () {
      document.querySelectorAll('.bs-buy-btn').forEach(function (btn) {
        btn.onclick = function () {
          var id = btn.getAttribute('data-id');
          var dbItem = getItem(id);
          if (!dbItem || PlayerState.get('gold') < dbItem.price) return;
          PlayerState.add('gold', -dbItem.price);
          PlayerState.addItem(createItem(id, 1));
          Logger.log('ui_core', '铁匠铺购买', { itemId: id, name: dbItem.name, price: dbItem.price });
          showToast('🔨 购买 ' + dbItem.name + ' -' + dbItem.price + 'G', 'toast-gold');
          closeAllPopups();
          renderAll({ success: true, message: '从铁匠铺购买了【' + dbItem.name + '】，花费 ' + dbItem.price + ' 金币。' });
        };
      });
    }, 50);
  }

  /** ══════ 铁匠铺出售材料 ══════ **/
  function showBlacksmithSellPopup() {
    var s = PlayerState.getState();
    var materials = s.inventory.filter(function(x) { return x.type === 'material'; });
    if (materials.length === 0) {
      showPopup('💰 出售材料', '<div class="inv-empty-popup">背包中没有可出售的材料。<br>在野外探索可获得材料。</div>', [
        { label: '关闭', action: function () { closeAllPopups(); } }
      ]);
      return;
    }

    var content = '<div class="shop-popup-header">🔨 老铁匠奥恩收购材料 | 💰 持有: <b style="color:var(--gold)">' + s.gold + ' G</b></div><div class="shop-list">';
    for (var i = 0; i < materials.length; i++) {
      var item = materials[i];
      var dbItem = getItem(item.id);
      var sellPrice = Math.floor((dbItem ? dbItem.price : 1) * 0.7); // 材料70%回收价
      if (sellPrice < 1) sellPrice = 1;
      content += '<div class="shop-item-row">' +
        '<span>' + item.name + '</span>' +
        '<span class="shop-desc">x' + (item.qty || 1) + '</span>' +
        '<span class="shop-price">' + sellPrice + 'G</span>' +
        '<button class="popup-btn small bs-sell-btn" data-id="' + item.id + '" data-price="' + sellPrice + '">出售</button>' +
      '</div>';
    }
    content += '</div>';

    showPopup('💰 铁匠铺 — 出售材料', content, [
      { label: '关闭', action: function () { closeAllPopups(); } }
    ]);

    setTimeout(function () {
      document.querySelectorAll('.bs-sell-btn').forEach(function (btn) {
        btn.onclick = function () {
          var itemId = btn.getAttribute('data-id');
          var price = parseInt(btn.getAttribute('data-price'));
          var curState = PlayerState.getState();
          var item = curState.inventory.find(function(x) { return x.id === itemId; });
          if (!item) return;
          PlayerState.removeItem(itemId, 1);
          PlayerState.add('gold', price);
          Logger.log('ui_core', '铁匠铺出售', { itemId: itemId, name: item.name, price: price });
          showToast('🔨 出售 ' + item.name + ' +' + price + 'G', 'toast-gold');
          closeAllPopups();
          renderAll({ success: true, message: '向铁匠出售了【' + item.name + '】，获得 ' + price + ' 金币。' });
        };
      });
    }, 50);
  }

  /** ══════ 暴露接口 ══════ **/
  return {
    // 注册
    registerSceneBuilder: registerSceneBuilder,
    registerActionHandler: registerActionHandler,
    // 渲染
    renderAll: renderAll,
    renderQuick: renderQuick,
    renderHeaderStatus: renderHeaderStatus,
    renderLocation: renderLocation,
    renderFooter: renderFooter,
    renderContextActions: renderContextActions,
    // 上下文
    getContext: getContext,
    // 按钮组件
    buildCoreActions: buildCoreActions,
    buildTravelActions: buildTravelActions,
    buildSceneActions: buildSceneActions,
    buildNPCActions: buildNPCActions,
    buildActionButton: buildActionButton,
    // 动作
    handleAction: handleAction,
    dispatchAction: dispatchAction,
    // 消息
    renderMessages: renderMessages,
    addMessage: addMessage,
    showToast: showToast,
    // 弹窗
    showPopup: showPopup,
    closeAllPopups: closeAllPopups,
    showMapPopup: showMapPopup,
    showInventoryPopup: showInventoryPopup,
    showShopPopup: showShopPopup,
    showSellPopup: showSellPopup,
    showBlacksmithBuyPopup: showBlacksmithBuyPopup,
    showBlacksmithSellPopup: showBlacksmithSellPopup,
    doUseItem: doUseItem,
    autoSort: autoSort,
    // 注册表
    sceneBuilders: sceneBuilders,
    actionHandlers: actionHandlers
  };
})();
