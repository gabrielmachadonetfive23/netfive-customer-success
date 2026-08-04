# Netfive Customer Success

Plataforma interna para centralizar a gestão da carteira de clientes de Customer Success da Netfive: responsáveis, contratos, relacionamento, visitas, Health Score, planos de ação, oportunidades de expansão, segmentos e faturamento público — com sincronização de duas vias com Smartsheet e Pipedrive.

## Sumário

- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Banco de dados](#banco-de-dados)
- [Autenticação](#autenticação)
- [Integrações (Smartsheet / Pipedrive)](#integrações-smartsheet--pipedrive)
- [Reuniões (Read.ai)](#reuniões-readai)
- [Desenvolvimento](#desenvolvimento)
- [Importação de dados](#importação-de-dados)
- [Build e produção](#build-e-produção)
- [Deploy](#deploy)
- [Checklist de segurança](#checklist-de-segurança)
- [Checklist manual de homologação](#checklist-manual-de-homologação)
- [Arquitetura](#arquitetura)

## Requisitos

- Node.js 20+
- npm 10+
- SQLite (embutido, sem instalação — usado por padrão em desenvolvimento)
- Opcional: Docker + Docker Compose, caso prefira rodar PostgreSQL localmente
- Conta Smartsheet e/ou Pipedrive — opcional, só necessário se for usar a sincronização

## Instalação

```bash
npm install
cp .env.example .env
```

Edite `.env` e gere um `AUTH_SECRET` forte:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Configuração

Variáveis de ambiente (ver `.env.example`):

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | Sim | `file:./dev.db` (SQLite) por padrão; ou string de conexão PostgreSQL |
| `AUTH_SECRET` | Sim | Segredo (≥16 caracteres) usado para derivar o hash do token de sessão |
| `SMARTSHEET_API_TOKEN` / `SMARTSHEET_SHEET_ID` / `SMARTSHEET_WEBHOOK_SECRET` | Não | Necessárias apenas para ativar a sincronização com Smartsheet |
| `PIPEDRIVE_API_TOKEN` / `PIPEDRIVE_DOMAIN` / `PIPEDRIVE_WEBHOOK_SECRET` | Não | Necessárias apenas para ativar a sincronização com Pipedrive |
| `PUBLIC_APP_URL` | Não | URL pública usada ao registrar webhooks |

## Banco de dados

Por padrão a aplicação usa **SQLite** em desenvolvimento (`prisma/dev.db`), sem exigir Docker. Para produção, recomenda-se **PostgreSQL**:

1. Em `prisma/schema.prisma`, troque `provider = "sqlite"` por `provider = "postgresql"` no bloco `datasource db`.
2. Atualize `DATABASE_URL` para a string de conexão Postgres.
3. Rode `npx prisma migrate deploy`.

Comandos úteis:

```bash
npm run db:migrate   # cria/aplica migrations em desenvolvimento
npm run db:deploy    # aplica migrations em produção (não gera novas)
npm run db:seed      # popula o catálogo oficial de 32 serviços
npm run db:studio    # abre o Prisma Studio para inspecionar os dados
```

As migrations nunca recriam a base do zero e nunca sobrescrevem dados de clientes já cadastrados — cada alteração de schema é incremental.

Caso prefira rodar PostgreSQL localmente em vez do SQLite, um `docker-compose.yml` está incluído:

```bash
docker compose up -d
```

## Autenticação

Login por **e-mail + senha**, com conta provisionada previamente (não há autocadastro):

- Quem tem acesso é quem tem um registro na tabela `User` — não existe mais lista de e-mails por variável de ambiente.
- Senhas são armazenadas como hash+salt via **scrypt** (nunca em texto plano); a verificação roda em tempo constante, inclusive quando o e-mail não existe (evita vazar por timing se uma conta existe ou não).
- **Bloqueio por força bruta**: 5 tentativas incorretas seguidas bloqueiam a conta por 15 minutos.
- **Senha provisória + troca obrigatória**: contas novas (`npm run user:create -- email@netfive.com.br`) nascem com `mustChangePassword=true` e uma senha aleatória impressa no terminal; no primeiro login a pessoa é redirecionada para `/trocar-senha` antes de acessar qualquer outra página.
- Apenas o **hash** (HMAC-SHA256 com `AUTH_SECRET`) do token de sessão é armazenado — nunca o valor em claro.
- Sessão válida por 48 horas, revogável via logout (remove o registro no banco).
- Cookie de sessão: `HttpOnly`, `Secure`, `SameSite=Strict`.
- Toda página protegida e toda rota de API validam a sessão no servidor; APIs retornam `401` quando a sessão é inválida/expirada.

Para dar acesso a alguém novo (ou resetar a senha de alguém):

```bash
npm run user:create -- nome.sobrenome@netfive.com.br
```

## Integrações (Smartsheet / Pipedrive)

A plataforma sincroniza clientes em **duas vias** com Smartsheet e Pipedrive: alterações feitas na plataforma são enviadas para os dois sistemas, e alterações feitas neles chegam de volta via webhook.

### Como funciona

- **Mapeamento de campos**: definido em [`src/lib/integrations/field-mapping.ts`](src/lib/integrations/field-mapping.ts). A sincronização localiza colunas do Smartsheet pelo **título** e campos customizados do Pipedrive pelo **nome** — ajuste os nomes nesse arquivo para baterem exatamente com as colunas/campos das suas contas.
- **Resolução de conflito**: última alteração vence, comparando o `updatedAt` do cliente local com o timestamp de modificação relatado pelo sistema externo. Se o dado local for mais recente, a alteração externa é descartada e o dado local é reenviado para corrigir o sistema externo.
- **Prevenção de loop**: ao aplicar uma alteração vinda de um provedor, o dado só é propagado para o **outro** provedor (nunca de volta ao mesmo que originou a mudança).
- **Exclusão**: excluir um cliente na plataforma remove apenas o vínculo interno (`ExternalLink`) — os registros no Smartsheet/Pipedrive **não são apagados automaticamente**, para evitar exclusão destrutiva em sistemas compartilhados sem confirmação explícita.
- **Resiliência**: falhas de sincronização (rede, token inválido, coluna inexistente) são registradas em `SyncLog` e nunca bloqueiam o cadastro/edição do cliente na plataforma.

### Configuração inicial

**Smartsheet**

1. Gere um token de API pessoal e o ID do sheet de destino.
2. Preencha `SMARTSHEET_API_TOKEN` e `SMARTSHEET_SHEET_ID` no `.env`.
3. Registre o webhook (uma vez, com o servidor publicamente acessível):
   ```ts
   import { registerWebhook } from "@/lib/integrations/smartsheet/client";
   await registerWebhook(`${process.env.PUBLIC_APP_URL}/api/webhooks/smartsheet`);
   ```
   Guarde o `sharedSecret` retornado em `SMARTSHEET_WEBHOOK_SECRET`.

**Pipedrive**

1. Gere um token de API e identifique o domínio da conta (`PIPEDRIVE_DOMAIN`, o `suaempresa` de `suaempresa.pipedrive.com`).
2. Defina um segredo próprio em `PIPEDRIVE_WEBHOOK_SECRET`.
3. Cadastre um webhook em **Configurações > Ferramentas > Webhooks** apontando para `{PUBLIC_APP_URL}/api/webhooks/pipedrive`, com Basic Auth usuário `netfive` e senha igual a `PIPEDRIVE_WEBHOOK_SECRET`.

Sem essas variáveis configuradas, a plataforma funciona normalmente — a sincronização fica apenas desativada (visível no card "Integrações" da Visão Geral).

### Fallback manual

Cada ficha de cliente tem um botão **"Sincronizar agora"** que reenvia manualmente aquele cliente para os dois sistemas, útil caso a sincronização automática tenha falhado.

## Reuniões (Read.ai)

Sincronização **somente leitura** de reuniões (resumo, itens de ação, tópicos, participantes, métricas) — a API do Read.ai está em beta aberta e usa **OAuth 2.1** em vez de um token estático simples. O access token expira em 10 minutos e o refresh token é **de uso único** (roda a cada renovação), então o estado do token fica salvo na tabela `ReadAiOAuthToken` (uma única linha), não em variável de ambiente.

### Configuração inicial (uma vez só)

1. **Registrar o client OAuth** (não exige login, é só uma chamada de API):
   ```bash
   curl -X POST https://api.read.ai/oauth/register \
     -H "Content-Type: application/json" \
     -d '{
       "client_name": "Netfive Customer Success Platform",
       "redirect_uris": ["https://api.read.ai/oauth/ui"],
       "grant_types": ["authorization_code", "refresh_token"],
       "response_types": ["code"],
       "scope": "openid email offline_access profile meeting:read mcp:execute",
       "token_endpoint_auth_method": "client_secret_basic"
     }'
   ```
   Salve `client_id` e `client_secret` da resposta em `READAI_CLIENT_ID`/`READAI_CLIENT_SECRET` no `.env` — o `client_secret` não pode ser recuperado depois.
2. **Autorizar pelo navegador** (esta parte exige login na conta Read.ai de quem estiver configurando — não pode ser feita por script):
   - Acesse [api.read.ai/oauth/ui](https://api.read.ai/oauth/ui), informe o `client_id`/`client_secret` do passo anterior e clique em **Start OAuth Flow**.
   - Faça login na conta Read.ai (a conta precisa ter a opção **Downloads** habilitada em Workspace Settings > Reports & Sharing).
   - Clique em **Allow Access** na tela de consentimento.
   - Na tela final, clique em **Copy Command** — ele contém o `code` e o `code_verifier` (PKCE) necessários para o próximo passo.
3. **Trocar o código por tokens**, extraindo `code`, `code_verifier` e `redirect_uri` do comando copiado:
   ```bash
   npm run readai:authorize -- "<code>" "<code_verifier>" "<redirect_uri>"
   ```
   Isso salva o primeiro par access/refresh token no banco. Dali em diante, a renovação é automática a cada sincronização.

Sem `READAI_CLIENT_ID`/`READAI_CLIENT_SECRET` configurados, o cron pula a sincronização silenciosamente (visível no retorno de `/api/cron/readai`).

### Se a cadeia de tokens quebrar

O próprio Read.ai avisa que isso pode acontecer (refresh token de uso único). Se a sincronização passar a falhar com erro de autenticação, refaça só o **passo 2 e 3** acima (não precisa registrar um novo client).

## Desenvolvimento

```bash
npm run dev          # servidor de desenvolvimento (http://localhost:3000)
npm run lint          # ESLint
npm run typecheck     # TypeScript em modo strict
```

Não há suite de testes automatizados neste projeto (removida a pedido do time). A validação de qualidade é feita via `lint` + `typecheck` + build + o checklist manual de homologação abaixo.

## Importação de dados

Script em `scripts/import-customers.ts`, aceita JSON, CSV ou XLSX:

```bash
npm run import:customers -- ./caminho/para/arquivo.xlsx
```

- As colunas de entrada devem usar os mesmos nomes definidos em `field-mapping.ts` (ex.: "Empresa", "CS Responsável", "Categoria", "Serviços Contratados"...).
- Uma coluna `ID Legado` (ou `legacyId`) permite reimportações idempotentes, mapeando IDs de sistemas antigos para os UUIDs internos (mapa salvo em `scripts/import-legacy-id-map.json`).
- Sem ID legado, o script casa pelo nome exato da empresa para evitar duplicação.
- Nomes de serviços são normalizados (ex.: "Monitoramento de Credencias Vazadas" → "Monitoramento de Credenciais Vazadas") e serviços legados fora do catálogo oficial são preservados como serviços inativos.
- Nunca apaga a base existente; gera um relatório (`scripts/import-report-<timestamp>.json`) com importados, atualizados e erros.

## Build e produção

```bash
npm run build
npm run start
```

## Deploy

Guia para publicar a plataforma em produção (Vercel + Supabase) e compartilhar o link com a equipe.

### 1. Banco de dados (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com) (ou use um já existente).
2. No painel do projeto, clique em **Connect** (topo da página) e copie duas strings de conexão:
   - **Transaction pooler** (porta `6543`) → vai em `DATABASE_URL`. **Adicione `?pgbouncer=true` no final** — sem isso, o Prisma quebra com o erro `prepared statement "sX" does not exist`, porque o modo transaction do pgbouncer não suporta prepared statements por padrão.
   - **Session pooler** ou **Direct connection** (porta `5432`) → vai em `DIRECT_URL` (usada apenas para rodar migrations, sem a flag `pgbouncer`).
3. Em `prisma/schema.prisma`, troque o bloco `datasource db` para:
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```
4. Apague `prisma/migrations/` (as migrations atuais são específicas do SQLite) e gere uma migration inicial nova, local, apontando para o Supabase:
   ```bash
   npx prisma migrate dev --name init
   npm run db:seed
   ```

### 2. Repositório (GitHub)

```bash
git remote add origin https://github.com/<sua-conta>/netfive-customer-success.git
git branch -M main
git push -u origin main
```

(Se ainda não tem o repositório criado, crie um novo — vazio, sem README — em [github.com/new](https://github.com/new) antes do passo acima.)

### 3. Deploy (Vercel)

1. Em [vercel.com/new](https://vercel.com/new), importe o repositório do GitHub.
2. Em **Environment Variables**, adicione todas as variáveis obrigatórias (ver [Configuração](#configuração)): `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, e as de Smartsheet/Pipedrive se for usar.
3. Clique em **Deploy**. A Vercel builda e publica automaticamente (URL do tipo `netfive-cs.vercel.app`, ou configure um domínio próprio depois em **Settings → Domains**).
4. A partir daí, todo `git push` para `main` gera um novo deploy automático.

**Alternativa sem GitHub**: rode `npx vercel` na raiz do projeto, faça login quando solicitado, e siga as perguntas do terminal (mesmas variáveis de ambiente precisam ser configuradas com `npx vercel env add`). Nesse caminho, atualizações futuras exigem rodar `npx vercel --prod` manualmente a cada mudança.

### 4. Depois do primeiro deploy

- Crie a conta de cada pessoa com `npm run user:create -- email@netfive.com.br` (roda contra o banco configurado em `DATABASE_URL`) e repasse a senha provisória impressa no terminal.
- Se for usar Smartsheet/Pipedrive, registre os webhooks apontando para a URL final (`https://netfive-cs.vercel.app/api/webhooks/...`).
- HTTPS já vem por padrão na Vercel — o cookie de sessão `Secure` funciona sem configuração extra.

## Checklist de segurança

- [x] Login por e-mail + senha; contas provisionadas via `npm run user:create` (sem autocadastro público).
- [x] Senha armazenada como hash+salt (scrypt), verificação em tempo constante mesmo para e-mail inexistente.
- [x] Bloqueio de conta após 5 tentativas incorretas (15 minutos).
- [x] Senha provisória expira no primeiro uso — troca obrigatória via `/trocar-senha` antes de acessar qualquer página.
- [x] Apenas o hash (HMAC-SHA256) do token de sessão é persistido — nunca o valor em claro.
- [x] Cookie de sessão `HttpOnly`, `Secure`, `SameSite=Strict`; sessão expira em 48h.
- [x] Toda rota de API valida a sessão no servidor (`requireSessionEmail`) e retorna `401` quando inválida/expirada.
- [x] Validação de payload com Zod em todas as rotas de escrita (client e servidor — nunca confia apenas na validação do navegador).
- [x] Defesa em profundidade contra CSRF (checagem de origem em rotas de escrita, além do `SameSite=Strict`).
- [x] Webhooks externos autenticados: assinatura HMAC (Smartsheet) e Basic Auth (Pipedrive).
- [x] Exclusão de cliente executada em transação, removendo também vínculos de serviços e observações.
- [x] Logs de auditoria (`AuditLog`) para criação, edição e exclusão de clientes, e criação de observações.
- [x] Nenhuma chave/segredo hardcoded no código — tudo via variáveis de ambiente (`.env`, nunca commitado).
- [x] `.env` e artefatos gerados (banco SQLite, relatórios de importação) estão no `.gitignore`.
- [x] Erros internos nunca expõem detalhes sensíveis nas respostas de API (mensagens padronizadas + log no servidor).
- [ ] **Ação manual antes de produção**: gerar um `AUTH_SECRET` novo e forte (não usar o de desenvolvimento).
- [ ] **Ação manual antes de produção**: confirmar HTTPS ativo (cookies `Secure` exigem contexto seguro fora de `localhost`).

## Checklist manual de homologação

### Autenticação
- [ ] Login com e-mail sem conta (ou senha errada) é rejeitado com mensagem genérica ("E-mail ou senha inválidos"), sem indicar qual dos dois está errado.
- [ ] 5 tentativas erradas seguidas bloqueiam a conta por 15 minutos.
- [ ] Login com senha provisória (`mustChangePassword=true`) redireciona para `/trocar-senha` antes de qualquer outra página.
- [ ] `/trocar-senha` exige a senha atual correta, nova senha ≥8 caracteres e confirmação igual; após salvar, libera acesso normal.
- [ ] Login redireciona para `/dashboard` (ou `redirectTo`) e a sessão persiste ao navegar entre páginas.
- [ ] Logout invalida a sessão e acessar uma rota protegida depois redireciona para `/login`.
- [ ] Após 48h, a sessão expira e a próxima ação exige novo login.

### Visão geral
- [ ] Busca por empresa/serviço filtra a tabela corretamente.
- [ ] Filtros de CS, categoria e status atualizam a tabela.
- [ ] Alternar "KPIs acompanham os filtros" recalcula os KPIs.
- [ ] Ordenação por coluna e paginação funcionam.
- [ ] Estados de carregamento, vazio e erro (com nova tentativa) aparecem corretamente.

### Visitas
- [ ] Somente visitas a partir de hoje aparecem, ordenadas da mais próxima.
- [ ] Filtro por CS recalcula KPIs e agenda.
- [ ] Card do dia atual mostra "Hoje".
- [ ] Clicar em um card abre a ficha do cliente correspondente.

### Clientes
- [ ] KPIs (total, com segmento, receita pública, verificados, média) recalculam com os filtros.
- [ ] Gráfico de segmentos soma 100% incluindo "Não informado".
- [ ] Gráfico financeiro considera apenas o ano fiscal correto (ano corrente − 1) e mostra "—" para quem não tem valor no período.
- [ ] Abrir a ficha funciona por clique e por Enter (teclado).

### Estatísticas
- [ ] Filtro por CS recalcula todos os KPIs e painéis.
- [ ] Painel de sem-contato mostra todos, ordenado por mais dias sem contato, com scroll interno após 10 linhas.
- [ ] Painel de sem-visita mostra "nunca" para quem nunca foi visitado.
- [ ] Contatos planejados em atraso aparecem corretamente ordenados.
- [ ] Listas com mais de 10 linhas (sem contato, sem visita, renovações, atrasados) rolam dentro do próprio quadro, com cabeçalho fixo, sem crescer o layout da página.

### Notícias
- [ ] Filtro por segmento (múltipla seleção) e por categoria (Financeiro & Tecnologia / Segurança) funcionam isolados e combinados.
- [ ] Busca por texto filtra por título/resumo.
- [ ] Clicar em uma notícia expande o resumo e o link "Ler notícia completa" (nova aba).
- [ ] Coleta diária (`/api/cron/news`, GitHub Actions às 8h) só grava notícias novas (idempotente por URL).

### NPS
- [ ] Adicionar empresa sem nota mostra "—" e não conta como promotor/neutro/detrator.
- [ ] Nota 0-6 = Detrator, 7-8 = Neutro, 9-10 = Promotor; o escudo e os contadores refletem isso.
- [ ] Editar uma resposta atualiza a categoria e o NPS geral corretamente.
- [ ] Excluir remove a linha e recalcula o NPS geral.
- [ ] Escudo anima de 0 até a nota ao carregar a página (ou instantâneo com `prefers-reduced-motion`).

### QBR/SBR
- [ ] Grupos por cliente expandem/colapsam e mostram a contagem de atrasadas.
- [ ] Filtros de Cliente, Equipe, Status e "Somente atrasadas" funcionam isolados e combinados.
- [ ] Link "Notion" de cada atividade abre a página correta em nova aba.
- [ ] Sincronização periódica (`/api/cron/qbr`) reflete atividades encerradas no Notion como removidas da lista.

### Reuniões
- [ ] Busca por título/resumo/participante e filtro por plataforma funcionam isolados e combinados.
- [ ] Clicar em uma reunião expande resumo, itens de ação, tópicos, participantes e métricas.
- [ ] Link "Ver no Read.ai" abre o relatório correto em nova aba.
- [ ] Sincronização periódica (`/api/cron/readai`) renova o access token automaticamente sem exigir novo login.

### Ficha do cliente
- [ ] Todas as seções exibem os dados corretos; campos vazios mostram "—".
- [ ] Barra de Health Score reflete o valor e a cor do status.
- [ ] Links de evidências abrem em nova aba com `rel="noopener noreferrer"`.
- [ ] Adicionar observação aparece imediatamente no topo da timeline, com autor e data/hora.
- [ ] Editar preserva os serviços já marcados e atualiza `updatedAt`.
- [ ] Excluir exige digitar o nome exato da empresa, mostra erro se falhar, e atualiza os indicadores após sucesso.
- [ ] Botão "Sincronizar agora" dispara a sincronização manual sem erros (mesmo com integrações desativadas).

### Geral
- [ ] Interface 100% em português, datas em `DD/MM/AAAA`, valores em `R$` (pt-BR).
- [ ] Layout responsivo em desktop, tablet e celular.
- [ ] Navegação por teclado (Tab/Enter) funciona nos elementos interativos principais.
- [ ] Nenhum erro no console do navegador durante o uso normal.

## Arquitetura

```
src/
  app/                     Rotas (App Router) — páginas e API routes
    (protected)/           Layout protegido + páginas: dashboard, visitas, clientes, estatisticas
    api/                   Rotas de API (auth, customers, services, integrations, webhooks)
    login/                 Página de login
  components/              Componentes de UI, organizados por domínio
  lib/
    auth/                  Autenticação: senha (hash scrypt), sessão, criptografia
    api/                   Erros padronizados de API, checagem de origem
    repositories/          Acesso a dados via Prisma (única camada que fala com o banco)
    services/              Regras de negócio e cálculos (KPIs, ano fiscal, análises)
    integrations/           Clientes Smartsheet/Pipedrive, mapeamento de campos, orquestração de sync
    validations/           Schemas Zod (entrada de API e formulários)
    hooks/                 Hooks React reutilizáveis (dados, debounce, drawer de cliente)
    contexts/              Contextos React (refresh de dados entre componentes client-side)
prisma/
  schema.prisma            Modelos e índices
  migrations/              Histórico de migrations
  seed.ts                  Seed do catálogo de serviços
scripts/
  import-customers.ts      Importação de clientes existentes (JSON/CSV/XLSX)
```

Camadas claramente separadas: **rotas de API** validam sessão e payload, delegam para **services** (regra de negócio + auditoria), que usam **repositories** (única camada com acesso ao Prisma). A UI nunca acessa o banco diretamente — sempre via `fetch` para as rotas de API.
