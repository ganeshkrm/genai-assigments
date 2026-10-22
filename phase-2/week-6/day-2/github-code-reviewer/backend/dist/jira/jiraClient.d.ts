export interface JiraProject {
    id: string;
    key: string;
    name: string;
}
export interface JiraIssue {
    key: string;
    summary: string;
    description: string;
    acceptanceCriteria: string;
}
export interface JiraIssuePage {
    issues: JiraIssue[];
    nextPageToken?: string;
    isLast: boolean;
}
export declare class JiraClientError extends Error {
    readonly statusCode: number;
    constructor(message: string, statusCode: number);
}
export declare class JiraClient {
    private readonly baseUrl;
    private readonly authorization;
    constructor();
    getCurrentUser(): Promise<{
        accountId: string;
        displayName: string;
    }>;
    getProjects(): Promise<JiraProject[]>;
    getStoryIssues(projectKey: string, nextPageToken?: string): Promise<JiraIssuePage>;
    private get;
}
//# sourceMappingURL=jiraClient.d.ts.map