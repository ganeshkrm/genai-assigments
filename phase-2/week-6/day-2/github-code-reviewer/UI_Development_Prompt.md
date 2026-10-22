# UI Development Prompt - GitHub Code Reviewer (CodeLens)

This is the complete, phase-wise prompt used to build the custom UI for the
existing n8n GitHub Code Reviewer Agent. It is written so it can be handed to a
VS Code chat agent (Agent Mode) or any code assistant and produce the same UI.

Role: You are a Senior SDET engineer / Senior Test Automation Architect who also
writes production-quality front-end code. Build a clean, responsive, single-page
web UI and connect it to an n8n webhook. Use plain hyphens only in all output,
never em dashes or en dashes.

---

## Context the agent is given

- There is an existing n8n workflow "GitHub Code Reviewer" that reviews a source
  file fetched from GitHub and returns a Markdown review.
- The workflow is being changed so its first node is a Webhook (POST) and its
  last node is Respond to Webhook.
- A reference UI already exists (the "User Story Reviewer" app): a React + Vite
  front end with a themed single-file component, CSS-variable theming, a
  two-column workspace (sticky form on the left, output on the right), and clear
  loading / error / placeholder / results states. Mirror its structure and
  quality, but build a GitHub code review experience and a different brand.

## Request / response contract

- The UI sends: `POST { "repoUrl": "<github file url>" }`.
- The workflow returns JSON:
  `{ success, fileName, sourceUrl, rawUrl, review, reviewedAt }`
  where `review` is GitHub-flavoured Markdown.
- The UI calls the webhook through a Vite dev proxy at `/n8n/...` so the browser
  makes no cross-origin request (no CORS setup needed on the webhook node).

---

## Phase 1 - Project setup

- Use React 18 + TypeScript + Vite (match the reference stack and versions).
- Files: `index.html`, `src/main.tsx`, `src/App.tsx`, `src/api.ts`,
  `src/types.ts`, `src/markdown.ts`, `src/vite-env.d.ts`, `vite.config.ts`,
  `tsconfig.json`, `tsconfig.node.json`, `package.json`, `.env.example`,
  `public/favicon.svg`.
- In `vite.config.ts`, run on port 5173 and add a proxy: `/n8n` ->
  `http://localhost:5678` with `changeOrigin: true` and a rewrite that strips the
  `/n8n` prefix.
- No heavy dependencies. Do not add a Markdown or UI component library; render
  Markdown with a small local function.

## Phase 2 - Types and API layer

- `types.ts`: `ReviewRequest { repoUrl }` and
  `ReviewResponse { success, fileName, sourceUrl, rawUrl, review, reviewedAt, error? }`.
- `api.ts`: a single `reviewCode(request)` function that POSTs JSON to
  `VITE_REVIEW_ENDPOINT` (default `/n8n/webhook/github-code-review`). Handle:
  network failure, 404 (workflow not active), non-OK status with a server
  message, non-JSON body, and an empty review. Each case throws a clear,
  human-readable Error.

## Phase 3 - Markdown rendering

- `markdown.ts`: a dependency-free `renderMarkdown(md)` that escapes HTML first,
  then supports headings, unordered and ordered lists, bold, italic, inline code,
  fenced code blocks, links, and horizontal rules.
- Convert severity words (High / Critical, Medium, Low / Minor) into coloured
  pill spans so findings are easy to scan.

## Phase 4 - Branding and theme

- Product name: CodeLens. Team label: "Retail Design Studio - UI/UX Engineering".
  Do not use the real organization name anywhere in the UI.
- Theme: deep purple primary (`--brand-dark: #3c1053`, `--brand: #5a287d`,
  `--brand-accent: #8e44c7`) with soft purple surfaces, on a light background.
  This is inspired by the organization's retail brand without naming it.
- Font: Inter (loaded from Google Fonts). Favicon: a simple inline SVG mark.

## Phase 5 - Layout and components

- Professional sticky header: brand mark (SVG), product name, team label, and a
  right-aligned "AI-assisted GitHub code review" tag (hidden on very small
  screens).
- Hero: a small badge pill, an H1 title "GitHub Code Reviewer", and a one-line
  subtitle.
- Two-column workspace (CSS grid). Left: a card with the GitHub File URL input,
  a hint line with a "Use example" action, and the Review / Clear buttons. The
  form card is sticky on desktop. Right: the output column.
- Professional footer with the brand and an "internal tooling" note.

## Phase 6 - States and messages

- Validation: on submit, block empty input and input that does not look like a
  GitHub URL (`github.com` or `raw.githubusercontent.com`). Show an inline
  validation message and mark the field invalid. Clear it as the user types.
- Loading: a spinner in the button ("Reviewing...") and a large loading card in
  the output column with a short sub-message.
- Error: a red banner in the output column with the thrown message.
- Placeholder: an empty-state card shown before the first run, listing the review
  sections the user will get.
- Success: a results card with a "Review complete" chip, file name, reviewed-at
  timestamp, a "View source" link, a "Copy review" button, and the rendered
  Markdown review.
- Add a transient notice line ("Cleared", "Copy not available") driven by a
  timeout.

## Phase 7 - Responsive design

- One column below 1024px; two columns at and above 1024px.
- Header tag hidden below 640px. Everything readable on a 375 - 390px phone
  width with no horizontal scroll. Test desktop, tablet, and mobile widths.

## Phase 8 - Verify

- `npm run build` must pass `tsc` with strict settings and produce a clean Vite
  build.
- Manually test: empty validation, a bad URL, a valid URL with the workflow off
  (404 path), and a valid URL with the workflow active (full review).

---

## Acceptance checklist

- [ ] Sends `{ repoUrl }` to the n8n webhook through the `/n8n` proxy.
- [ ] Renders the Markdown review with severity pills and code blocks.
- [ ] Custom brand only, no organization name anywhere.
- [ ] Loading, success, validation, and error states all present.
- [ ] Responsive on desktop, tablet, and mobile.
- [ ] Strict TypeScript build passes.
- [ ] Plain hyphens only, no em or en dashes.
