const fs = require("fs");
const axios = require("axios");
const readmePath = "./README.md";

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

const updateReadme = async () => {
  const quote = await getRandomQuote();

  console.log("quote", quote);
  if (quote) {
    console.log("Updating README with new quote...");
    const currentDateTime = getCurrentDateTime();
    const readmeContent = fs.readFileSync(readmePath, "utf-8");

    // Use a regular expression to find and replace the blockquote content
    const updatedReadme = readmeContent
      .replace(
        /<blockquote>(.|\n)*<\/blockquote>/,
        `<blockquote>\n  ${quote}\n</blockquote>`
      )
      .replace(
        /auto-magically updated at: (.*)/,
        `auto-magically updated at: ${currentDateTime} </h5`
      );

    console.log("updatedReadme", updatedReadme);
    fs.writeFileSync(readmePath, updatedReadme);

    // commit the changes
    console.log("Committing updated README...");
    const commitMessage = `Update README with new quote: ${quote}`;
    const commitCommand = `git commit -am "${commitMessage}"`;
    const commitOutput = exec(commitCommand);
    console.log(commitOutput);

    // push the changes
    console.log("Pushing updated README...");
    const pushOutput = exec("git push");
    console.log(pushOutput);

    console.log("README update complete!");

    // return the updated readme
    return updatedReadme;
  }
};

updateReadme();
