(() => {
  // Give the default language a real route so relative Markdown links retain it.
  if (!location.hash || /^#\/?$/.test(location.hash)) history.replaceState(null, '', '#/en/');
  const published = location.hostname === 'miao-org.github.io';
  const liveMarkdown = (path, _match, next) => {
    const route = path === '/' ? '/en/' : path;
    if (!/^\/(en|zh-CN)\/(?:[\w-]+\/)*[\w.-]*$/.test(route) || route.includes('..')) {
      next();
      return;
    }
    const file = route.endsWith('/') ? `${route}README.md` : `${route.replace(/\.md$/, '')}.md`;
    // Read the merged source directly: Markdown-only PRs do not wait for a
    // Pages deployment. The unique query avoids reusing a stale CDN response.
    fetch(`https://raw.githubusercontent.com/miao-org/white-paper/main/docs${file}?v=${Date.now()}`, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
      .then(response => {
        if (!response.ok) throw new Error(`Markdown HTTP ${response.status}`);
        return response.text();
      })
      .then(next)
      .catch(error => {
        console.warn('Live Markdown unavailable; using the published Pages copy.', error);
        next();
      });
  };
  let chinese = location.hash.startsWith('#/zh-CN');
  const themeButton = document.querySelector('#theme-toggle');
  const syncThemeButton = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    const label = chinese ? (dark ? '切换浅色模式' : '切换深色模式') : (dark ? 'Switch to light mode' : 'Switch to dark mode');
    themeButton.setAttribute('aria-label', label);
    themeButton.title = label;
    themeButton.setAttribute('aria-pressed', String(dark));
  };
  syncThemeButton();
  themeButton.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('white-paper-theme', theme); } catch { /* Optional preference. */ }
    syncThemeButton();
  });
  window.$docsify = {
    homepage: 'en/README.md',
    relativePath: true,
    hideSidebar: true,
    auto2top: true,
    executeScript: false,
    skipLink: 'Skip to content / 跳转到正文',
    // A reload revalidates Markdown. No service worker or search-index cache.
    requestHeaders: { 'Cache-Control': 'no-cache' },
    routes: published ? { '/.*': liveMarkdown } : {},
    plugins: [(hook, vm) => {
      hook.beforeEach((markdown) => {
        chinese = vm.route.path.startsWith('/zh-CN/');
        const locale = chinese ? 'zh-CN' : 'en';
        const page = vm.route.path.replace(/^\/(en|zh-CN)\/?/, '').replace(/^\//, '').replace(/\.md$/, '');
        document.documentElement.lang = locale;
        document.querySelector('.brand').href = `#/${locale}/`;
        document.querySelector('.brand span').textContent = chinese ? '机器人工程师学习计划' : 'Robotics Engineer Learning Plan';
        document.querySelector('.brand').setAttribute('aria-label', chinese ? '机器人工程师学习计划' : 'Robotics Engineer Learning Plan');
        const switcher = document.querySelector('#language-toggle');
        switcher.href = `#/${chinese ? 'en' : 'zh-CN'}/${page === 'README' ? '' : page}`;
        switcher.textContent = chinese ? 'English' : '简体中文';
        switcher.lang = chinese ? 'en' : 'zh-CN';
        switcher.setAttribute('aria-label', chinese ? 'Read this page in English' : '用中文阅读此页');
        syncThemeButton();
        return markdown;
      });
      hook.doneEach(() => {
        // Ignored asset links are relative to the Markdown file on GitHub, but
        // to index.html in Docsify. Keep them valid under a Pages subdirectory.
        document.querySelectorAll('.markdown-section a[href^="../data/"]').forEach(link => {
          link.href = new URL(link.getAttribute('href').slice(3), location.href).href;
        });
        document.body.classList.toggle('tree-page', Boolean(document.querySelector('#knowledge-tree')));
        window.RoboticsTree?.mount(document.querySelector('#knowledge-tree'), chinese ? 'zh-CN' : 'en');
        const title = document.querySelector('.markdown-section h1')?.textContent;
        document.title = title ? `${title} · Robotics Engineer Learning Plan` : (chinese ? '机器人工程师学习计划' : 'Robotics Engineer Learning Plan');
      });
    }],
  };
})();
