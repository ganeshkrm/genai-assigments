"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JiraClient = exports.JiraClientError = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
class JiraClientError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'JiraClientError';
    }
}
exports.JiraClientError = JiraClientError;
class JiraClient {
    baseUrl;
    authorization;
    constructor() {
        const configuredBaseUrl = process.env.JIRA_BASE_URL;
        const email = process.env.JIRA_EMAIL;
        const apiToken = process.env.JIRA_API_TOKEN;
        if (!configuredBaseUrl || !email || !apiToken) {
            throw new JiraClientError('Jira is not configured on the server', 503);
        }
        let jiraUrl;
        try {
            jiraUrl = new URL(configuredBaseUrl);
        }
        catch {
            throw new JiraClientError('JIRA_BASE_URL must be a valid URL', 503);
        }
        if (jiraUrl.protocol !== 'https:') {
            throw new JiraClientError('JIRA_BASE_URL must use HTTPS', 503);
        }
        this.baseUrl = jiraUrl.origin;
        this.authorization = `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`;
    }
    async getCurrentUser() {
        return this.get('/myself');
    }
    async getProjects() {
        const projects = [];
        let startAt = 0;
        const maxResults = 100;
        while (true) {
            const page = await this.get('/project/search', {
                startAt: String(startAt),
                maxResults: String(maxResults),
                orderBy: 'name'
            });
            projects.push(...page.values.map(({ id, key, name }) => ({ id, key, name })));
            startAt += page.values.length;
            if (page.values.length === 0 || startAt >= page.total) {
                return projects;
            }
        }
    }
    async getStoryIssues(projectKey, nextPageToken) {
        if (!/^[a-zA-Z0-9_-]+$/.test(projectKey)) {
            throw new JiraClientError('Invalid Jira project key', 400);
        }
        const acceptanceCriteriaField = process.env.JIRA_ACCEPTANCE_CRITERIA_FIELD || 'customfield_10042';
        if (!/^customfield_\d+$/.test(acceptanceCriteriaField)) {
            throw new JiraClientError('JIRA_ACCEPTANCE_CRITERIA_FIELD must be a Jira custom field ID', 503);
        }
        const query = {
            jql: `project = "${projectKey}" AND issuetype = "Story" ORDER BY created DESC`,
            maxResults: '50',
            fields: `summary,description,${acceptanceCriteriaField}`
        };
        if (nextPageToken) {
            query.nextPageToken = nextPageToken;
        }
        const response = await this.get('/search/jql', query);
        const issues = response.issues.map(issue => ({
            key: issue.key,
            summary: issue.fields.summary,
            description: documentToText(issue.fields.description),
            acceptanceCriteria: documentToText(issue.fields[acceptanceCriteriaField])
        }));
        return {
            issues,
            nextPageToken: response.nextPageToken,
            isLast: response.isLast ?? !response.nextPageToken
        };
    }
    async get(path, query = {}) {
        const url = new URL(`/rest/api/3${path}`, this.baseUrl);
        Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
        let response;
        try {
            response = await (0, node_fetch_1.default)(url, {
                headers: {
                    Accept: 'application/json',
                    Authorization: this.authorization
                }
            });
        }
        catch {
            throw new JiraClientError('Unable to reach Jira. Check the server network connection.', 502);
        }
        if (!response.ok) {
            const message = response.status === 401
                ? 'Jira rejected the configured credentials.'
                : response.status === 403
                    ? 'The Jira account does not have permission to access this resource.'
                    : response.status === 429
                        ? 'Jira rate limit reached. Try again shortly.'
                        : `Jira request failed with status ${response.status}.`;
            throw new JiraClientError(message, response.status === 401 ? 401 : response.status === 403 ? 403 : 502);
        }
        return response.json();
    }
}
exports.JiraClient = JiraClient;
function documentToText(document) {
    if (!document) {
        return '';
    }
    if (typeof document === 'string') {
        return document;
    }
    const collectText = (node) => {
        if (node.type === 'hardBreak') {
            return '\n';
        }
        const text = node.text || (node.content || []).map(collectText).join('');
        return ['paragraph', 'heading', 'listItem', 'codeBlock'].includes(node.type || '')
            ? `${text}\n`
            : text;
    };
    return collectText(document).trim();
}
//# sourceMappingURL=jiraClient.js.map