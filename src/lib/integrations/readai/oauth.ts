import { prisma } from "@/lib/db";

const TOKEN_ENDPOINT = "https://authn.read.ai/oauth2/token";
const TOKEN_ROW_ID = "current";
// Renova um pouco antes de expirar de verdade (access token dura ~10min) para
// não correr risco de a chamada seguinte já receber o token vencido.
const EXPIRY_BUFFER_MS = 30_000;

function getConfig() {
  const clientId = process.env.READAI_CLIENT_ID;
  const clientSecret = process.env.READAI_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("READAI_CLIENT_ID ou READAI_CLIENT_SECRET não configurados.");
  }
  return { clientId, clientSecret };
}

function basicAuthHeader(clientId: string, clientSecret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // segundos
}

async function requestToken(body: URLSearchParams): Promise<TokenResponse> {
  const { clientId, clientSecret } = getConfig();

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(clientId, clientSecret),
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Read.ai OAuth ${response.status}: ${text.slice(0, 300)}`);
  }

  return (await response.json()) as TokenResponse;
}

async function persistToken(token: TokenResponse): Promise<void> {
  await prisma.readAiOAuthToken.upsert({
    where: { id: TOKEN_ROW_ID },
    create: {
      id: TOKEN_ROW_ID,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: new Date(Date.now() + token.expires_in * 1000),
    },
    update: {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: new Date(Date.now() + token.expires_in * 1000),
    },
  });
}

/**
 * Passo único de configuração inicial: troca o authorization code (obtido no
 * navegador em https://api.read.ai/oauth/ui) pelo primeiro par access/refresh
 * token, e já salva no banco. Depois disso a renovação é 100% automática.
 */
export async function exchangeAuthorizationCode(code: string, codeVerifier: string, redirectUri: string): Promise<void> {
  const token = await requestToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  );
  await persistToken(token);
}

/**
 * Retorna um access token válido, renovando via refresh token quando
 * necessário. O refresh token do Read.ai é de uso único e roda a cada
 * renovação — por isso persistimos o novo par IMEDIATAMENTE após recebê-lo,
 * antes de qualquer outra coisa, para minimizar a janela em que uma falha
 * deixaria a cadeia de tokens quebrada.
 */
export async function getValidAccessToken(): Promise<string> {
  const stored = await prisma.readAiOAuthToken.findUnique({ where: { id: TOKEN_ROW_ID } });
  if (!stored) {
    throw new Error(
      "Integração com Read.ai ainda não autorizada — nenhum token salvo. É necessário concluir o fluxo OAuth uma vez pelo navegador.",
    );
  }

  if (stored.expiresAt.getTime() - EXPIRY_BUFFER_MS > Date.now()) {
    return stored.accessToken;
  }

  const refreshed = await requestToken(
    new URLSearchParams({ grant_type: "refresh_token", refresh_token: stored.refreshToken }),
  );
  await persistToken(refreshed);
  return refreshed.access_token;
}
