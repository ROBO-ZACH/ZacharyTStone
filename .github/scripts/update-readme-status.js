const fs = require("fs");
const axios = require("axios");
const readmePath = "./README.md";
require("dotenv").config();
const { execSync } = require("child_process");
const Twit = require("twit");

const getLatestTweet = async () => {
  // Replace these with your own credentials
  const T = await new Twit({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  });

  const params = {
    screen_name: "taco_cat99wow",
    count: 1,
  };

  let latestTweet = null;

  return new Promise((resolve, reject) => {
    T.get("statuses/user_timeline", params, (err, data, response) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        console.log("data", data);
        const latestTweet = data[0].text;
        console.log("latestTweet", latestTweet);
        resolve(latestTweet);
      }
    });
  });
};

const updateReadme = async () => {
  const latestTweet = await getLatestTweet();

  console.log("latestTweet post function", latestTweet);

  if (latestTweet) {
    console.log("Updating README with new tweet...");

    // Use a regular expression to find and replace the blockquote content
    const updatedReadme = readmeContent.replace(
      /is currently/,
      `is currently ${quote}`
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
