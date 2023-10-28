const fs = require("fs");
const axios = require("axios");
const readmePath = "./README.md";
require("dotenv").config();
const { execSync } = require("child_process");
const puppeteer = require("puppeteer");

const twitClassForIndividualTweet = 'data-testid="tweetText"';

const getLatestTweet = async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const username = "taco_cat99wow";
    const twitterUrl = `https://twitter.com/${username}`;

    await page.goto(twitterUrl, { waitUntil: "networkidle2" });

    // Wait for the tweet element to be rendered
    await page.waitForSelector(`[${twitClassForIndividualTweet}]`);

    // Get the text content of the first tweet
    const latestTweet = await page.$eval(
      `[${twitClassForIndividualTweet}]`,
      (tweetElement) => tweetElement.textContent
    );

    await browser.close();

    return latestTweet.trim();
  } catch (error) {
    console.error("Error fetching latest tweet:", error);
    return null;
  }
};

const updateReadme = async () => {
  const latestTweet = await getLatestTweet();

  console.log("latestTweet post function", latestTweet);

  if (latestTweet) {
    console.log("Updating README with new tweet...");

    // Use a regular expression to find and replace the blockquote content
    const updatedReadme = readmeContent.replace(
      /is currently/,
      `is currently ${latestTweet}`
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
    const commitMessage = `Update README with new status: ${latestTweet}`;
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
