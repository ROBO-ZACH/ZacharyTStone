const fs = require("fs/promises");
const axios = require("axios");
const { execSync } = require("child_process");

require("dotenv").config();

const README_PATH = "./README.md";

const getGoogleDocsContent = async () => {
  const URL =
    "https://docs.google.com/document/d/15CbHEE0xWPC0MQzP_xeyhmOvwhzFeGQnGX_E2J3YScs/edit?usp=sharing";

  try {
    const response = await axios.get(URL);
    const html_data = response.data;

    const metaTag = '<meta property="og:description" content="';
    const metaTagIndex = html_data.indexOf(metaTag);

    const contentStartIndex = metaTagIndex + metaTag.length;
    const contentEndIndex = html_data.indexOf('">', contentStartIndex);

    const content = html_data.substring(contentStartIndex, contentEndIndex);

    return content;
  } catch (error) {
    console.error("Error fetching Google Docs content:", error.message);
    return undefined;
  }
};

const updateReadme = async () => {
  const status = await getGoogleDocsContent();

  if (!status) {
    console.log("Unable to fetch status. Exiting...");
    return;
  }

  try {
    const readmeContent = await fs.readFile(README_PATH, "utf-8");

    console.log("Updating README with new status...");

    const updatedReadme = readmeContent.replace(
      /🤖 Zach is(.*)/,
      `🤖 Zach is ${status}`
    );

    console.log("updatedReadme", updatedReadme);
    await fs.writeFile(README_PATH, updatedReadme);

    const gitUserEmail = process.env.GIT_USER_EMAIL;
    const gitUserName = process.env.GIT_USER_NAME;

    if (!gitUserEmail || !gitUserName) {
      console.error(
        "Git user email or name not provided in environment variables."
      );
      return;
    }

    execSync(`git config user.email "${gitUserEmail}"`);
    execSync(`git config user.name "${gitUserName}"`);

    if (readmeContent === updatedReadme) {
      console.log("No changes to commit.");
      return;
    }

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
  } catch (error) {
    console.error("Error updating README:", error.message);
  }
};

updateReadme();
