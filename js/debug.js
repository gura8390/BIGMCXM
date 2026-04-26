/**
 * debug.js — 调试与作弊指令系统
 * 通过控制台 Cheats.run('cmd') 或页面输入框触发
 */
var Cheats = (function () {
  'use strict';

  if (typeof Logger !== 'undefined') Logger.system('debug.js');

  /** 指令注册表 */
  var commands = {};

  function register(name, fn, desc) {
    commands[name] = { fn: fn, desc: desc || '' };
    Logger.log('debug', '注册指令', { cmd: name, desc: desc });
  }

  /** 执行指令 */
  function run(cmd) {
    cmd = (cmd || '').trim().toLowerCase();
    if (!cmd) {
      UI.showToast('⚠ 请输入指令名称', 'toast-error');
      return false;
    }

    var entry = commands[cmd];
    if (!entry) {
      UI.showToast('❌ 未知指令: ' + cmd, 'toast-error');
      UI.addMessage('❌ 未知调试指令: ' + cmd + '\n可用: ' + listCommands().join(', '), 'msg-error');
      Logger.error('debug', '未知指令: ' + cmd);
      return false;
    }

    try {
      var msg = entry.fn();
      Logger.log('debug', '执行指令', { cmd: cmd, result: msg });
      UI.addMessage('🔧 [调试] ' + msg, 'msg-accent');
      UI.renderAll();
      return true;
    } catch (e) {
      Logger.error('debug', '指令执行异常: ' + cmd, e);
      UI.addMessage('❌ 指令执行失败: ' + (e.message || '未知'), 'msg-error');
      return false;
    }
  }

  function listCommands() {
    return Object.keys(commands);
  }

  /** ══════ 注册基础指令 ══════ **/
  register('cash', function () {
    PlayerState.add('gold', 5000);
    UI.showToast('💰 +5000 金币', 'toast-gold');
    return '金币 +5000（当前: ' + PlayerState.get('gold') + ' G）';
  }, '增加5000金币');

  register('food', function () {
    PlayerState.set('hunger', 100);
    PlayerState.set('thirst', 100);
    UI.showToast('🍞 饥饿值已恢复', 'toast-item');
    return '饥饿与口渴恢复至100';
  }, '恢复饥饿与口渴至满');

  register('heal', function () {
    var s = PlayerState.getState();
    PlayerState.set('health', s.maxHealth);
    PlayerState.set('energy', 100);
    UI.showToast('❤️ 生命与精力已恢复', 'toast-item');
    return '生命恢复至' + s.maxHealth + '，精力恢复至100';
  }, '恢复生命与精力至满');

  register('levelup', function () {
    PlayerState.add('exp', PlayerState.get('nextLevelExp'));
    var newLv = PlayerState.get('level');
    UI.showToast('⭐ 升级至 Lv.' + newLv, 'toast-gold');
    return '已升级，当前 Lv.' + newLv;
  }, '提升一个等级');

  register('items', function () {
    var giveList = ['02001', '02002', '02003', '02004', '01002', '01003', '01004', '01005', '01008'];
    for (var i = 0; i < giveList.length; i++) {
      PlayerState.addItem(createItem(giveList[i], 3));
    }
    UI.showToast('📦 获得多种物品 x3', 'toast-item');
    return '获得食物/饮水/材料各3个';
  }, '获得常用物品包');

  register('home', function () {
    PlayerState.set('hasHome', true);
    if (!PlayerState.get('homeFacilities').includes('bed')) {
      var f = PlayerState.get('homeFacilities').slice();
      f.push('bed');
      PlayerState.set('homeFacilities', f);
    }
    PlayerState.set('tutorialStage', 'complete');
    UI.showToast('🏠 家园已解锁', 'toast-gold');
    return '家园已解锁，木床已建造，教程已跳过';
  }, '直接解锁家园并跳过教程');

  register('help', function () {
    var list = listCommands();
    var msg = '可用指令: ' + list.join(', ');
    UI.addMessage('🔧 ' + msg, 'msg-accent');
    return msg;
  }, '显示所有可用指令');

  /** ══════ 暴露接口 ══════ **/
  if (typeof window !== 'undefined') {
    window.Cheats = {
      run: run,
      list: listCommands,
      register: register
    };
  }

  return {
    run: run,
    list: listCommands,
    register: register
  };
})();
