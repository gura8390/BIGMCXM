/**
 * ui.js — UI 总控模块 (v3)
 * 组装 UICore + UITown + UIHome + UIWorld，暴露 window.UI
 */
(function () {
  'use strict';

  if (typeof Logger !== 'undefined') Logger.system('ui.js');

  /** 初始化 */
  function init() {
    try {
      UICore.renderAll();
      Logger.log('ui', 'UI 初始化渲染完成');
    } catch (e) {
      Logger.error('ui', '初始化渲染失败', e);
      var el = document.getElementById('actions-panel');
      if (el) el.innerHTML = '<div class="action-fallback"><div style="color:var(--danger);margin-bottom:8px">⚠ 渲染失败: ' + (e.message || '') + '</div><button class="action-btn" onclick="location.reload()">🔄 刷新页面</button></div>';
    }
  }

  /** 暴露全局接口 */
  if (typeof window !== 'undefined') {
    window.UI = {
      init: init,
      handleAction: UICore.handleAction,
      renderAll: UICore.renderAll,
      renderQuick: UICore.renderQuick,
      addMessage: UICore.addMessage,
      showToast: UICore.showToast
    };
  }

  // 向后兼容：也暴露到 UICore 全局
  window.UICore = UICore;
})();
