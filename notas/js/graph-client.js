import { PublicClientApplication } from "https://esm.sh/@azure/msal-browser@5.11.0";
import { CONFIG, loginRequest, tokenRequest } from "./config.js";

class NotasGraphClient {
  constructor() {
    this.msal = new PublicClientApplication({
      auth: {
        clientId: CONFIG.clientId,
        authority: `https://login.microsoftonline.com/${CONFIG.tenantId}`,
        redirectUri: CONFIG.redirectUri
      },
      cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false
      }
    });
    this.account = null;
    this.token = "";
  }

  async initialize() {
    await this.msal.initialize();
    const response = await this.msal.handleRedirectPromise();
    if (response?.account) this.msal.setActiveAccount(response.account);
    this.account = this.msal.getActiveAccount() || this.msal.getAllAccounts()[0] || null;
    if (this.account) this.msal.setActiveAccount(this.account);
    return this.account;
  }

  async login() {
    sessionStorage.setItem("escolaIedaDestinoLogin", CONFIG.postLoginPath);
    await this.msal.loginRedirect(loginRequest);
  }

  async logout() {
    sessionStorage.removeItem("escolaIedaDestinoLogin");
    await this.msal.logoutRedirect({ postLogoutRedirectUri: `${window.location.origin}/` });
  }

  async ensureToken() {
    if (!this.account) throw new Error("Conta Microsoft nao autenticada.");
    try {
      const result = await this.msal.acquireTokenSilent({ ...tokenRequest, account: this.account });
      this.token = result.accessToken;
      return this.token;
    } catch {
      await this.msal.acquireTokenRedirect(tokenRequest);
      throw new Error("Redirecionando para concluir autorizacao Microsoft.");
    }
  }

  async graph(url, options = {}) {
    const token = this.token || await this.ensureToken();
    return fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
  }

  async getSiteLists() {
    const response = await this.graph(`https://graph.microsoft.com/v1.0/sites/${CONFIG.siteId}/lists?$select=id,displayName,webUrl,list`);
    if (!response.ok) {
      throw new Error(`Falha ao listar estruturas do SharePoint: ${response.status}`);
    }
    const data = await response.json();
    return data.value || [];
  }

  async checkNotasStructure() {
    const lists = await this.getSiteLists();
    const existing = new Set(lists.map((list) => list.displayName));
    const missing = CONFIG.requiredLists.filter((name) => !existing.has(name));
    return {
      ok: missing.length === 0,
      missing,
      lists
    };
  }
}

export { NotasGraphClient };
