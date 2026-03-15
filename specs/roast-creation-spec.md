# Roast Creation

## Objective

- Definir o primeiro fluxo real de criacao de roast do devroast.
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

## Current project context

- O app ja tem homepage de submissao, rota publica de resultado e persistencia do ciclo de vida do roast no banco.
- A branch atual implementa submissao real e pagina de resultado por slug publico.
- O processamento da analise depende de persistencia, para que o usuario possa sair da homepage imediatamente e acompanhar o status depois.
- O resultado final alimenta a experiencia publica do produto; por isso o fluxo precisa tratar estados incompletos e falhas de forma explicita.

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

## Recommendation

- Usar pipeline assincrono persistido como fluxo oficial de criacao.
- Criar o roast primeiro, devolver o slug publico e disparar o processamento em segundo plano.
- Tratar `queued` e `processing` de backend como um unico estado de produto: `processing`.
- Manter o contrato da pagina de resultado orientado a estado, para simplificar UI e polling.

## Implementation shape

- Homepage:
  - validar snippet e modo
  - criar roast persistido
  - redirecionar imediatamente para `/roasts/[slug]`
- Pipeline:
  - reivindicar trabalho pendente
  - executar analise de IA
  - persistir score, resumo, findings e improved code
  - finalizar em `completed` ou `failed`
- Result page:
  - ler roast por slug
  - renderizar shell de `processing` enquanto a analise nao termina
  - trocar para `completed` ou `failed` quando houver estado final

## File impact

- `README.md`
- `specs/roast-creation-spec.md`
- `src/app/roasts/[slug]/page.tsx`
- `src/components/home/home-hero.tsx`
- `src/components/roast-result/*`
- `src/server/roasts/*`
- `src/trpc/routers/roasts.ts`

## Risks

- Falhas de provedor ou schema invalido precisam cair em `failed`, sem expor detalhes internos ao usuario.
- Se o processamento ficar preso, a pagina precisa continuar refletindo `processing` sem fingir sucesso.
- Como o fluxo depende de banco e credenciais reais, verificacoes locais podem falhar por ambiente e nao por regressao funcional.

## TODO

- [x] Registrar o objetivo do fluxo de criacao de roast.
- [x] Documentar o redirect imediato para `/roasts/[slug]`.
- [x] Registrar o processamento assincrono persistido.
- [x] Definir os estados `processing`, `completed` e `failed`.
- [x] Deixar `share roast` fora do escopo.
