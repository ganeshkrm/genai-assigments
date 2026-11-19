import axios from 'axios';

const STORY_FIELDS = [
  'key',
  'summary',
  'description',
  'status',
  'priority',
  'assignee',
  'reporter',
  'created',
  'updated',
  'components',
  'labels',
  'fixVersions',
  'customfield_10016',
  'issuelinks',
  'project'
];

function getJiraConfig() {
  const configuredBaseURL = process.env.JIRA_BASE_URL;
  const config = {
    baseURL: configuredBaseURL,
    email: process.env.JIRA_EMAIL,
    apiToken: process.env.JIRA_API_TOKEN,
    projectKey: process.env.JIRA_PROJECT_KEY
  };
  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => ({
      baseURL: 'JIRA_BASE_URL',
      email: 'JIRA_EMAIL',
      apiToken: 'JIRA_API_TOKEN',
      projectKey: 'JIRA_PROJECT_KEY'
    }[key]));

  if (missing.length > 0) {
    throw new Error(`Missing Jira configuration: ${missing.join(', ')}`);
  }
  let jiraURL;
  try {
    jiraURL = new URL(configuredBaseURL);
  } catch {
    throw new Error('JIRA_BASE_URL must be a valid Atlassian Cloud URL');
  }
  if (jiraURL.protocol !== 'https:' || !jiraURL.hostname.endsWith('.atlassian.net')) {
    throw new Error('JIRA_BASE_URL must use your Atlassian Cloud site URL');
  }
  config.baseURL = jiraURL.origin;

  if (!/^[A-Z][A-Z0-9_]*$/.test(config.projectKey)) {
    throw new Error('JIRA_PROJECT_KEY must be a Jira project key');
  }

  return config;
}

function createJiraClient(config) {
  return axios.create({
    baseURL: `${config.baseURL}/rest/api/3`,
    auth: {
      username: config.email,
      password: config.apiToken
    },
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    timeout: 30000
  });
}

function getStoryFields() {
  const fields = [...STORY_FIELDS];
  const acceptanceCriteriaField = process.env.JIRA_ACCEPTANCE_CRITERIA_FIELD;
  if (acceptanceCriteriaField && !fields.includes(acceptanceCriteriaField)) {
    fields.push(acceptanceCriteriaField);
  }
  return fields.join(',');
}

async function searchJiraStories(jql, maxResults, config) {
  const client = createJiraClient(config);
  const response = await client.get('/search/jql', {
    params: {
      jql,
      maxResults,
      fields: getStoryFields()
    }
  });

  if (!Array.isArray(response.data?.issues)) {
    const responseType = Array.isArray(response.data) ? 'array' : typeof response.data;
    const responseKeys = response.data && typeof response.data === 'object'
      ? Object.keys(response.data).join(', ')
      : '';
    const responseContentType = response.headers?.['content-type'] || 'unknown';
    const responseLength = typeof response.data === 'string' ? `; length: ${response.data.length}` : '';
    throw new Error(
      `Jira returned an invalid issue search response (${responseType}; content type: ${responseContentType}${responseKeys ? `; fields: ${responseKeys}` : ''}${responseLength})`
    );
  }
  return response.data.issues;
}

export async function fetchUserStories(projectKey, maxResults = 100) {
  const config = getJiraConfig();
  const selectedProjectKey = projectKey || config.projectKey;
  if (selectedProjectKey !== config.projectKey) {
    throw new Error('The requested project key must match JIRA_PROJECT_KEY');
  }
  if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > 100) {
    throw new Error('Jira story limit must be between 1 and 100');
  }

  const jql = `project = ${selectedProjectKey} AND issuetype = Story ORDER BY created DESC`;
  return searchJiraStories(jql, maxResults, config);
}

export async function fetchUserStoriesByKeys(issueKeys) {
  const config = getJiraConfig();
  if (!Array.isArray(issueKeys) || issueKeys.length < 1 || issueKeys.length > 25) {
    throw new Error('Select between 1 and 25 Jira stories to ingest');
  }

  const uniqueKeys = [...new Set(issueKeys)];
  const validKey = new RegExp(`^${config.projectKey}-\\d+$`);
  if (uniqueKeys.some(key => typeof key !== 'string' || !validKey.test(key))) {
    throw new Error('One or more Jira issue keys are invalid for the configured project');
  }

  const jql = `project = ${config.projectKey} AND issuetype = Story AND key in (${uniqueKeys.join(',')})`;
  return searchJiraStories(jql, uniqueKeys.length, config);
}

export function jiraTextToPlainText(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(jiraTextToPlainText).join('');
  if (!value || typeof value !== 'object') return '';
  if (typeof value.text === 'string') return value.text;
  if (value.type === 'hardBreak') return '\n';

  const text = Array.isArray(value.content)
    ? value.content.map(jiraTextToPlainText).join('')
    : '';
  return ['paragraph', 'heading', 'listItem', 'blockquote'].includes(value.type)
    ? `${text}\n`
    : text;
}

export function transformUserStory(issue) {
  const fields = issue?.fields || {};
  const acceptanceCriteriaField = process.env.JIRA_ACCEPTANCE_CRITERIA_FIELD;
  const baseURL = getJiraConfig().baseURL;
  const priority = fields.priority;
  const status = fields.status;

  return {
    key: issue.key,
    storyId: issue.key,
    summary: fields.summary || '',
    description: jiraTextToPlainText(fields.description).trim() || 'No description available',
    acceptanceCriteria: acceptanceCriteriaField
      ? jiraTextToPlainText(fields[acceptanceCriteriaField]).trim()
      : '',
    status: {
      name: status?.name || '',
      category: status?.statusCategory?.name || ''
    },
    priority: {
      name: priority?.name || 'None',
      id: priority?.id || null
    },
    assignee: fields.assignee ? {
      displayName: fields.assignee.displayName || '',
      emailAddress: fields.assignee.emailAddress || null,
      accountId: fields.assignee.accountId || null
    } : null,
    reporter: fields.reporter ? {
      displayName: fields.reporter.displayName || '',
      emailAddress: fields.reporter.emailAddress || null,
      accountId: fields.reporter.accountId || null
    } : null,
    created: fields.created || null,
    updated: fields.updated || null,
    components: (fields.components || []).map(component => component.name).filter(Boolean),
    labels: fields.labels || [],
    fixVersions: (fields.fixVersions || []).map(version => version.name).filter(Boolean),
    storyPoints: fields.customfield_10016 ?? null,
    issueLinks: (fields.issuelinks || []).map(link => ({
      type: link.type?.name || '',
      direction: link.type?.inward || link.type?.outward || '',
      linkedIssue: link.inwardIssue?.key || link.outwardIssue?.key || null
    })),
    project: fields.project?.key || process.env.JIRA_PROJECT_KEY || '',
    sourceType: 'jira',
    url: baseURL ? `${baseURL}/browse/${issue.key}` : ''
  };
}

export { getJiraConfig };
