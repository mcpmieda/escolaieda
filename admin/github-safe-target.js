(() => {
  const API_PREFIX = "https://api.github.com/repos/mcpmieda/escolaieda";
  const PRODUCTION_HOSTS = new Set(["escolaieda.com", "www.escolaieda.com"]);
  const hostname = String(window.location.hostname || "").toLowerCase();
  const isProduction = PRODUCTION_HOSTS.has(hostname);

  window.__IEDA_GITHUB_TARGET__ = Object.freeze({
    branch: isProduction ? "main" : null,
    production: isProduction,
    writesAllowed: isProduction
  });

  if (isProduction) return;

  const originalFetch = window.fetch.bind(window);
  const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

  window.fetch = function safeGithubFetch(input, init = {}) {
    const url = typeof input === "string" || input instanceof URL ? String(input) : input?.url;
    if (!url || !url.startsWith(API_PREFIX)) return originalFetch(input, init);

    const method = String(init?.method || input?.method || "GET").toUpperCase();
    if (MUTATING_METHODS.has(method)) {
      return Promise.reject(new Error("Escrita no GitHub bloqueada fora do domínio oficial da Escola Iêda."));
    }

    return originalFetch(input, init);
  };
})();
