const fs = require("fs/promises");
const axios = require("axios");
const { execSync } = require("child_process");

require("dotenv").config();

const README_PATH = "./README.md";
const ONLY_LOGIN_TO_CHECK = "ZacharyTStone";

const getLatestEvent = async () => {
  const myFollowerURL = "https://api.github.com/users/ZacharyTStone/events";

  try {
    const response = await axios.get(myFollowerURL);
    const latestEvents = response.data;

    // sort the array by created_at date
    const sortedEvents = latestEvents
      .filter((event) => event?.actor?.login === ONLY_LOGIN_TO_CHECK)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const latestEvent = sortedEvents[0];

    console.log("latestEvent", latestEvent);

    return latestEvent;
  } catch (error) {
    console.error("Error fetching latest event:", error.message);
    return null;
  }
};

const updateReadme = async () => {
  const event = await getLatestEvent();

  console.log("event", event);

  if (!event) {
    console.log("Unable to fetch the latest event. Exiting...");
    return;
  }

  console.log("Updating README with the latest event..");

  const repoName = event.repo.name;
  const baseURL = "https://github.com/";
  const isPublic = event["public"];

  if (!isPublic) {
    console.log("Event is not public. Exiting...");
    return;
  }

  // this should be 10/29/2023 format in EST
  const date = new Date(event.created_at).toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    month: "long",
    day: "numeric",
  });

  // this should be 10:00 AM format in eastern time!!
  const time = new Date(event.created_at).toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
  });

  const timeString = `${time} - ${date}  (EST)  🕙`;

  if (!repoName || !time) {
    console.error("Error parsing event data:", event);
    return;
  }

  try {
    const readmeContent = await fs.readFile(README_PATH, "utf-8");

    const updatedReadme = readmeContent.replace(
      /🤖 Zach recently worked on (.*)/,
      `🤖 Zach recently worked on [${repoName}](${baseURL}${repoName}) at ${timeString}`
    );

    console.log("updatedReadme", updatedReadme);

    // if the time hasn't changed then exit
    if (readmeContent.includes(timeString)) {
      console.log("The latest event is already in the README. Exiting...");
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

    // if the README hasn't changed, exit
    if (readmeContent === updatedReadme) {
      console.log("No changes to the README. Exiting...");
      return;
    }

    // commit the changes
    console.log("Committing updated README...");
    const commitMessage = `Update README with new repo activity by Zach on ${repoName} at ${time}`;
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
