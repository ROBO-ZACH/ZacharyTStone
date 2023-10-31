const fs = require("fs/promises");
const axios = require("axios");
const { execSync } = require("child_process");

require("dotenv").config();

const README_PATH = "./README.md";

const getCurrentDateTime = () => {
  const now = new Date();
  return `${now.toDateString()} ${now.toLocaleTimeString()}`;
};

const getRandomQuote = async () => {
  try {
    const response = await axios.get("https://api.quotable.io/random");
    const quote = response.data;
    return `"${quote.content}"\n<br>— ${quote.author}`;
  } catch (error) {
    console.error("Error fetching random quote:", error.message);
    return null;
  }
};

const convertDateTimeToEST = (dateTime) => {
  const date = new Date(dateTime);
  const utcDate = new Date(date.toUTCString());
  utcDate.setHours(utcDate.getHours() - 4);
  const usDate = new Date(utcDate);

  // return time without seconds
  return usDate.toLocaleTimeString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const updateReadme = async () => {
  execSync("git pull", { stdio: "inherit" });

  const quote = await getRandomQuote();

  if (!quote) {
    console.log("Unable to fetch a quote. Exiting...");
    return;
  }

  console.log("Updating README with new quote...");
  const currentDateTime = getCurrentDateTime();
  const currentDateTimeInEST = convertDateTimeToEST(currentDateTime);

  try {
    const readmeContent = await fs.readFile(README_PATH, "utf-8");

    // Escape special characters in the quote for the commit message
    const escapedQuote = quote.replace(/"/g, '\\"').replace(/\n/g, " ");

    // Use a regular expression to find and replace the blockquote content
    const updatedReadme = readmeContent
      .replace(
        /<blockquote>(.|\n)*<\/blockquote>/,
        `<blockquote>\n  ${quote}\n</blockquote>`
      )
      .replace(/🤖 on (.*)/, `🤖 on ${currentDateTimeInEST} EST </a></h2>`);

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
    const commitMessage = `Update README with new quote: ${escapedQuote}`;
    const commitCommand = `git commit -am "${commitMessage}"`;
    const commitOutput = execSync(commitCommand, { stdio: "inherit" });
  

    // push the changes
    console.log("Pushing updated README...");
    const pushOutput = execSync("git push", { stdio: "inherit" });


    console.log("README update complete!");

    // return the updated readme
    return updatedReadme;
  } catch (error) {
    console.error("Error updating README:", error.message);
  }
};

updateReadme();
