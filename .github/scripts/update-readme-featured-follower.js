const fs = require("fs");
const axios = require("axios");
const readmePath = "./README.md";
require("dotenv").config();
const { execSync } = require("child_process");

// 🌟 Welcome to the Featured Follower Club! 🌟

// This is the list of GitHub usernames we feature.
// Want to join? Follow these easy steps:

// 🚀 How to Add Yourself:

// 1. 🍴 Fork this repo
// 2. 👯 Clone your forked repo
// 3. 🌿 Create a new branch
// 4. 📜 Add your GitHub username to the array below
// 5. 💾 Commit your changes
// 6. 🚀 Push your changes
// 7. 🔄 Create a pull request
// 8. 🕰️ Wait for your pull request to be reviewed and merged
// 9. 🎉 Celebrate! You're officially part of the list!

// ✨ ADD YOUR USERNAME TO THE ARRAY BELOW ⬇️
const PLEASE_FEATURE_ME = ["ROBO-ZACH", "CliffordMorin"];

// ------------------------------ //

// ✋ Please don't touch anything below this line!

// 🎈 That's it! Welcome to the club! 🎈

const FORMATED_PLEASE_FEATURE_ME = PLEASE_FEATURE_ME.map((username) => {
  return username.toLowerCase();
});

const getFeaturedFollower = async () => {
  const myFollowerURL = "https://api.github.com/users/ZacharyTStone/followers";

  try {
    const response = await axios.get(myFollowerURL);
    const followersArray = response.data;

    // filter out any followers that are not in the PLEASE_FEATURE_ME array

    const filteredFollowersArray = followersArray.filter((follower) => {
      console.log("follower", follower, follower?.login?.toLowerCase());
      return FORMATED_PLEASE_FEATURE_ME.includes(
        follower?.login?.toLowerCase()
      );
    });

    console.log("filteredFollowersArray", filteredFollowersArray);

    const randomFollower =
      filteredFollowersArray[
        Math.floor(Math.random() * filteredFollowersArray.length)
      ];

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
        /class='github-img' src=(.*)/,
        `class='github-img' src='${follower.avatar_url}' alt='${follower.login}'/>`
      )
      .replace(
        /#### Checkout out (.*)/,
        `#### Checkout out ${follower.login}! 🎉`
      )
      .replace(
        /##### 💻(.*)/,
        `##### 💻 [${follower.login}'s Github](${follower.html_url})`
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

    // if the user has changed then commit and push the changes

    if (updateReadme === readmeContent) {
      console.log("No changes to the README. Exiting...");
      return;
    }

    // commit the changes
    console.log("Committing updated README...");
    const commitMessage = `Update README with neew featured follower: ${follower.login}`;
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
