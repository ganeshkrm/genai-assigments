import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
    fetchUserStories,
    getJiraConfig,
    transformUserStory
} from '../utilities/jiraService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Save user stories to JSON file
 * @param {Array} userStories - Array of user stories
 * @param {string} filename - Output filename
 */
function saveToJSON(userStories, filename) {
    try {
        // Ensure data directory exists
        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log('📁 Created data directory');
        }

        const filePath = path.join(dataDir, filename);
        
        // Create metadata
        const output = {
            metadata: {
                projectKey: getJiraConfig().projectKey,
                totalStories: userStories.length,
                fetchedAt: new Date().toISOString(),
                jiraBaseUrl: getJiraConfig().baseURL
            },
            userStories: userStories
        };

        fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
        console.log(`💾 Saved ${userStories.length} user stories to: ${filePath}`);
        
        return filePath;
    } catch (error) {
        console.error('❌ Error saving to JSON:', error.message);
        throw error;
    }
}

/**
 * Main function to orchestrate the process
 */
async function main() {
    try {
        dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
        const jiraConfig = getJiraConfig();
        console.log('🚀 Starting Jira user stories extraction...');
        console.log(`📊 Project: ${jiraConfig.projectKey}`);
        console.log(`🔗 Jira URL: ${jiraConfig.baseURL}`);
        
        // Fetch user stories
        const rawUserStories = await fetchUserStories(jiraConfig.projectKey);
        
        // Transform the data
        console.log('🔄 Transforming user stories...');
        const transformedUserStories = rawUserStories.map(transformUserStory);
        
        // Save to JSON
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `jira-user-stories.json`;
        const savedPath = saveToJSON(transformedUserStories, filename);
        
        // Summary
        console.log('\n📈 Summary:');
        console.log(`   Total user stories: ${transformedUserStories.length}`);
        console.log(`   File saved: ${savedPath}`);
        console.log(`   Project: ${JIRA_CONFIG.projectKey}`);
        
        // Show sample of statuses
        const statusCounts = transformedUserStories.reduce((acc, story) => {
            const statusName = story.status.name || 'Unknown';
            acc[statusName] = (acc[statusName] || 0) + 1;
            return acc;
        }, {});
        
        console.log('\n📊 Stories by status:');
        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`   ${status}: ${count}`);
        });
        
        console.log('\n✅ Process completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Process failed:', error.message);
        process.exit(1);
    }
}

// Run the script
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    main();
}

export { fetchUserStories, transformUserStory, saveToJSON };