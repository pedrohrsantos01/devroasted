# Code Editor With Syntax Highlight

## Objective

Define the best approach to evolve the homepage code area into a paste-focused code surface with:

- syntax highlight applied after the user pastes code
- automatic language detection when the user pastes code
- optional manual language selection in the homepage editor
- strong visual alignment with the terminal-like Devroast aesthetic

Important product decision:

- this area is **not** meant to be a full editing experience
- the user should primarily **paste** code
- after paste, the UI should identify the language automatically or accept a manual override and render the highlighted result

This document is research + implementation specification only. No code should be implemented from this file directly without a follow-up execution step.

## Current project context

- Stack: Next.js App Router, React 19, TypeScript, Tailwind v4
- Existing homepage editor: custom `textarea` with line numbers in `src/components/home/home-code-editor.tsx`
- Existing code highlighting: `shiki` already used for static/server-rendered code blocks
- Product direction: dark, terminal-inspired, lightweight UX instead of a full IDE

## Requirements

### Functional

- User can paste code into the homepage area
- The app highlights syntax according to the detected language
- User can manually override the language
- Editor supports an `Auto` mode for language selection
- Unsupported or low-confidence snippets fall back to plaintext safely
- The highlighted code is shown as a read-only presentation surface after paste
- The user can replace the entire snippet by pasting again or clearing the current content

### Non-functional

- Good paste/render responsiveness on the homepage
- No heavy IDE experience unless clearly justified
- Accessible keyboard behavior for paste, focus, selection, and copy
- Mobile should remain usable, even if advanced behaviors are reduced
- Must fit the current design system and page layout

## What Ray.so does

Based on the current `raycast/ray-so` repository:

- `Editor.tsx` uses a custom `textarea`-driven editing surface
- `HighlightedCode.tsx` renders a separate syntax-highlighted layer
- `shiki` is used in the browser for highlighting, with languages loaded on demand
- `highlight.js` is used for automatic language detection via `highlightAuto(...)`
- language can also be manually selected and overrides auto-detect

In practice, Ray.so is not using Monaco or CodeMirror as the main editor engine. It uses a custom overlay architecture designed around editing + highlighting.

For Devroast, that is useful inspiration for presentation and language handling, but our requirement is simpler because we do **not** want a full editing workflow.

## Options evaluated

### 1. CodeMirror 6 + React wrapper + external language detection

Relevant docs reviewed:

- CodeMirror 6 extension model and dynamic reconfiguration with `Compartment`
- `@uiw/react-codemirror` for React integration, controlled usage, refs, and dynamic language loading
- `highlight.js` `highlightAuto(...)` for heuristic language detection

How it would work:

- use CodeMirror as the main editor engine
- keep the surface editable even though the product does not need editing features
- dynamically switch the language extension when auto-detection or manual selection changes
- use `highlight.js` only to guess the language, not to render the editor itself

Pros:

- robust if the product later becomes a true editor
- strong accessibility and text handling
- dynamic language switching is a first-class concept in CodeMirror 6
- lighter and simpler than Monaco

Cons:

- overkill for a paste-only experience
- adds a real editor engine where the product does not need one
- token colors will come from CodeMirror language packages, not directly from Shiki
- exact visual parity with static Shiki-rendered blocks requires extra design work

Verdict:

- no longer the best fit after clarifying that the user should not edit the snippet

### 2. Paste surface + read-only Shiki rendering + language detection

How it would work:

- keep a lightweight paste/input surface only for receiving or replacing code
- after paste, render the snippet as a read-only highlighted block
- use `shiki` in the browser for syntax coloring
- use `highlight.js` to auto-detect the language
- allow a manual language selector to override the detected result
- lazy load languages as needed

Pros:

- matches the actual product requirement much more closely
- keeps visual parity with existing Shiki-powered code blocks
- avoids shipping a full IDE/editor engine
- simpler mental model: paste -> detect/select language -> render highlighted output
- easier to keep the Devroast shell highly custom

Cons:

- client-side Shiki still has startup/runtime cost
- auto-detection remains heuristic
- if we keep an always-editable overlay, complexity increases quickly

Verdict:

- **best option for Devroast given the paste-only requirement**

### 3. Monaco Editor + manual/auto language switching

Relevant docs reviewed:

- Monaco basic editor creation
- language switching via editor/model configuration
- bundling and worker setup considerations

Pros:

- excellent editor engine
- rich ecosystem and built-in language support for many common languages

Cons:

- heavier bundle/runtime cost
- worker setup and overall integration complexity are harder to justify for a homepage paste editor
- UX feels closer to an IDE than to a playful landing-page editor
- auto-detection is still not the core strength; detection would still need a separate heuristic layer

Verdict:

- not recommended for Devroast homepage

## Recommendation

Use a **paste-first input surface** plus **client-side Shiki rendering** for the highlighted output, with **`highlight.js`** only for language detection.

Why this is the best fit:

- it matches the actual UX: paste code and see the highlighted result
- it avoids introducing a full editing engine that the product does not need
- it reuses the syntax-highlighting technology already present in the project
- it preserves stronger visual consistency between the homepage and the static code blocks
- it keeps the implementation lighter than Monaco and conceptually simpler than CodeMirror for this specific feature

## Recommended implementation shape

### Surface architecture

- `HomeCodeEditor` remains a client component, but it should become a **paste surface + highlighted preview**, not a full editor
- introduce a small editor state model:
  - `code`
  - `languageMode`: `auto | manual`
  - `selectedLanguage`: actual language id used by the editor
  - `manualLanguage`: nullable user override
- recommended UI states:
  - `empty`: waiting for user paste
  - `filled`: code pasted and highlighted
  - `replacing`: user is pasting a new snippet over the current one
- keep the current visual shell concept:
  - window header dots
  - dark frame
  - constrained height
  - terminal-like typography
- the editable raw textarea, if kept, should be treated as an input step, not the final rendered surface

### Language model

Create a local language registry with only the languages we actually want to support first, instead of enabling everything on day one.

Recommended initial subset:

- `javascript`
- `typescript`
- `jsx`
- `tsx`
- `json`
- `html`
- `css`
- `bash`
- `python`
- `sql`
- `go`
- `rust`
- `java`
- `php`
- `yaml`
- `markdown`
- `plaintext`

### Detection strategy

Use a layered strategy, in this priority order:

1. If the user manually selected a language, respect it
2. If future UI adds filename support, infer by extension first
3. Otherwise run `highlight.js.highlightAuto(code, supportedLanguageSubset)`
4. If confidence is weak or the result is not in our registry, use `plaintext`

Important note:

- auto-detection should run on paste and on explicit snippet replacement
- once the user manually changes language, auto-detection should pause until they switch back to `Auto`
- if we temporarily allow raw text visibility before highlight completes, the UI should transition quickly to the highlighted read-only result

## UX recommendation

### Language selector

Add a compact selector in the homepage code surface header with:

- `Auto`
- supported languages list

Behavior:

- default state = `Auto`
- if auto-detect succeeds, show `Auto (TypeScript)` or similar in the UI label
- if the user manually picks `Python`, keep it locked until they return to `Auto`

### Paste-first behavior

- the primary action is paste, not editing
- the user should be able to:
  - paste code into the empty state
  - see highlighted code after paste
  - manually switch the language if detection is wrong
  - clear or replace the snippet
- the user should **not** get a full editing experience with IDE-like expectations

### Performance

- detect language only when needed: on paste, replace, or explicit raw content change
- load Shiki languages lazily if needed
- cache the browser highlighter instance across renders
- avoid rebuilding the highlighter for every new snippet

### Styling

- keep the current Devroast frame and line-number look
- keep token colors aligned with the existing `vesper`/Shiki direction
- keep `font-mono` and current dark surfaces

## Notes about Shiki

Shiki becomes the primary syntax-highlighting renderer for the pasted snippet.

Recommended role for Shiki after this feature:

- client-side highlighted rendering for the homepage paste surface
- static code blocks
- server-rendered snippets
- final roast result cards if they are rendered outside the paste surface
- possible future export/share views where visual fidelity matters more than live editing

## Proposed file impact when implementation starts

Likely files to touch later:

- `src/components/home/home-code-editor.tsx`
- `src/components/home/home-hero.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`
- `src/components/ui/` only if a reusable select/dropdown primitive is needed
- new editor-specific helpers, likely outside `src/components/ui`, for example:
  - `src/components/home/editor-language-registry.ts`
  - `src/components/home/detect-editor-language.ts`
  - `src/components/home/use-home-editor-language.ts`
  - `src/components/home/get-browser-highlighter.ts`

## Risks

- auto-detection is heuristic, not guaranteed
- snippets with little context can be misidentified
- JSX/TSX/TypeScript/JavaScript can be especially ambiguous
- browser-side Shiki setup adds some initialization complexity
- if we try to preserve full editability while also rendering custom highlighting, complexity rises quickly

## Final decision

For Devroast, the best path is:

- **paste-first code surface, not a full editor**
- **Shiki for rendering highlighted pasted code**
- **highlight.js for auto-detection**
- **manual language selector with an `Auto` mode**

This gives the best balance between product intent, visual fidelity, implementation complexity, and future maintainability.

## TODO

- [ ] define the initial supported language list for v1
- [ ] choose the exact UI for the manual language selector on the homepage
- [ ] decide the confidence/fallback rule for auto-detection before falling back to plaintext
- [ ] define whether the raw input area is visible only in the empty state or also available for replacement/editing
- [ ] map current Devroast color tokens to the client-side Shiki presentation shell
- [ ] decide whether line wrapping is enabled by default or only horizontal scrolling is allowed
- [ ] define whether manual language selection should persist between page reloads
- [ ] define the clear/replace interaction after a snippet has already been pasted
- [ ] decide whether future roast results should reuse the same Shiki client setup or keep separate rendering paths
