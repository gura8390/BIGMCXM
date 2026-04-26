/**
 * main.js — 冒险者 v3
 * 教程状态机 · 游戏循环
 */
(function () {
  'use strict';

  Logger.system('main.js');

  /** ══════ 模块加载验证 ══════ **/
  function verifyModules() {
    var names = ['PlayerState', 'SurvivalSystem', 'Locations', 'MapSystem', 'ClassSystem', 'HomeSystem', 'TechSystem', 'EventSystem', 'NPCSystem', 'UICore', 'UITown', 'UIHome', 'UIWorld'];
    for (var i = 0; i < names.length; i++) {
      try {
        var exists = (typeof eval(names[i]) !== 'undefined');
        if (exists) Logger.system(names[i] + ' (verified)');
        else Logger.error('main', names[i] + ' 未定义');
      } catch (e) {
        Logger.error('main', names[i] + ' 检查异常');
      }
    }
  }

  /** ══════ 初始化 ══════ **/
  function init() {
    Logger.log('main', '游戏初始化开始');
    verifyModules();

    var loaded = false;

    try {
      loaded = PlayerState.load();
      Logger.log('main', '存档读取结果', { loaded: loaded });
    } catch (e) {
      Logger.error('main', '存档读取失败', e);
      loaded = false;
    }

    if (!loaded) {
      try {
        PlayerState.reset();
        PlayerState.set('tutorialStage', 'init');
        PlayerState.set('hasHome', false);
        PlayerState.set('homeFacilities', []);
        Logger.flow('新游戏开始 — 教程阶段: init');
      } catch (e) {
        Logger.error('main', '状态初始化失败', e);
        UI.addMessage('⚠️ 游戏状态初始化失败，请刷新页面重试。', 'msg-error');
        return;
      }
    } else {
      UI.addMessage('📂 已读取存档。欢迎回来！', 'msg-info');
      var ts = PlayerState.get('tutorialStage') || 'complete';
      Logger.log('main', '教程阶段', { tutorialStage: ts });
      if (ts !== 'complete') Logger.flow('教程未完成，当前阶段: ' + ts);
    }

    try {
      SurvivalSystem.start();
      Logger.log('main', '生存系统已启动');
    } catch (e) {
      Logger.error('main', '生存系统启动失败', e);
    }

    startGameLoop();
    Logger.log('main', '游戏循环已启动');

    try {
      UI.renderAll();
      Logger.log('main', 'UI 初次渲染完成');
    } catch (e) {
      Logger.error('main', 'UI 初次渲染失败', e);
      UI.addMessage('⚠️ 界面渲染异常，请刷新页面。', 'msg-error');
    }

    if (!loaded) {
      UI.addMessage('⚔️ 欢迎来到《冒险者》！\n你站在城镇广场的喷泉旁，四周人来人往。一位白发老者注意到了你……', 'msg-info');
      UI.addMessage('💡 教程提示：点击右侧【💬 与老村长交谈】按钮开始冒险。', 'msg-accent');
    } else {
      var ts2 = PlayerState.get('tutorialStage') || 'complete';
      if (ts2 !== 'complete') {
        UI.addMessage('💡 教程未完成。请继续跟随引导操作。', 'msg-accent');
      } else {
        UI.addMessage('💡 提示：右侧面板显示当前可用操作。留意顶部状态条。', 'msg-info');
      }
    }
    Logger.log('main', '初始化完成');
  }

  /** ══════ 游戏循环 ══════ **/
  function startGameLoop() {
    setInterval(function () {
      try {
        var s = PlayerState.getState();

        if (Date.now() - s.lastTick > SurvivalSystem.TICK_INTERVAL * 24) {
          PlayerState.add('days', 1);
          Logger.log('survival', '天数+1', { days: s.days });
        }

        var autoGold = TechSystem.autoGoldTick();
        if (autoGold > 0) {
          UI.addMessage('⚙️ 自动化装置生产了 ' + autoGold + ' 金币。', 'msg-gold');
          Logger.log('tech', '自动化金币产出', { gold: autoGold });
        }

        UI.renderQuick();

        if (s.health <= 0) {
          Logger.flow('玩家死亡 — 传送回城镇');
          SurvivalSystem.stop();
          UI.addMessage('💀 生命值归零……你被送回了城镇广场。', 'msg-error');
          PlayerState.set('health', 10);
          PlayerState.set('thirst', 50);
          PlayerState.set('hunger', 50);
          PlayerState.set('energy', 50);
          PlayerState.set('currentLocation', 'town_square');
          SurvivalSystem.start();
          UI.renderAll();
        }
      } catch (e) {
        Logger.error('main', '游戏循环异常', e);
      }
    }, 5000);
  }

  // DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      try { init(); } catch (e) { Logger.error('main', 'DOM init异常', e); }
    });
  } else {
    try { init(); } catch (e) { Logger.error('main', '直接init异常', e); }
  }

  /** 新游戏 */
  window.newGame = function () {
    Logger.flow('用户触发新游戏');
    if (confirm('确定要开始新游戏吗？当前存档将被覆盖！')) {
      PlayerState.clearSave();
      PlayerState.reset();
      NPCSystem.resetMemory();
      SurvivalSystem.stop();
      PlayerState.set('tutorialStage', 'init');
      PlayerState.set('hasHome', false);
      PlayerState.set('homeFacilities', []);
      SurvivalSystem.start();
      UI.addMessage('⚔️ 新的冒险开始了！你来到了城镇广场。', 'msg-info');
      UI.addMessage('💡 点击【💬 与老村长交谈】开始教程。', 'msg-accent');
      UI.renderAll();
      Logger.flow('新游戏已创建 — 教程阶段: init');
    }
  };
})();
