// Request/response contract between the CodeLens UI and the n8n
// "GitHub Code Reviewer" workflow (Webhook -> ... -> Respond to Webhook).

export interface ReviewRequest {
  // Full GitHub file URL. Accepts either a github.com/.../blob/... link
  // or a raw.githubusercontent.com link. The workflow normalizes it.
  repoUrl: string
}

export interface ReviewResponse {
  success: boolean
  fileName: string
  sourceUrl: string
  rawUrl: string
  // GitHub-flavoured Markdown produced by the LLM review step.
  review: string
  reviewedAt: string
  // Present only when the workflow reports a handled error.
  error?: string
}
