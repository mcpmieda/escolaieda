import { PublicClientApplication } from "/arquivo-digital/vendor/msal-browser-5.11.0.min.js";
import { INTEGRATION_CONFIG } from "./config.js";

class InstitutionalAuth {
  constructor() {
    this.account = null;
    this.msal = new PublicClientApplication({
      auth: {
        clientId: INTEGRATION_CONFIG.clientId,
        authority: `https://login.microsoftonline.com/${INTEGRATION_CONFIG.tenantId}`,
        redirectUri: INTEGRATION_CONFIG.redirectUri
      },
      cache: { cacheLocation: "sessionStorage", storeAuthStateInCookie: false }
    });
  }

  async initialize() {
    await this.msal.initialize();
    const response = await this.msal.handleRedirectPromise();
    if (response?.account) this.msal.setActiveAccount(response.account);
    this.account = this.msal.getActiveAccount() || this.msal.getAllAccounts()[0] || null;
    if (this.account) this.msal.setActiveAccount(this.account);
    return this.account;
  }

  async login({ popup = false } = {}) {
    const request = { scopes: [...INTEGRATION_CONFIG.scopes], prompt: "select_account" };
    if (popup) {
      const response = await this.msal.loginPopup(request);
      this.account = response.account;
      this.msal.setActiveAccount(this.account);
      return this.account;
    }
    sessionStorage.setItem("escolaIedaDestinoLogin", window.location.pathname);
    await this.msal.loginRedirect(request);
    return null;
  }

  async token({ popup = false } = {}) {
    if (!this.account) throw new Error("Conta Microsoft não autenticada.");
    const request = { scopes: [...INTEGRATION_CONFIG.scopes], account: this.account };
    try {
      return (await this.msal.acquireTokenSilent(request)).accessToken;
    } catch (error) {
      if (popup) return (await this.msal.acquireTokenPopup(request)).accessToken;
      await this.msal.acquireTokenRedirect(request);
      throw new Error("Redirecionando para concluir a autorização Microsoft.", { cause: error });
    }
  }

  async logout() {
    sessionStorage.removeItem("escolaIedaDestinoLogin");
    await this.msal.logoutRedirect({ postLogoutRedirectUri: `${window.location.origin}/` });
  }
}

export { InstitutionalAuth };
