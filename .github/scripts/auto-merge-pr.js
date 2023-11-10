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

    if (files.length === 1 && file) {
      // Get the content of the file in the PR
      const { data: fileContent } = await octokit.repos.getContent({
        owner,
        repo,
        path: file.filename,
        ref: pullRequest.head.ref, // Use the PR's branch to get the file content
      });

      console.log("fileContent", fileContent);

      // Decode the base64 content and split into lines
      const contentDecoded = Buffer.from(
        fileContent.content,
        "base64"
      ).toString("utf8");

      console.log("contentDecoded", contentDecoded);

      const contentLines = contentDecoded.split("\n");

      /*const PLEASE_FEATURE_ME = [
  "ROBO-ZACH",
  "CliffordMorin",
  "josephjaspers",
  "Zakkku",
  "brandonflores647",
];

*/

      const featureMeLineIndex = contentLines.findIndex((line) =>
        line.includes("const PLEASE_FEATURE_ME = [")
      );

      console.log("featureMeLineIndex", featureMeLineIndex);

      // Perform checks on the line where the array is defined
      if (featureMeLineIndex !== -1) {
        const featureMeLineStart = contentLines[featureMeLineIndex];

        console.log("featureMeLineStart", featureMeLineStart);

        // we need to get the full array text that starts from the first [ and ends at the last ]

        const findFirstEndingBacketAfterFeatureMeLineStart =
          contentDecoded.indexOf("]", featureMeLineStart);

        console.log(
          "findFirstEndingBacketAfterFeatureMeLineStart",
          findFirstEndingBacketAfterFeatureMeLineStart
        );

        const featureMeLine = contentDecoded.substring(
          featureMeLineStart,
          findFirstEndingBacketAfterFeatureMeLineStart
        );

        console.log("featureMeLine", featureMeLine);
        // we need to figure out if
        // 1. the change is a single element being added to the array or removed from the array
        // 2. the added/removed element is the same as the PR author's username

        const oneElementChanged = featureMeLine.includes("]");
        const elementAdded = featureMeLine.includes("+");
        const elementRemoved = featureMeLine.includes("-");
        const elementChanged = elementAdded || elementRemoved;

        console.log("oneElementChanged", oneElementChanged);
        console.log("elementAdded", elementAdded);
        console.log("elementRemoved", elementRemoved);
        console.log("elementChanged", elementChanged);

        const userAddedIsPRAuthor =
          elementAdded && featureMeLine.includes(pullRequest.user.login);

        console.log("userAddedIsPRAuthor", userAddedIsPRAuthor);

        const userRemovedIsPRAuthor =
          elementRemoved && featureMeLine.includes(pullRequest.user.login);

        console.log("userRemovedIsPRAuthor", userRemovedIsPRAuthor);

        const userChangedIsPRAuthor =
          userAddedIsPRAuthor || userRemovedIsPRAuthor;

        console.log("userChangedIsPRAuthor", userChangedIsPRAuthor);

        const ableToMerge =
          oneElementChanged && elementChanged && userChangedIsPRAuthor;

        console.log("ableToMerge", ableToMerge);

        const correctPRBranch = pullRequest.head.ref.includes("feature-me");

        console.log("correctPRBranch", correctPRBranch);

        const ableToMergePR = ableToMerge && correctPRBranch;

        console.log("ableToMergePR", ableToMergePR);

        if (false) {
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
}

// Only run this script if it's executed directly from the command line
if (require.main === module) {
  autoMergePR();
}
