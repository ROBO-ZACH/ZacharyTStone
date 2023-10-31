const fs = require("fs/promises");
const axios = require("axios");
const { execSync } = require("child_process");

require("dotenv").config();

const README_PATH = "./README.md";

const getRandomPokemon = async () => {
  const randomId = Math.floor(Math.random() * 1000) + 1;

  try {
    const response = await axios.get(
      `https://pokeapi.co/api/v2/pokemon/${randomId}`
    );
    const pokemon = response.data;

    return {
      name: pokemon.name,
      image:
        pokemon.sprites.other.dream_world.front_default ||
        pokemon.sprites.front_default ||
        pokemon.sprites.back_default ||
        pokemon.sprites.front_shiny ||
        pokemon.sprites.back_shiny,
    };
  } catch (error) {
    console.error("Error fetching random pokemon:", error.message);
    return null;
  }
};

const updateReadme = async () => {
  const pokemon = await getRandomPokemon();

  if (!pokemon) {
    console.log("Unable to fetch a random Pokemon. Exiting...");
    return;
  }

  const readmeContent = await fs.readFile(README_PATH, "utf-8");

  if (pokemon.image && pokemon.name) {
    console.log("Updating README with new pokemon...");

    const updatedReadme = readmeContent
      // replace the image
      .replace(
        /<img width="50%" class='poke-img' src=(.*)/,
        `<img width="50%" class='poke-img' src='${pokemon.image}' alt='${pokemon.name}'/>`
      )
      // replace the name
      .replace(/Pokemon Name :(.*)/, `Pokemon Name : ${pokemon.name}</span>`);


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
    const commitMessage = `Update README with new pokemon: ${pokemon.name}`;
    const commitCommand = `git commit -am "${commitMessage}"`;
    const commitOutput = execSync(commitCommand, { stdio: "inherit" });

    // push the changes
    console.log("Pushing updated README...");
    const pushOutput = execSync("git push", { stdio: "inherit" });

    console.log("README update complete!");

    // return the updated readme
    return updatedReadme;
  }
};

updateReadme();
