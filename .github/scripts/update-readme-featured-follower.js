const fs = require("fs");
const axios = require("axios");
const readmePath = "./README.md";
require("dotenv").config();
const { execSync } = require("child_process");

const myFollowerURL = "https://api.github.com/users/ZacharyTStone/followers";

const getFeaturedFollower = async () => {
  try {
    const response = await axios.get(myFollowerURL);
    const followersArray = response.data;

    console.log("followersArray", followersArray);

    const randomFollower =
      followersArray[Math.floor(Math.random() * followersArray.length)];

    console.log("randomFollower", randomFollower);
    return randomFollower;
  } catch (error) {
    console.error("Error fetching random follower:", error.message);
    return null;
  }
};

const updateReadme = async () => {
  const follower = await getFeaturedFollower();

  console.log("follower", follower);

  if (follower) {
    console.log("Updating README with new featured follower..");

    const readmeContent = fs.readFileSync(readmePath, "utf-8");

    // Use a regular expression to find and replace the blockquote content
    const updatedReadme = readmeContent
      .replace(
        /<img class='github-img' src=(.*)/,
        `<img class='github-img' src='${follower.avatar_url}' alt='${follower.login}'/>`
      )
      .replace(
        /#### Checkout out my follower/,
        `#### Checkout out my follower ${follower.login}. They must be pretty cool if they follow me!`
      )
      .replace(
        /##### Check out their [Github](.*)/,
        `##### Check out their [Github](${follower.html_url})`
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
    const commitMessage = `Update README with new quote: ${escapedQuote}`;
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