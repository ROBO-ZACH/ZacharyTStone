const { Octokit } = require("@octokit/rest");
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
    base: "main",
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

    const file = files?.find((file) => file?.filename === filePath);

    if (!file) {
      console.log(
        `No changes detected in ${filePath} for PR #${pullRequest.number}.`
      );
      return;
    }

    console.log("file", file);

    const isModified = file?.status === "modified";

    if (!isModified) {
      console.log(
        `No changes detected in ${filePath} for PR #${pullRequest.number}.`
      );
      return;
    }

    console.log("status isModified", isModified);

    const fileHas1Change = file.changes === 1;

    if (!fileHas1Change) {
      console.log(
        `More than one change detected in ${filePath} for PR #${pullRequest.number}.`
      );
      return;
    }

    console.log("fileHas1Change", fileHas1Change);

    const PRgithubUsername = pullRequest.user.login;

    console.log("PRgithubUsername", PRgithubUsername);

    const findNameAddedOrRemoved = file.patch.includes(PRgithubUsername);

    if (!findNameAddedOrRemoved) {
      console.log(
        `The PR github username ${PRgithubUsername} was not found in the file patch.`
      );
      return;
    }

    console.log("findNameAddedOrRemoved", findNameAddedOrRemoved);

    const allLines = file.patch.split("\n");

    console.log("allLines", allLines);

    // main validation

    // PLUS PATH CHECK
    const allLinesWithPlus = allLines.filter((line) => line.includes("+ "));

    console.log("allLinesWithPlus", allLinesWithPlus);

    // Adjust the regex for the plus lines
    const exactUsernamePlusRegex = new RegExp(
      `^\\+\\s*"${PRgithubUsername}"\\s*,?$`
    );

    const validatedLinesWithPlus = allLinesWithPlus.filter((line) => {
      const isMatch = exactUsernamePlusRegex.test(line);
      console.log(`Testing plus line: ${line}, Match: ${isMatch}`);
      return isMatch;
    });

    console.log("validatedLinesWithPlus", validatedLinesWithPlus);

    // MINUS PATH CHECK

    const allLinesWithMinus = allLines.filter((line) => line.includes("- "));

    console.log("allLinesWithMinus", allLinesWithMinus);

    // Adjust the regex to be more flexible with spaces and quote types
    const exactUsernameMinusRegex = new RegExp(
      `^-\\s*"${PRgithubUsername}"\\s*,?$`
    );

    const validatedLinesWithMinus = allLinesWithMinus.filter((line) => {
      const isMatch = exactUsernameMinusRegex.test(line);
      console.log(`Testing line: ${line}, Match: ${isMatch}`);
      return isMatch;
    });

    console.log("validatedLinesWithMinus", validatedLinesWithMinus);

    const fileHasCorrectUsernameChange =
      validatedLinesWithPlus.length === 1 ||
      validatedLinesWithMinus.length === 1;

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
