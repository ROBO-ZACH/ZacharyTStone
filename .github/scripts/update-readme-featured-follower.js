const fs = require("fs/promises");
const axios = require("axios");
const { execSync } = require("child_process");

require("dotenv").config();

// Environment Variables
const GITHUB_API_URL = "https://api.github.com/users/ZacharyTStone/followers";
const GITHUB_BASE_URL = "https://github.com/";
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
  "CliffordMorin",
  "josephjaspers",
  "Zakkku",
  "brandonflores647",
  "ROBO-ZACH"
];

// ------------------------------ //

// ✋ Please don't touch anything below this line!

// 🎈 That's it! Welcome to the club! 🎈

const FORMATTED_PLEASE_FEATURE_ME = PLEASE_FEATURE_ME.map((username) =>
  username.toLowerCase()
);

const getApiResponse = async (url) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error.message);
    return null;
  }
};

const getFeaturedFollower = async () => {
  const followers = await getApiResponse(GITHUB_API_URL);
  if (!followers || !Array.isArray(followers)) {
    console.log("Unable to fetch followers. Exiting...");
    return null;
  }

  const filteredFollowers = followers.filter((follower) =>
    FORMATTED_PLEASE_FEATURE_ME.includes(follower.login.toLowerCase())
  );

  return filteredFollowers.length > 0
    ? filteredFollowers[Math.floor(Math.random() * filteredFollowers.length)]
    : null;
};

const getFollowerDetails = async (follower) => {
  if (!follower || !follower.url) return null;
  return await getApiResponse(follower.url);
};

const updateReadmeContent = async (follower) => {
  if (!follower) {
    console.log("Unable to fetch a featured follower. Exiting...");
    return;
  }

  const followerDetails = await getFollowerDetails(follower);
  const followerName = followerDetails?.name || follower.login;

  const readmeContent = await fs.readFile(README_PATH, "utf-8");

  const updatedReadme = readmeContent
    .replace(
      /#### 💻 Checkout out (.*)/,
      `#### 💻 Checkout out [${followerName}](${follower.html_url})! 🎉`
    )
    .replace(
      /###### 👤 (.*)/,
      `###### 👤 [Github](${GITHUB_BASE_URL}${follower.login}) `
    )
    .replace(
      /class="github-bio-img" src="(.*)"/,
      `class="github-bio-img" src="${follower.avatar_url}"`
    );

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
  return follower;
};

const commitChanges = (followerName) => {
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

  const commitMessage = `Update README with new featured follower: ${followerName}`;
  execSync(`git commit -am "${commitMessage}"`, { stdio: "inherit" });
  execSync("git push", { stdio: "inherit" });

  console.log("README update complete!");
};

const updateReadme = async () => {
  const newFollower = await updateReadmeContent(await getFeaturedFollower());

  if (newFollower) {
    commitChanges(newFollower.login);
  }
};

updateReadme();
