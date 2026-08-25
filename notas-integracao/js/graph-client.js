import { INTEGRATION_CONFIG } from "./config.js";

class GraphError extends Error {
  constructor(message, { status = 0, retryAfterMs = 0, body = null } = {}) {
    super(message);
    this.name = "GraphError";
    this.status = status;
    this.retryAfterMs = retryAfterMs;
    this.body = body;
  }
}

const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

class GraphClient {
  constructor(auth) {
    this.auth = auth;
  }

  async request(url, options = {}, { popup = false, attempts = INTEGRATION_CONFIG.retry.attempts } = {}) {
    let lastError;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 30000);
      try {
        const token = await this.auth.token({ popup });
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {})
          }
        });
        if (response.ok) {
          if (response.status === 204) return null;
          return response.json();
        }
        let body = null;
        try { body = await response.json(); } catch { body = null; }
        const retryAfterHeader = Number(response.headers.get("Retry-After") || 0);
        const retryAfterMs = retryAfterHeader > 0 ? retryAfterHeader * 1000 : 0;
        const error = new GraphError(`Microsoft Graph retornou ${response.status}.`, {
          status: response.status,
          retryAfterMs,
          body
        });
        if (![429, 500, 502, 503, 504].includes(response.status) || attempt === attempts - 1) throw error;
        lastError = error;
      } catch (error) {
        if (error instanceof GraphError && ![429, 500, 502, 503, 504].includes(error.status)) throw error;
        lastError = error;
        if (attempt === attempts - 1) throw error;
      } finally {
        window.clearTimeout(timeout);
      }
      const fallback = Math.min(INTEGRATION_CONFIG.retry.baseDelayMs * (2 ** attempt), INTEGRATION_CONFIG.retry.maxDelayMs);
      await wait(lastError?.retryAfterMs || fallback);
    }
    throw lastError || new Error("Falha não classificada ao chamar o Microsoft Graph.");
  }
}

export { GraphClient, GraphError, wait };
