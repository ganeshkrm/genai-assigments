import { ReviewRequest, ReviewResponse } from './types'

// The review endpoint is reached through the Vite dev proxy (see vite.config.ts),
// which forwards to the local n8n webhook. This avoids any browser CORS issue and
// keeps the webhook URL in one place. Override via VITE_REVIEW_ENDPOINT if needed
// (for example to point at the n8n test URL: /n8n/webhook-test/github-code-review).
const REVIEW_ENDPOINT =
  import.meta.env.VITE_REVIEW_ENDPOINT || '/n8n/webhook/github-code-review'

export async function reviewCode(request: ReviewRequest): Promise<ReviewResponse> {
  let response: Response
  try {
    response = await fetch(REVIEW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  } catch (networkError) {
    // Thrown when the dev server or n8n is unreachable.
    console.error('Network error calling review endpoint:', networkError)
    throw new Error(
      'Could not reach the review service. Make sure n8n is running and the workflow is active.'
    )
  }

  // n8n returns 404 on the production webhook path until the workflow is active.
  if (response.status === 404) {
    throw new Error(
      'Review workflow not found (404). Activate the workflow in n8n, or for a one-off run use the test URL.'
    )
  }

  let data: ReviewResponse | { message?: string; error?: string }
  try {
    data = await response.json()
  } catch {
    throw new Error(`Unexpected response from the review service (status ${response.status}).`)
  }

  if (!response.ok) {
    const message =
      (data as { message?: string; error?: string }).error ||
      (data as { message?: string }).message ||
      `Review failed with status ${response.status}.`
    throw new Error(message)
  }

  const result = data as ReviewResponse
  if (!result.review) {
    throw new Error('The review came back empty. Check the workflow execution in n8n.')
  }
  return result
}
