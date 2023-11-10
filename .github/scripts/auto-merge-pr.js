const { Octokit } = require("@octokit/rest");
const { execSync } = require("child_process");
require("dotenv").config();

const fetch = require("node-fetch");

// Instantiate Octokit with a personal access token and a fetch implementation
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  request: {
    fetch: fetch
  }
});

const owner = 'your-github-username';
const repo = 'your-repo-name';
const filePath = '.github/scripts/update-readme-featured-follower.js';

async function autoMergePR() {
  // List all open pull requests on the repository
  const { data: pullRequests } = await octokit.pulls.list({
    owner,
    repo,
    state: 'open',
    base: 'main' // or the name of your default branch
  });

  for (const pullRequest of pullRequests) {
    // Get the files of the pull request
    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: pullRequest.number
    });

    // Check if the specific file is the only one changed and has the correct modifications
    const file = files.find(file => file.filename === filePath);
    if (files.length === 1 && file) {
      // Get the content of the file in the PR
      const { data: fileContent } = await octokit.repos.getContent({
        owner,
        repo,
        path: file.filename,
        ref: pullRequest.head.ref // Use the PR's branch to get the file content
      });

      // Decode the base64 content and split into lines
      const contentDecoded = Buffer.from(fileContent.content, 'base64').toString('utf8');
      const contentLines = contentDecoded.split('\n');

      // Find the PLEASE_FEATURE_ME array definition line
      const featureMeLineIndex = contentLines.findIndex(line => line.trim().startsWith('const PLEASE_FEATURE_ME = ['));

      // Perform checks on the line where the array is defined
      if (featureMeLineIndex !== -1) {
        const featureMeLine = contentLines[featureMeLineIndex];

        // Regex to check if only one username was added/removed and does not end with a comma
        const regex = /const PLEASE_FEATURE_ME = \[\s*(?:'[^']+',\s*)*?'?[^']+'?\s*\];/;

        if (regex.test(featureMeLine)) {
          // Merge the pull request if the condition is met
          try {
            // Merge the pull request
            await octokit.pulls.merge({
              owner,
              repo,
              pull_number: pullRequest.number,
              commit_title: `Automated merge by bot for PR #${pullRequest.number}`,
              commit_message: 'Auto-merging PR based on conditions met in the array modification.',
              merge_method: 'squash' // or 'merge' or 'rebase'
            });

            console.log(`Successfully merged PR #${pullRequest.number}`);
          } catch (error) {
            console.error(`Error merging PR #${pullRequest.number}: ${error}`);
          }
        }
      }
    }
  }
}

// Only run this script if it's executed directly from the command line
if (require.main === module) {
  autoMergePR();
}
