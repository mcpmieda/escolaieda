(() => {
  const target = window.__IEDA_GITHUB_TARGET__;
  if (target && !target.production) {
    const actions = document.querySelector('.topbarActions');
    const saveButton = document.getElementById('btnSalvar');
    if (actions && saveButton && !actions.querySelector('[data-test-mode]')) {
      const badge = document.createElement('span');
      badge.className = 'button buttonGhost';
      badge.dataset.testMode = '';
      badge.setAttribute('aria-label', `Modo de teste. Salvamentos vão para a branch ${target.branch}.`);
      badge.title = `Salvamentos vão para ${target.branch}`;
      badge.textContent = 'Modo de teste';
      actions.insertBefore(badge, saveButton);
    }
  }

  window.addEventListener('load', () => {
    import('./editor-sharepoint-cms.js').catch((erro) => {
      console.error('Não foi possível ativar o salvamento SharePoint do editor.', erro);
    });
  }, { once: true });
})();