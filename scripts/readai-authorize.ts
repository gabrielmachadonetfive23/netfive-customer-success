/**
 * Passo único (ou refeito se a cadeia de tokens quebrar) para autorizar a
 * integração com o Read.ai. Depois de completar o fluxo OAuth pelo navegador
 * em https://api.read.ai/oauth/ui e copiar o "Copy Command" da tela final,
 * extraia os valores de `code`, `code_verifier` e `redirect_uri` desse comando
 * e rode:
 *
 *   npm run readai:authorize -- "<code>" "<code_verifier>" "<redirect_uri>"
 */
import { exchangeAuthorizationCode } from "../src/lib/integrations/readai/oauth";

async function main() {
  const [code, codeVerifier, redirectUri] = process.argv.slice(2);
  if (!code || !codeVerifier || !redirectUri) {
    console.error("Uso: npm run readai:authorize -- <code> <code_verifier> <redirect_uri>");
    process.exitCode = 1;
    return;
  }

  await exchangeAuthorizationCode(code, codeVerifier, redirectUri);
  console.log("Token do Read.ai salvo com sucesso — a sincronização automática já pode rodar.");
}

main().catch((error) => {
  console.error("ERRO:", error);
  process.exitCode = 1;
});
