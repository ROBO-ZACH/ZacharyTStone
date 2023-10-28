const fs = require("fs");
const axios = require("axios");
const readmePath = "./README.md";
require("dotenv").config();
const { execSync } = require("child_process");

const getGoogleDocsContent = async () => {

  const URL =
    "https://docs.google.com/document/d/15CbHEE0xWPC0MQzP_xeyhmOvwhzFeGQnGX_E2J3YScs/edit?usp=sharing";

  let html = undefined;
  try {
    const response = await axios.get(URL);
    const html_data = response.data;
    console.log(html);
    html = html_data;
  } catch (error) {
    console.error("Error fetching random quote:", error.message);
  }

  const metaTag = '<meta property="og:description" content="';
  const metaTagIndex = html.indexOf(metaTag);

  const contentStartIndex = metaTagIndex + metaTag.length;

  const contentEndIndex = html.indexOf('">', contentStartIndex);

  const content = html.substring(contentStartIndex, contentEndIndex);

  return content;
};

const updateReadme = async () => {
  const status = await getGoogleDocsContent();
  console.log("status", status);
  const readmeContent = fs.readFileSync(readmePath, "utf-8");

  if (status) {
    console.log("Updating README with new status...");

    // Use a regular expression to find and replace the blockquote content
    const updatedReadme = readmeContent.replace(
      /🤖 Zach is(.*)/,
      `🤖 Zach is ${status}`
    );

    console.log("updatedReadme", updatedReadme);
    fs.writeFileSync(readmePath, updatedReadme);

    const gitUserEmail = process.env.GIT_USER_EMAIL;
    const gitUserName = process.env.GIT_USER_NAME;

    if (!gitUserEmail || !gitUserName) {
      console.error(
        "Git user email or name not provided in environment variables."
      );
      return;
    }

    execSync(`git config --global user.email "${gitUserEmail}"`);
    execSync(`git config --global user.name "${gitUserName}"`);

    // commit the changes
    console.log("Committing updated README...");
    const commitMessage = `Update README with new status: ${status}`;
    const commitCommand = `git commit -am "${commitMessage}"`;
    const commitOutput = execSync(commitCommand, { stdio: "inherit" });
    console.log(commitOutput);

    // push the changes
    console.log("Pushing updated README...");
    const pushOutput = execSync("git push", { stdio: "inherit" });
    console.log(pushOutput);

    console.log("README update complete!");

    // return the updated readme
    return updatedReadme;
  }
};

updateReadme();
