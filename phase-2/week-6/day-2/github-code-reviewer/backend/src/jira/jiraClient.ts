import fetch from 'node-fetch'

export interface JiraProject {
  id: string
  key: string
  name: string
}

export interface JiraIssue {
  key: string
  summary: string
  description: string
  acceptanceCriteria: string
}

export interface JiraIssuePage {
  issues: JiraIssue[]
  nextPageToken?: string
  isLast: boolean
}

interface JiraProjectSearchResponse {
  values: JiraProject[]
  total: number
  startAt: number
  maxResults: number
}

interface JiraIssueSearchResponse {
  issues: Array<{
    key: string
    fields: {
      summary: string
      description: string | AtlassianDocument | null
      [field: string]: string | AtlassianDocument | null | undefined
    }
  }>
  nextPageToken?: string
  isLast?: boolean
}

interface AtlassianDocument {
  type?: string
  text?: string
  content?: AtlassianDocument[]
}

export class JiraClientError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message)
    this.name = 'JiraClientError'
  }
}

export class JiraClient {
  private readonly baseUrl: string
  private readonly authorization: string

  constructor() {
    const configuredBaseUrl = process.env.JIRA_BASE_URL
    const email = process.env.JIRA_EMAIL
    const apiToken = process.env.JIRA_API_TOKEN

    if (!configuredBaseUrl || !email || !apiToken) {
      throw new JiraClientError('Jira is not configured on the server', 503)
    }

    let jiraUrl: URL
    try {
      jiraUrl = new URL(configuredBaseUrl)
    } catch {
      throw new JiraClientError('JIRA_BASE_URL must be a valid URL', 503)
    }

    if (jiraUrl.protocol !== 'https:') {
      throw new JiraClientError('JIRA_BASE_URL must use HTTPS', 503)
    }

    this.baseUrl = jiraUrl.origin
    this.authorization = `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`
  }

  async getCurrentUser(): Promise<{ accountId: string; displayName: string }> {
    return this.get('/myself')
  }

  async getProjects(): Promise<JiraProject[]> {
    const projects: JiraProject[] = []
    let startAt = 0
    const maxResults = 100

    while (true) {
      const page = await this.get<JiraProjectSearchResponse>('/project/search', {
        startAt: String(startAt),
        maxResults: String(maxResults),
        orderBy: 'name'
      })

      projects.push(...page.values.map(({ id, key, name }) => ({ id, key, name })))
      startAt += page.values.length

      if (page.values.length === 0 || startAt >= page.total) {
        return projects
      }
    }
  }

  async getStoryIssues(projectKey: string, nextPageToken?: string): Promise<JiraIssuePage> {
    if (!/^[a-zA-Z0-9_-]+$/.test(projectKey)) {
      throw new JiraClientError('Invalid Jira project key', 400)
    }

    const acceptanceCriteriaField = process.env.JIRA_ACCEPTANCE_CRITERIA_FIELD || 'customfield_10042'
    if (!/^customfield_\d+$/.test(acceptanceCriteriaField)) {
      throw new JiraClientError('JIRA_ACCEPTANCE_CRITERIA_FIELD must be a Jira custom field ID', 503)
    }

    const query: Record<string, string> = {
      jql: `project = "${projectKey}" AND issuetype = "Story" ORDER BY created DESC`,
      maxResults: '50',
      fields: `summary,description,${acceptanceCriteriaField}`
    }

    if (nextPageToken) {
      query.nextPageToken = nextPageToken
    }

    const response = await this.get<JiraIssueSearchResponse>('/search/jql', query)
    const issues = response.issues.map(issue => ({
      key: issue.key,
      summary: issue.fields.summary,
      description: documentToText(issue.fields.description),
      acceptanceCriteria: documentToText(issue.fields[acceptanceCriteriaField] as string | AtlassianDocument | null)
    }))

    return {
      issues,
      nextPageToken: response.nextPageToken,
      isLast: response.isLast ?? !response.nextPageToken
    }
  }

  private async get<T>(path: string, query: Record<string, string> = {}): Promise<T> {
    const url = new URL(`/rest/api/3${path}`, this.baseUrl)
    Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value))

    let response
    try {
      response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          Authorization: this.authorization
        }
      })
    } catch {
      throw new JiraClientError('Unable to reach Jira. Check the server network connection.', 502)
    }

    if (!response.ok) {
      const message = response.status === 401
        ? 'Jira rejected the configured credentials.'
        : response.status === 403
          ? 'The Jira account does not have permission to access this resource.'
          : response.status === 429
            ? 'Jira rate limit reached. Try again shortly.'
            : `Jira request failed with status ${response.status}.`
      throw new JiraClientError(message, response.status === 401 ? 401 : response.status === 403 ? 403 : 502)
    }

    return response.json() as Promise<T>
  }
}

function documentToText(document: string | AtlassianDocument | null): string {
  if (!document) {
    return ''
  }

  if (typeof document === 'string') {
    return document
  }

  const collectText = (node: AtlassianDocument): string => {
    if (node.type === 'hardBreak') {
      return '\n'
    }

    const text = node.text || (node.content || []).map(collectText).join('')
    return ['paragraph', 'heading', 'listItem', 'codeBlock'].includes(node.type || '')
      ? `${text}\n`
      : text
  }

  return collectText(document).trim()
}