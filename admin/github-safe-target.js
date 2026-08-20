(() => {
  const API_PREFIX = "https://api.github.com/repos/mcpmieda/escolaieda";
  const DEVELOPMENT_BRANCH = "feat/admin-visual-builder";
  const PRODUCTION_HOSTS = new Set(["escolaieda.com", "www.escolaieda.com"]);
  const hostname = String(window.location.hostname || "").toLowerCase();
  const isProduction = PRODUCTION_HOSTS.has(hostname);

  window.__IEDA_GITHUB_TARGET__ = Object.freeze({
    branch: isProduction ? "main" : DEVELOPMENT_BRANCH,
    production: isProduction
  });

  if (isProduction) return;

  const originalFetch = window.fetch.bind(window);
  const encodedDevelopmentBranch = encodeURIComponent(DEVELOPMENT_BRANCH);

  function rewriteUrl(url) {
    if (!String(url).startsWith(API_PREFIX)) return url;
    return String(url)
      .replace(/([?&]ref=)main(?=(&|$))/g, `$1${encodedDevelopmentBranch}`)
      .replace(/\/git\/ref\/heads\/main(?=([/?#]|$))/g, `/git/ref/heads/${encodedDevelopmentBranch}`)
      .replace(/\/git\/refs\/heads\/main(?=([/?#]|$))/g, `/git/refs/heads/${encodedDevelopmentBranch}`);
  }

  function rewriteBody(body) {
    if (typeof body !== "string" || !body.trim()) return body;
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === "object" && parsed.branch === "main") {
        parsed.branch = DEVELOPMENT_BRANCH;
        return JSON.stringify(parsed);
      }
    } catch {
      // Corpos não JSON seguem inalterados.
    }
    return body;
  }

  window.fetch = function safeGithubFetch(input, init) {
    const url = typeof input === "string" || input instanceof URL ? String(input) : input?.url;
    if (!url || !url.startsWith(API_PREFIX)) return originalFetch(input, init);

    const rewrittenUrl = rewriteUrl(url);
    const rewrittenInit = init ? { ...init, body: rewriteBody(init.body) } : init;

    if (typeof input === "string" || input instanceof URL) {
      return originalFetch(rewrittenUrl, rewrittenInit);
    }

    const request = new Request(rewrittenUrl, input);
    return originalFetch(request, rewrittenInit);
  };
})();
