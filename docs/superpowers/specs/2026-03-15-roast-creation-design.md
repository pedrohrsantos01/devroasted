# Roast Creation Design

## Objective

- Design the first real roast-creation flow for devroast.
- Let users paste code on the homepage, choose `honest` or `roast` mode, submit it, and see a real AI analysis.
- Use an async persisted pipeline instead of blocking the homepage while the model runs.
- Deliver the full result screen in the first slice: score, verdict/summary, findings, original code, and suggested fix.
- Keep `share roast` out of scope for now.

## Sources Considered

- `AGENTS.md`
- `README.md`
- `src/app/page.tsx`
- `src/components/home/home-hero.tsx`
- `src/components/home/home-code-editor.tsx`
- `src/components/home/editor-snippet-constraints.ts`
- `src/app/roasts/[id]/page.tsx`
- `src/components/roast-result/roast-result-data.ts`
- `src/db/schema/roasts.ts`
- `src/db/schema/roast-findings.ts`
- `src/db/schema/enums.ts`
- `src/trpc/routers/_app.ts`
- `specs/trpc-api-layer-spec.md`
- `specs/drizzle-postgres-spec.md`
- tRPC server components docs: `https://trpc.io/docs/client/tanstack-react-query/server-components`
- Next.js App Router data fetching and Suspense docs: `https://nextjs.org/docs/app/getting-started/fetching-data`

## Current Project Context

- The product is already shaped around a homepage submit flow, a roast result page, and public leaderboards.
- The homepage UI already has the core entry points in `src/components/home/home-hero.tsx` and `src/components/home/home-code-editor.tsx`.
- The editor is paste-first today and enforces the current `3000` character limit from `src/components/home/editor-snippet-constraints.ts`.
- The database schema already supports the roast lifecycle and most result fields:
  - `roasts.mode`
  - `roasts.status`
  - `roasts.publicSlug`
  - `roasts.score`
  - `roasts.verdictLabel`
  - `roasts.summary`
  - `roasts.improvedCode`
  - `roast_findings`
- The result page still reads mock data in `src/app/roasts/[id]/page.tsx`.
- tRPC is already in place for metrics and leaderboard data, but there is no `roasts` router yet.

## Approved Constraints

- Submission remains paste-first for this slice.
- `roast mode` must be a real input to the analysis flow.
- Clicking `roast_my_code` redirects immediately to the roast page.
- The roast page should show a `processing` state while analysis runs.
- Completed roasts should be public by default and feed the public leaderboard automatically.
- The first slice should return the full result screen, not a minimal result.
- AI integration should be provider-agnostic from the start.
- `share roast` is explicitly out of scope.

## Approaches Considered

### 1. Async persisted pipeline

Recommended and approved.

- Create the roast record first.
- Redirect immediately to the roast page.
- Run analysis asynchronously.
- Persist status transitions and final output in the database.

Why this wins:

- Fits the existing schema and lifecycle enums.
- Keeps the homepage fast.
- Gives a natural place for retries, failures, and provider swaps later.
- Matches the product flow better than waiting on the homepage.

### 2. Single blocking request

- Run the model before navigation.
- Save the roast only after a full result exists.

Why it was rejected:

- Slower UX.
- Higher timeout risk.
- Wastes the existing `queued` and `processing` states.

### 3. Hybrid flow without a clear pipeline boundary

- Submit, navigate, and let page-level logic drive completion without a clean service layer.

Why it was rejected:

- Weak separation between mutation, processing, and rendering.
- Harder to maintain once provider logic or retries evolve.

## Approved Design

### Architecture

- Keep the homepage server-first, with the existing interactive shell in `src/components/home/home-hero.tsx`.
- Add a new tRPC router `roasts` with the initial procedures:
  - `submit`
  - `bySlug`
- Use `submit` only as the system boundary for validation and roast creation.
- Move AI analysis into an isolated server-side pipeline service rather than into the page or component tree.
- Put a provider-agnostic adapter behind the pipeline so the app depends on a stable domain contract, not a specific vendor SDK.
- Align the public result route to `/roasts/[slug]` instead of keeping the current UUID-shaped public URL.

### Submission Flow

1. User pastes code in the existing homepage editor.
2. User selects or keeps the current mode: `honest` or `roast`.
3. User clicks `roast_my_code`.
4. `roasts.submit` validates input and creates a roast row with:
   - `originalCode`
   - `language` sourced from the existing homepage editor selection/detection state
   - `mode`
   - `lineCount`
   - `publicSlug`
   - `visibility = public`
   - `status = queued`
5. `roasts.submit` immediately calls a dedicated trigger function, `triggerRoastProcessing(roastId)`.
6. `triggerRoastProcessing` performs an atomic claim from `queued` to `processing`. If another process already claimed or completed the roast, it exits without error.
7. The client navigates immediately to `/roasts/[slug]`.
8. The async pipeline runs analysis and updates the roast to `completed` or `failed`.

### Pipeline Trigger and Execution Boundary

The core units for the async pipeline are:

- `roasts.submit`
  - validate input
  - create the roast row
  - invoke the trigger function
  - return navigation data
- `triggerRoastProcessing(roastId)`
  - the only unit allowed to claim work
  - atomically transition `queued -> processing`
  - return immediately if the roast is already `processing`, `completed`, or `failed`
  - invoke the analysis pipeline without changing UI concerns
- `runRoastAnalysisPipeline(roastId)`
  - load the persisted roast
  - call the provider adapter
  - validate the structured output
  - persist final roast fields and findings
  - mark `completed` or `failed`

For the first slice, the trigger runs in-process in the same Node app. This is an explicit v1 decision, not a placeholder. The units above must still be isolated so they can later move behind a queue without changing the homepage or tRPC contract.

### Result Page Behavior

The result page should support these user-visible states:

- `processing`
  - covers both persisted `queued` and `processing` backend statuses
  - Show the real result page shell.
  - Render loading placeholders for score, analysis, and suggested fix.
  - Poll with a small, focused client leaf until the roast exits `queued` or `processing`.
- `completed`
  - Show the full result screen.
  - Use real persisted score, verdict, summary, findings, original code, and improved code.
- `failed`
  - Show a friendly failure state.
  - Offer a retry path by sending the user back to the homepage to roast another snippet.

Because `share roast` is out of scope, the current share action should be replaced in this slice by `$ roast_another_snippet`, linking back to `/`.

### Polling and Stalled Processing Rules

- Poll every `2s` while the roast is still `queued` or `processing` during the first `60s` on the page.
- After `60s`, reduce polling to every `10s` to avoid noisy background traffic.
- If the roast has been stuck in `queued` or `processing` for more than `5 minutes` since `createdAt`, keep the page in the processing UI but show a stalled message and a manual `check_again` action.
- `check_again` performs an immediate status refetch only; it does not create a new roast or re-submit the snippet.
- No automatic re-submission is performed by the page.

### AI Provider Contract

The app should define a concrete domain-level analysis interface:

- input
  - `roastId`
  - `code`
  - `language`
  - `mode`
- output
  - `score`
  - `verdictLabel`
  - `summary`
  - `improvedCode`
  - `findings[]`

Validation rules for the provider output:

- `score` must be numeric and fit the persisted `0.0` to `10.0` range.
- `verdictLabel`, `summary`, and `improvedCode` must be non-empty strings.
- `findings` must be a non-empty ordered array.
- Each finding must include:
  - `kind`
  - `severity`
  - `title`
  - `description`
- `lineStart` and `lineEnd` are optional, but when present they must fit within the submitted `lineCount` and `lineEnd >= lineStart`.
- Malformed provider output is treated as pipeline failure and converted into persisted `failed` state.

Each finding should map cleanly to `roast_findings`:

- `kind`
- `severity`
- `title`
- `description`
- `lineStart`
- `lineEnd`

The provider adapter should return structured data, not free-form prose that the UI has to reverse-engineer.

Failure contract for the provider boundary:

- Provider/network failure -> pipeline marks roast `failed`
- Timeout -> pipeline marks roast `failed`
- Schema validation failure on provider output -> pipeline marks roast `failed`
- Partial output is never persisted as a successful roast

### Data Flow and Persistence

- `roasts.submit` owns input validation and initial persistence.
- The pipeline owns analysis execution and final persistence.
- `roasts.bySlug` owns reading and shaping the roast page response.
- `roasts.bySlug` should return a status-aware union so the page can render `processing`, `completed`, and `failed` without scattered conditional logic.
- `roasts.bySlug` should normalize backend `queued` and `processing` into the same page-level `processing` state.
- Once a roast reaches `completed` and remains `public`, it naturally becomes eligible for existing public leaderboard queries.
- `failed` roasts never appear in public leaderboard surfaces because those queries remain limited to `completed` public roasts.

Recommended router contracts:

- `roasts.submit`
  - input: `{ code, language, mode }`
  - output: `{ publicSlug, status: "queued" | "processing" }`
- `roasts.bySlug`
  - input: `{ slug }`
  - output:
    - `{ state: "processing", roast: { publicSlug, language, mode, originalCode, createdAt } }`
    - `{ state: "completed", roast: { publicSlug, language, mode, score, verdictLabel, summary, originalCode, improvedCode, findings[] } }`
    - `{ state: "failed", roast: { publicSlug, language, mode, originalCode }, message }`

### Error Handling

- Validation failure on submit:
  - stay on the homepage
  - show inline feedback
- Failure to create the roast row:
  - stay on the homepage
  - show a short submission error
- Duplicate button clicks while submit is pending:
  - disable the submit control client-side
  - do not send parallel mutations from the same UI state
- Duplicate submissions from separate user actions:
  - create separate roast records intentionally
  - no deduplication by snippet hash in this slice
- Failure during provider execution or response parsing:
  - mark the roast as `failed`
  - never expose raw provider internals to the UI
- Failure to start the processing trigger after the roast row is created:
  - keep the row in `queued`
  - render the same processing UI on `/roasts/[slug]`
  - allow the result page polling path to observe the stalled state
- Failure reading an unknown slug:
  - return `notFound()` on the result route

## Testing Strategy

- Validate `roasts.submit` input rules, including snippet length and required fields.
- Validate the provider output parser and status mapper.
- Test pipeline status transitions:
  - create roast
  - move to `processing`
  - persist `completed` output
  - persist `failed` output
- Test idempotent trigger behavior so only one processing claim wins.
- Test `roasts.bySlug` for all three states.
- Add a focused integration path for homepage submit -> redirect to slug.
- Add a focused integration path for result page rendering in `processing` and `completed` states.

## File Impact

Expected files and areas to touch during implementation planning:

- `specs/roast-creation-spec.md`
- `src/trpc/routers/roasts.ts`
- `src/trpc/routers/_app.ts`
- `src/components/home/home-hero.tsx`
- `src/app/roasts/[slug]/page.tsx`
- `src/components/roast-result/*`
- new server-side roast pipeline/service files
- new provider adapter files for AI analysis

Expected cleanup or migration work:

- retire the mock result dependency in `src/components/roast-result/roast-result-data.ts`
- replace the current public route from `[id]` to `[slug]`

Legacy route expectation for this slice:

- No compatibility redirect from `/roasts/[id]` is required.
- The app does not yet have a real public result contract in production, so this slice can replace the placeholder route directly.

## Out of Scope

- `share roast`
- file upload
- auth
- moderation or manual publish flow
- multi-provider selection in the UI
- websocket or complex realtime transport

## Risks

- The route migration from `[id]` to `[slug]` touches page structure and data loading together, so the rollout should be planned carefully.
- The result screen expects a fairly complete output contract, so provider response shaping must be strongly validated.
- If the pipeline trigger is designed too close to the UI mutation, the provider-agnostic boundary will erode quickly.
- Polling should stay minimal and isolated so the result route remains mostly server-first.

## Planning Inputs

- The implementation plan should create a product-facing spec in `specs/roast-creation-spec.md` before coding begins, to stay aligned with repository feature-flow rules.
- The first plan should preserve the current paste-first homepage and avoid adding file upload, auth, share flows, or moderation.
