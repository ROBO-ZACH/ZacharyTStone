const fs = require("fs");
const axios = require("axios");
const readmePath = "./README.md";
require("dotenv").config();
const { execSync } = require("child_process");

/*   fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
  .then(response => response.json())
  .then(function(data){
    let nombre = data.name;
    let url = data.sprites.other.dream_world.front_default;
    */

const getRandomPokemon = async () => {
  const randomId = Math.floor(Math.random() * 1000) + 1;
  try {
    const response = await axios.get(
      "https://pokeapi.co/api/v2/pokemon/" + randomId
    );
    const pokemon = response.data;
    return {
      name: pokemon.name,
      image: pokemon.sprites.other.dream_world.front_default,
    };
  } catch (error) {
    console.error("Error fetching random pokemon:", error.message);
    return null;
  }
};

const updateReadme = async () => {
  const pokemon = await getRandomPokemon();

  console.log("pokemon", pokemon);
  if (pokemon) {
    const readmeContent = fs.readFileSync(readmePath, "utf-8");

    const updatedReadme = readmeContent
      // replace the image
      .replace(
        /<img class='poke-img' (.*)/,
        `<img class='poke-img' src='${pokemon.image}' alt='${pokemon.name}'></img>`
      )
      // replace the name
      .replace(
        /<h5 class='poke-name' (.*)/,
        `<h5 class='poke-name'>${pokemon.name}</h5>`
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
    const commitMessage = `Update README with new pokemon: ${pokemon.name}`;
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
