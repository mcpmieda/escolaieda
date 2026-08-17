# Dependência local de autenticação

`msal-browser-5.11.0.min.js` contém somente o ponto de entrada `PublicClientApplication` e suas dependências, empacotados a partir de `@azure/msal-browser@5.11.0` com esbuild.

- Pacote original: https://www.npmjs.com/package/@azure/msal-browser/v/5.11.0
- Licença: MIT
- Finalidade: reduzir a cascata de módulos externos durante a abertura do Arquivo Digital.
- Código da aplicação: continua importando `PublicClientApplication` como módulo ES.

Comando de reprodução:

```powershell
npx esbuild node_modules/@azure/msal-browser/dist/app/PublicClientApplication.mjs --bundle --format=esm --platform=browser --target=es2022 --minify --legal-comments=inline --outfile=msal-browser-5.11.0.min.js
```
