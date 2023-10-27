const fs = require("fs");
const axios = require("axios");
const readmePath = "../../README.md"

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
  if (quote) {
    const currentDateTime = getCurrentDateTime();
    const readmeContent = fs.readFileSync(readmePath, "utf-8");
    const updatedReadme = readmeContent
      .replace(/"(.|\n)*"— (.*)/, `"${quote}"`)
      .replace(
        /auto-magically updated at: (.*)/,
        `auto-magically updated at: ${currentDateTime}`
      );
    fs.writeFileSync(readmePath, updatedReadme);
  }
};

updateReadme();
