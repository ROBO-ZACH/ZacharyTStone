const { Octokit } = require("@octokit/rest");
const { execSync } = require("child_process");
require("dotenv").config();

const fetch = require("node-fetch");

// Instantiate Octokit with a personal access token and a fetch implementation
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  request: {
    fetch: fetch,
  },
});

const owner = "ZacharyTStone";
const repo = "ZacharyTStone";
const filePath = ".github/scripts/update-readme-featured-follower.js";

async function autoMergePR() {
  // List all open pull requests on the repository
  const { data: pullRequests } = await octokit.pulls.list({
    owner,
    repo,
    state: "open",
    base: "main", // or the name of your default branch
  });

  console.log(pullRequests);

  for (const pullRequest of pullRequests) {
    // Get the files of the pull request
    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: pullRequest.number,
    });

    console.log("files", files);

    // Check if the specific file is the only one changed and has the correct modifications
    const file = files.find((file) => file.filename === filePath);

    console.log("file", file);

    /* file {
  sha: '6bcbefd62f95044d4adb393dbf0be617103f8024',
  filename: '.github/scripts/update-readme-featured-follower.js',
  status: 'modified',
  additions: 1,
  deletions: 0,
  changes: 1,
  blob_url: 'https://github.com/ZacharyTStone/ZacharyTStone/blob/ad0887df5d2cbb3ff8e4d4dfb723ee81b36cb6aa/.github%2Fscripts%2Fupdate-readme-featured-follower.js',
  raw_url: 'https://github.com/ZacharyTStone/ZacharyTStone/raw/ad0887df5d2cbb3ff8e4d4dfb723ee81b36cb6aa/.github%2Fscripts%2Fupdate-readme-featured-follower.js',
  contents_url: 'https://api.github.com/repos/ZacharyTStone/ZacharyTStone/contents/.github%2Fscripts%2Fupdate-readme-featured-follower.js?ref=ad0887df5d2cbb3ff8e4d4dfb723ee81b36cb6aa',
  patch: '@@ -30,6 +30,7 @@ const PLEASE_FEATURE_ME = [\n' +
    '   "josephjaspers",\n' +
    '   "Zakkku",\n' +
    '   "brandonflores647",\n' +
    '+  "test"\n' +
    ' ];\n' +
    ' \n' +
    ' // ------------------------------ //'
}
*/

    const fileisCorrectFilename =
      ".github/scripts/update-readme-featured-follower.js";

    console.log("fileisCorrectFilename", fileisCorrectFilename);

    const isModified = file.status === "modified";

    console.log("status isModified", isModified);

    const fileHas1Change = file.changes === 1;

    console.log("fileHas1Change", fileHas1Change);

    const PRgithubUsername = pullRequest.user.login;

    console.log("PRgithubUsername", PRgithubUsername);

    /* check that for this 
      '+  "test"\n' +
      it is the correct github username

     */

    const findNameAddedOrRemoved = file.patch.includes(PRgithubUsername);

    console.log("findNameAddedOrRemoved", findNameAddedOrRemoved);

    // find all instances of +.... + or -.... -
    // this should be only one instance

    // check that the github username is in the correct place

    const allLines = file.patch.split("\n");

    console.log("allLines", allLines);

    const allLinesWithPlus = allLines.filter((line) => line.includes("+ "));

    console.log("allLinesWithPlus", allLinesWithPlus);

    console.log("all lines with plus count", allLinesWithPlus.length);

    allLinesWithPlus.forEach((line) => {
      console.log("line", line);
    });

    if (allLinesWithPlus.length !== 1) {
      console.log("more than one line with plus");
      return;
    }

    const lineAddsUsername = allLinesWithPlus.filter(
      (line) => line.includes(PRgithubUsername) || line.includes("test")
    );

    console.log("lineAddsUsername", lineAddsUsername);

    // do the same for -.... -

    const allLinesWithMinus = allLines.filter((line) => line.includes("- "));

    if (allLinesWithMinus.length !== 1) {
      console.log("more than one line with minus");
      return;
    }

    console.log("allLinesWithMinus", allLinesWithMinus);

    const lineRemovesUsername = allLinesWithMinus.filter(
      (line) => line.includes(PRgithubUsername) || line.includes("test")
    );

    console.log("lineRemovesUsername", lineRemovesUsername);

    const fileHasCorrectUsernameChange =
      lineAddsUsername || lineRemovesUsername;

    if (files.length === 1 && file) {
      // Get the content of the file in the PR

      if (fileHasCorrectUsernameChange) {
        // Merge the pull request if the condition is met
        try {
          // Merge the pull request
          await octokit.pulls.merge({
            owner,
            repo,
            pull_number: pullRequest.number,
            commit_title: `Automated merge by bot for PR #${pullRequest.number}`,
            commit_message:
              "Auto-merging PR based on conditions met in the array modification.",
            merge_method: "squash", // or 'merge' or 'rebase'
          });

          console.log(`Successfully merged PR #${pullRequest.number}`);
        } catch (error) {
          console.error(`Error merging PR #${pullRequest.number}: ${error}`);
        }
      }
    }
  }
}

// Only run this script if it's executed directly from the command line
if (require.main === module) {
  autoMergePR();
}
