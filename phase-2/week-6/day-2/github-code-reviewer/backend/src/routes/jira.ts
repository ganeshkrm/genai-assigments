import express from 'express'
import { JiraClient, JiraClientError } from '../jira/jiraClient'

export const jiraRouter = express.Router()

jiraRouter.get('/connection', async (_req, res): Promise<void> => {
  try {
    const user = await new JiraClient().getCurrentUser()
    res.json({ connected: true, user })
  } catch (error) {
    sendJiraError(res, error)
  }
})

jiraRouter.get('/projects', async (_req, res): Promise<void> => {
  try {
    const projects = await new JiraClient().getProjects()
    res.json({ projects })
  } catch (error) {
    sendJiraError(res, error)
  }
})

jiraRouter.get('/projects/:projectKey/stories', async (req, res): Promise<void> => {
  try {
    const nextPageToken = req.query.nextPageToken
    if (nextPageToken !== undefined && (typeof nextPageToken !== 'string' || nextPageToken.length > 2048)) {
      res.status(400).json({ error: 'Invalid Jira page token' })
      return
    }

    const page = await new JiraClient().getStoryIssues(req.params.projectKey, nextPageToken)
    res.json(page)
  } catch (error) {
    sendJiraError(res, error)
  }
})

function sendJiraError(res: express.Response, error: unknown): void {
  if (error instanceof JiraClientError) {
    res.status(error.statusCode).json({ error: error.message })
    return
  }

  res.status(502).json({ error: 'Unable to complete the Jira request.' })
}