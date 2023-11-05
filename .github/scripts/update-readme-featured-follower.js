const fs = require("fs/promises");
const axios = require("axios");
const { execSync } = require("child_process");

require("dotenv").config();

const README_PATH = "./README.md";

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
const PLEASE_FEATURE_ME = [
  "ROBO-ZACH",
  "CliffordMorin",
  "josephjaspers",
  "Zakkku",
];

// ------------------------------ //

// ✋ Please don't touch anything below this line!

// 🎈 That's it! Welcome to the club! 🎈

const FORMATTED_PLEASE_FEATURE_ME = PLEASE_FEATURE_ME.map((username) =>
  username.toLowerCase()
);

const getFeaturedFollower = async () => {
  const myFollowerURL = "https://api.github.com/users/ZacharyTStone/followers";

  try {
    const response = await axios.get(myFollowerURL);
    const followersArray = response.data;

    // filter out any followers that are not in the PLEASE_FEATURE_ME array
    const filteredFollowersArray = followersArray.filter((follower) =>
      FORMATTED_PLEASE_FEATURE_ME.includes(follower?.login?.toLowerCase())
    );

    const randomFollower =
      filteredFollowersArray[
        Math.floor(Math.random() * filteredFollowersArray.length)
      ];

    return randomFollower;
  } catch (error) {
    console.error("Error fetching random follower:", error.message);
    return null;
  }
};

const getFeaturedFollowerDetails = async (follower) => {
  const URL = follower["url"];

  try {
    const response = await axios.get(URL);
    const followerDetails = response.data;
    return followerDetails;
  } catch (error) {
    console.error("Error fetching random follower's details:", error.message);
    return null;
  }
};

const updateReadme = async () => {
  const follower = await getFeaturedFollower();

  if (!follower || !follower["url"]) {
    console.log("Unable to fetch a featured follower details. Exiting...");
    return;
  }

  const followerDetails = await getFeaturedFollowerDetails(follower);

  const followerName = followerDetails?.name || follower.login;

  // not currently used

  const followerBio = followerDetails?.bio || "";

  const followerBlog = followerDetails?.blog || "";

  if (!follower) {
    console.log("Unable to fetch a featured follower. Exiting...");
    return;
  }

  console.log("Updating README with a new featured follower..");

  const readmeContent = await fs.readFile(README_PATH, "utf-8");

  // Use a regular expression to find and replace the blockquote content
  const updatedReadme = readmeContent
    .replace(
      /#### 💻 Checkout out (.*)/,
      `#### 💻 Checkout out [${followerName}](${follower.html_url})! 🎉`
    )
    .replace(
      /###### 👤 (.*)/,
      `###### 👤 [Github](https://github.com/${follower.login}) `
    )
    .replace(
      /class="github-bio-img" src="(.*)"/,
      `class="github-bio-img" src="${follower.avatar_url}"`
    );

  // if the user has changed, commit and push the changes
  if (
    readmeContent === updatedReadme ||
    readmeContent.includes(follower.login) ||
    readmeContent.includes(follower.login.toLowerCase()) ||
    readmeContent.includes(follower.avatar_url)
  ) {
    console.log("No changes to the README. Exiting...");
    return;
  }

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

  // commit the changes
  console.log("Committing updated README...");
  const commitMessage = `Update README with new featured follower: ${follower.login}`;
  const commitCommand = `git commit -am "${commitMessage}"`;
  const commitOutput = execSync(commitCommand, { stdio: "inherit" });

  // push the changes
  console.log("Pushing updated README...");
  const pushOutput = execSync("git push", { stdio: "inherit" });

  console.log("README update complete!");

  // return the updated readme
  return updatedReadme;
};

updateReadme();
