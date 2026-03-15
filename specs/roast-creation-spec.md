# Roast Creation

## Objective

- Definir o fluxo de criacao de roast do devroast como uma jornada de submissao, processamento assincrono e exibicao publica de resultado.
- Permitir que o usuario envie um snippet pela homepage e acompanhe o resultado em uma URL publica propria.
- Garantir que a analise de IA rode de forma assincrona e persistida, sem bloquear a submissao.
- Deixar explicito que `share roast` fica fora do escopo deste recorte.

## Fontes consideradas

- `AGENTS.md`
- `specs/AGENTS.md`
- `README.md`
- `docs/superpowers/specs/2026-03-15-roast-creation-design.md`
- `src/app/page.tsx`
- `src/app/roasts/[slug]/page.tsx`
- `src/components/home/home-hero.tsx`
- `src/components/roast-result/*`
- `src/server/roasts/*`
- `src/trpc/routers/roasts.ts`
- Next.js App Router fetching/loading docs: `https://nextjs.org/docs/app/getting-started/fetching-data`
- Next.js `loading.js` and Suspense docs: `https://nextjs.org/docs/app/api-reference/file-conventions/loading`
- tRPC TanStack React Query + Server Components docs: `https://trpc.io/docs/client/tanstack-react-query/server-components`
- Google Gen AI JS SDK docs: `https://github.com/googleapis/js-genai/blob/main/docs/index.html`

## Current project context

- O app tem homepage de submissao, rota publica de resultado e persistencia do ciclo de vida do roast no banco.
- A experiencia do produto depende de redirecionamento imediato para a pagina publica do roast, sem esperar a resposta completa do provedor.
- O processamento da analise depende de persistencia, para que o usuario possa acompanhar o status depois da navegacao.
- O resultado final precisa tratar estados incompletos e falhas de forma explicita.

## Requirements

### Product

- Objetivo principal: transformar o envio de codigo em um roast analisado por IA com experiencia publica de acompanhamento.
- Ao enviar o snippet, o usuario deve ser redirecionado imediatamente para `/roasts/[slug]`.
- A analise de IA deve continuar depois da navegacao e persistir status e resultado no banco.
- A pagina de resultado deve cobrir tres estados visiveis:
  - `processing`
  - `completed`
  - `failed`
- `processing` cobre tanto trabalho em fila quanto em execucao.
- `completed` exibe score, verdict, summary, findings, codigo original e improved code persistidos.
- `failed` exibe um estado amigavel com caminho para tentar outro snippet.

### Scope and constraints

- O recorte continua paste-first; upload de arquivo nao entra agora.
- O fluxo deve usar slug publico na URL, nao UUID interno.
- O resultado precisa ser persistido de forma assincrona; o submit da homepage nao espera a resposta completa do provedor.
- `share roast` fica explicitamente fora do escopo deste ciclo.

### Framework and integration notes

- A pagina de resultado deve seguir o modelo do App Router com loading UI orientada a Suspense e streaming, alinhado com a documentacao oficial do Next.js.
- A leitura e o polling do roast devem continuar usando o contrato do tRPC no App Router, alinhado com a integracao oficial de TanStack React Query + Server Components.
- O contrato de integracao com IA deve ficar atras de um adaptador server-side para preservar a possibilidade de trocar provedor sem alterar homepage, rota publica ou shape de resposta.
- O pipeline deve escolher o provedor por variavel de ambiente, com `gemini` como padrao e `openai` como fallback.
- O adaptador Gemini deve usar saida JSON estruturada e validar o payload final no contrato existente de roast analysis.

## Recommendation

- Usar pipeline assincrono persistido como fluxo oficial de criacao.
- Criar o roast primeiro, devolver o slug publico e disparar o processamento em segundo plano.
- Tratar `queued` e `processing` de backend como um unico estado de produto: `processing`.
- Manter o contrato da pagina de resultado orientado a estado, para simplificar UI e polling.
- Manter a pagina principalmente server-first, com um leaf client pequeno para polling e atualizacao de status, seguindo o uso de Suspense e boundaries recomendado no App Router.
- Manter o tRPC como contrato typesafe entre homepage, pagina de resultado e camada server, sem criar um fetch ad-hoc paralelo.
- Introduzir uma factory server-side para selecionar `gemini` ou `openai` sem mudar o contrato `RoastAnalysisProvider`.

## Implementation shape

- Homepage:
  - validar snippet e modo
  - criar roast persistido
  - redirecionar imediatamente para `/roasts/[slug]`
- Pipeline:
  - reivindicar trabalho pendente
  - escolher o provider por `ROAST_PROVIDER`
  - executar analise de IA com Gemini como padrao e OpenAI como fallback
  - persistir score, resumo, findings e improved code
  - finalizar em `completed` ou `failed`
- Result page:
  - ler roast por slug
  - renderizar shell de `processing` enquanto a analise nao termina
  - trocar para `completed` ou `failed` quando houver estado final

## Verification

- `pnpm exec tsx --test src/server/roasts/**/*.test.ts src/components/roast-result/**/*.test.ts`
  - status: passing
  - resultado observado: `17` testes passaram, `0` falhas
- `pnpm lint`
  - status: failing
  - resultado observado: Biome falha por drift de formatacao repo-wide em arquivos fora deste escopo, incluindo `biome.json`, `drizzle.config.ts` e varios arquivos em `src/app/*`
- `pnpm build`
  - status: failing
  - resultado observado: o build compila, mas falha no prerender de rotas com acesso ao banco (`/leaderboard` e metricas da homepage) porque as queries DB-backed nao conseguem conectar/autenticar localmente; os erros observados incluem `ECONNRESET` e, em verificacao anterior do mesmo fluxo, `password authentication failed`

## File impact

- `README.md`
- `specs/roast-creation-spec.md`
- `package.json`
- `src/app/roasts/[slug]/page.tsx`
- `src/components/home/home-hero.tsx`
- `src/components/roast-result/*`
- `src/server/roasts/*`
- `src/trpc/routers/roasts.ts`

## Risks

- Falhas de provedor ou schema invalido precisam cair em `failed`, sem expor detalhes internos ao usuario.
- Se o processamento ficar preso, a pagina precisa continuar refletindo `processing` sem fingir sucesso.
- Como o fluxo depende de banco e credenciais reais, verificacoes locais podem falhar por ambiente e nao por regressao funcional.
- A troca de provedor nao pode quebrar o fallback OpenAI nem sobrescrever o ajuste local do modelo padrao para `gpt-4o-mini`.

## TODO

- [x] Registrar o objetivo do fluxo de criacao de roast.
- [x] Documentar o redirect imediato para `/roasts/[slug]`.
- [x] Registrar o processamento assincrono persistido.
- [x] Definir os estados `processing`, `completed` e `failed`.
- [x] Deixar `share roast` fora do escopo.
- [x] Documentar Gemini como provider padrao e OpenAI como fallback via `ROAST_PROVIDER`.
