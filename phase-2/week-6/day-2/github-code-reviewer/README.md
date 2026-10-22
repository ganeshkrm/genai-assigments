# CodeLens - GitHub Code Reviewer (Custom UI + n8n)

A custom web UI for an n8n "GitHub Code Reviewer" agent. Paste a GitHub file URL,
and the app returns a structured, senior-level code review (summary, findings with
severity, risks, and suggested improvements).

The UI is branded for an internal Retail Design Studio / UI-UX Engineering team.

## Architecture

```
Browser (CodeLens UI, React + Vite)
   |  POST { repoUrl }   (via Vite dev proxy /n8n -> http://localhost:5678)
   v
n8n workflow:
   Webhook (POST) -> Normalize URL -> Fetch File (HTTP) ->
   Code Review (LLM Chain + Groq) -> Respond to Webhook
   |  { success, fileName, sourceUrl, rawUrl, review, reviewedAt }
   v
Browser renders the Markdown review
```

## Prerequisites

- Node.js 18+ and npm
- A running local n8n at http://localhost:5678 with a Groq credential

## Setup

1. Import the workflow
   - In n8n: Workflows -> Import from File -> `n8n/GitHub_Code_Reviewer_Webhook.json`
   - Open the Groq Chat Model node and select your Groq credential
   - Activate the workflow (or use "Execute workflow" with the test URL for a
     one-off run)

2. Run the UI
   - `cd frontend`
   - `npm install`
   - `npm run dev`
   - Open http://localhost:5173

3. Use it
   - Paste a GitHub file URL, or click "Use example", then select Review Code.

## Configuration

- The UI calls `/n8n/webhook/github-code-review`, which the Vite proxy forwards to
  n8n. To use the n8n test URL instead, create `frontend/.env` with:
  `VITE_REVIEW_ENDPOINT=/n8n/webhook-test/github-code-review`

## Submission contents

- `Phase_Wise_Implementation.md` - the full phase-wise build
- `UI_Development_Prompt.md` - the complete UI development prompt
- `n8n/GitHub_Code_Reviewer_Webhook.json` - the n8n workflow
- `frontend/` - complete UI source
- `screenshots/` - workflow, UI, and review result screenshots

## Notes

- The original n8n workflow is left untouched. This is a separate webhook version.
- The workflow uses the Groq model `openai/gpt-oss-120b` (tested working). Change
  it in the Groq Chat Model node if you prefer another model in your account.
