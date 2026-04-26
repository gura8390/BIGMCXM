/**
 * logger.js — 全局日志包装器（最先加载）
 */
(function () {
  'use strict';
  window.Logger = {
    log: function (module, msg, data) {
      var ts = new Date().toISOString().split('T')[1].slice(0, 12);
      if (data !== undefined) {
        console.log('%c[' + ts + ']%c [' + module + '] %c' + msg, 'color:#888', 'color:#00e5ff', 'color:#ccc', data);
      } else {
        console.log('%c[' + ts + ']%c [' + module + '] %c' + msg, 'color:#888', 'color:#00e5ff', 'color:#ccc');
      }
    },
    error: function (module, msg, err) {
      var ts = new Date().toISOString().split('T')[1].slice(0, 12);
      console.error('%c[' + ts + ']%c [' + module + '] %cERROR: ' + msg, 'color:#888', 'color:#ff5252', 'color:#ff5252');
      if (err) console.error(err);
    },
    flow: function (stage) {
      console.log('%c[Flow] %c▶ %c' + stage, 'color:#ffb000', 'color:#ffb000', 'color:#00e5ff');
    },
    system: function (name) {
      console.log('%c[System] %c' + name + ' %c加载成功', 'color:#69f0ae', 'color:#69f0ae', 'color:#aaa');
    }
  };
})();
