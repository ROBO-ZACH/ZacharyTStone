const fs = require("fs");
const axios = require("axios");
const readmePath = "./README.md";
require("dotenv").config();
const { execSync } = require("child_process");

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
    hour: "2-digit",
    minute: "2-digit",
  });
};

const updateReadme = async () => {
  const quote = await getRandomQuote();

  console.log("quote", quote);
  if (quote) {
    console.log("Updating README with new quote...");
    const currentDateTime = getCurrentDateTime();
    const currentDateTimeInEST = convertDateTimeToEST(currentDateTime);
    const readmeContent = fs.readFileSync(readmePath, "utf-8");

    // Escape special characters in the quote for the commit message
    const escapedQuote = quote.replace(/"/g, '\\"').replace(/\n/g, " ");

    // Use a regular expression to find and replace the blockquote content
    const updatedReadme = readmeContent
      .replace(
        /<blockquote>(.|\n)*<\/blockquote>/,
        `<blockquote>\n  ${quote}\n</blockquote>`
      )
      .replace(
        /This readme was last auto-magically updated by ROBO_ZACH at (.*)/,
        `This readme was last auto-magically updated by ROBO_ZACH at ${currentDateTimeInEST} EST 🪄 </h1>`
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
