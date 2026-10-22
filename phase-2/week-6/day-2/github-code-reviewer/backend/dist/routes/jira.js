"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jiraRouter = void 0;
const express_1 = __importDefault(require("express"));
const jiraClient_1 = require("../jira/jiraClient");
exports.jiraRouter = express_1.default.Router();
exports.jiraRouter.get('/connection', async (_req, res) => {
    try {
        const user = await new jiraClient_1.JiraClient().getCurrentUser();
        res.json({ connected: true, user });
    }
    catch (error) {
        sendJiraError(res, error);
    }
});
exports.jiraRouter.get('/projects', async (_req, res) => {
    try {
        const projects = await new jiraClient_1.JiraClient().getProjects();
        res.json({ projects });
    }
    catch (error) {
        sendJiraError(res, error);
    }
});
exports.jiraRouter.get('/projects/:projectKey/stories', async (req, res) => {
    try {
        const nextPageToken = req.query.nextPageToken;
        if (nextPageToken !== undefined && (typeof nextPageToken !== 'string' || nextPageToken.length > 2048)) {
            res.status(400).json({ error: 'Invalid Jira page token' });
            return;
        }
        const page = await new jiraClient_1.JiraClient().getStoryIssues(req.params.projectKey, nextPageToken);
        res.json(page);
    }
    catch (error) {
        sendJiraError(res, error);
    }
});
function sendJiraError(res, error) {
    if (error instanceof jiraClient_1.JiraClientError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
    }
    res.status(502).json({ error: 'Unable to complete the Jira request.' });
}
//# sourceMappingURL=jira.js.map