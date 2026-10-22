# Phase-wise Implementation - GitHub Code Reviewer Agent with Custom UI

Project: a custom web UI (CodeLens) for the existing n8n "GitHub Code Reviewer"
agent. The workflow is updated to start with a Webhook node and end with a
Respond to Webhook node, and the UI calls that webhook.

All text uses plain hyphens only, never em dashes or en dashes.

---

## Phase 0 - Baseline (what already existed)

The original n8n workflow "Github code review" had this shape:

`On form submission -> HTTP Request (GET raw GitHub file) -> Basic LLM Chain
(with Groq Chat Model) -> Send an Email`

It fetched a raw GitHub file, reviewed it with Groq, and emailed the result.
The original workflow is left untouched. A separate copy is used for the
webhook version so nothing existing is disturbed.

The reference UI (the "User Story Reviewer" app) is a React + Vite front end with
an Express backend. Its front end was used as the structure and quality
reference for this build.

---

## Phase 1 - Update the n8n workflow

Goal: replace the manual form trigger and the email output with a Webhook entry
and an HTTP response, so a web UI can drive the agent.

New workflow shape:

`Webhook (POST) -> Normalize URL (Code) -> Fetch File (HTTP Request) ->
Code Review (Basic LLM Chain + Groq Chat Model) -> Respond to Webhook`

Node details:

1. Webhook (first node)
   - HTTP Method: POST
   - Path: `github-code-review`
   - Respond: "Using Respond to Webhook node"
   - Production URL: `http://localhost:5678/webhook/github-code-review`
   - Test URL (while the canvas is listening):
     `http://localhost:5678/webhook-test/github-code-review`

2. Normalize URL (Code node)
   - Reads `repoUrl` from the webhook body.
   - Validates it is a non-empty http(s) URL.
   - Converts a `github.com/<owner>/<repo>/blob/<branch>/<path>` link to the
     matching `raw.githubusercontent.com` URL, and strips any query or fragment.
   - Outputs `sourceUrl`, `rawUrl`, and `fileName`.

3. Fetch File (HTTP Request)
   - GET `{{ $json.rawUrl }}`, response format Text.
   - Returns the file contents as `data`.

4. Code Review (Basic LLM Chain + Groq Chat Model)
   - The Groq Chat Model node is attached as the chain's language model.
   - The prompt asks for a Senior Test Automation Architect review and fixes the
     output to these Markdown sections: Summary, Key Findings (with High / Medium
     / Low severity), Code Quality and Best Practices, Potential Bugs and Risks,
     Suggested Improvements, Overall Assessment.
   - Model used: `openai/gpt-oss-120b` (confirmed available in the Groq account and
     tested working; change in the Groq Chat Model node if you prefer another).

5. Respond to Webhook (final node)
   - Responds with JSON:
     `{ success, fileName, sourceUrl, rawUrl, review, reviewedAt }`
   - `review` is the Markdown text from the chain (`$json.text`).

Import and credential steps:
- Import `GitHub_Code_Reviewer_Webhook.json` into n8n (Workflows -> Import from
  File). This creates a new workflow and does not change existing ones.
- Open the Groq Chat Model node and select your existing Groq credential (the
  imported file has a credential placeholder that must be reselected).
- Activate the workflow so the production webhook URL responds, or use "Execute
  workflow" with the test URL for a one-off run.

---

## Phase 2 - UI contract

- Request: `POST { "repoUrl": "<github file url>" }`
- Response: `{ success, fileName, sourceUrl, rawUrl, review, reviewedAt }`
- The UI calls the webhook through a Vite dev proxy (`/n8n` ->
  `http://localhost:5678`) so there is no browser CORS issue and no second server
  to run.

---

## Phase 3 - Build the UI

Stack: React 18 + TypeScript + Vite (same as the reference). Key files:

- `src/types.ts` - request and response types.
- `src/api.ts` - `reviewCode()` with full error handling (network down, 404 when
  the workflow is not active, server error message, non-JSON, empty review).
- `src/markdown.ts` - a small dependency-free Markdown to HTML renderer that also
  turns severity words into coloured pills.
- `src/App.tsx` - the single-page UI: sticky branded header, hero, two-column
  workspace (sticky form left, output right), footer, and all states.
- `vite.config.ts` - dev server on 5173 with the `/n8n` proxy.

Branding: product name CodeLens, team label "Retail Design Studio - UI/UX
Engineering", deep purple theme inspired by the organization's retail brand. The
organization name does not appear anywhere in the UI.

States implemented: validation (empty and non-GitHub URL), loading, error,
placeholder (first run), and success (rendered review with file name, timestamp,
source link, and copy button).

Responsive: one column below 1024px, two columns above; tested at desktop,
tablet, and mobile widths with no horizontal scroll.

---

## Phase 4 - Run locally

1. Start n8n (as usual, `npx n8n` or your normal command) at
   `http://localhost:5678` and make sure the imported workflow is active.
2. In the UI folder:
   - `cd frontend`
   - `npm install`
   - `npm run dev`
   - open `http://localhost:5173`
3. Paste a GitHub file URL (there is a "Use example" link that fills the
   assignment's `LearnDragAndDrop.java` URL) and select Review Code.

---

## Phase 5 - Test

- Validation: submit empty -> inline message. Submit a non-GitHub URL -> inline
  message.
- Workflow off: submit a valid URL with the workflow inactive -> friendly 404
  message.
- Happy path: submit the example URL with the workflow active -> the review
  renders with sections and severity pills.
- Build: `npm run build` passes strict TypeScript and produces a clean Vite
  build.

---

## Phase 6 - Submission package

- `Phase_Wise_Implementation.md` (this file)
- `UI_Development_Prompt.md`
- `GitHub_Code_Reviewer_Webhook.json` (the n8n workflow)
- Complete UI source (the `frontend/` folder)
- Screenshots: the complete n8n workflow, the final UI, and a code-review result
- GitHub repository link
- Short demo video, if required

---

## Notes and assumptions

- The original workflow is preserved. The webhook version is a separate workflow.
- The Groq model id and credential must be set to match your own Groq account.
- The UI talks to n8n through the dev proxy, so only n8n and the Vite dev server
  need to be running. No separate backend is required for this version.
