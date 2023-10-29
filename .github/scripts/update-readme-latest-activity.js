const fs = require("fs");
const axios = require("axios");
const readmePath = "./README.md";
require("dotenv").config();
const { execSync } = require("child_process");

const ONLY_LOGIN_TO_CHECK = "ZacharyTStone";

const getLatestEvent = async () => {
  const myFollowerURL = "https://api.github.com/users/ZacharyTStone/events";

  try {
    const response = await axios.get(myFollowerURL);
    const LatestEvents = response.data;

    // sort the array by created_at date

    const sortedEvents = LatestEvents.sort((a, b) => {
      if (a.created_at && b.created_at) {
        return new Date(b.created_at) - new Date(a.created_at);
      }
    }).filter((event) => {
      return event?.actor?.login === ONLY_LOGIN_TO_CHECK;
    });

    const LatestEvent = sortedEvents[0];

    console.log("LatestEvent", LatestEvent);

    return LatestEvent;
  } catch (error) {
    console.error("Error fetching latest event:", error.message);
    return null;
  }
};

const updateReadme = async () => {
  const event = await getLatestEvent();

  console.log("event", event);

  if (event) {
    console.log("Updating README with latest event..");

    const repoName = event.repo.name;
    const repoURL = event.repo.url;

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

    if (!repoName || !repoURL || !time) {
      console.error("Error parsing event data:", event);
      return;
    }

    const readmeContent = fs.readFileSync(readmePath, "utf-8");

    const updatedReadme = readmeContent.replace(
      /🤖 Zach recently worked on (.*)/,
      `🤖 Zach recently worked on [${repoName}](${repoURL}) at ${timeString}`
    );

    console.log("updatedReadme", updatedReadme);

    // if the time hasn't changed then exit
    if (readmeContent.includes(timeString)) {
      console.log("latest event already in README. Exiting...");
      return;
    }

    fs.writeFileSync(readmePath, updatedReadme);

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

    // if the user has changed then commit and push the changes

    if (updateReadme === readmeContent) {
      console.log("No changes to the README. Exiting...");
      return;
    }

    // commit the changes
    console.log("Committing updated README...");
    const commitMessage = `Update README with new repo activity by zach on ${repoName} at ${time}`;
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
