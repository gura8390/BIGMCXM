/**
 * ui_world.js — 野外探索 + 战斗 交互模块
 * 向 UICore 注册场景构建器和动作处理器
 */
var UIWorld = (function () {
  'use strict';

  if (typeof Logger !== 'undefined') Logger.system('ui_world.js');

  /** ══════ 注册场景构建器 ══════ **/
  UICore.registerSceneBuilder('wild', function (loc, s) {
    var btns = [];
    if (loc && loc.monster && !loc.cleared) {
      btns.push(UICore.buildActionButton('⚔️ 战斗', 'random_fight', '挑战' + loc.monster));
      btns.push(UICore.buildActionButton('🔍 探索', 'random_explore', '搜索周围区域'));
    }
    btns.push(UICore.buildActionButton('💤 休息', 'rest_wild', '恢复少量精力（野外不安全）'));
    Logger.log('ui_world', '野外场景按钮', { monster: loc ? loc.monster : 'none', count: btns.length });
    return btns;
  });

  /** ══════ 注册动作处理器 ══════ **/
  UICore.registerActionHandler('random_explore', function () {
    Logger.log('ui_world', '野外探索');
    return EventSystem.exploreArea();
  });
  UICore.registerActionHandler('random_fight', function () {
    handleRandomFight();
    return null;
  });
  UICore.registerActionHandler('rest_wild', function () {
    SurvivalSystem.rest(10);
    SurvivalSystem.forceTick(1);
    Logger.log('survival', '野外休息', { energy: 10 });
    return { success: true, message: '你找了个角落休息，恢复10点精力。野外不太安全……' };
  });

  /** ══════ 战斗 ══════ **/
  function handleRandomFight() {
    var loc = MapSystem.getCurrentLocation();
    if (!loc || !loc.monster) {
      UICore.renderAll({ success: false, message: '没有可战斗目标。' });
      return;
    }
    Logger.log('ui_world', '进入战斗', { monster: loc.monster });
    var result = EventSystem.fight(loc.monster);
    UICore.renderAll(result);
    if (result.success) {
      UICore.addMessage('⚔️ 战斗胜利！', 'msg-success');
      Logger.log('ui_world', '战斗胜利', { gold: result.gold, exp: result.exp });
    } else if (result.fled) {
      Logger.log('ui_world', '战斗失败 — 逃回城镇');
    }
  }

  return {
    handleRandomFight: handleRandomFight
  };
})();
