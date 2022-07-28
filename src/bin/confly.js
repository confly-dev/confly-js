#!/usr/bin/env node

import fs from "fs";
import path from "path";
import chalk from "chalk";
import inquirer from "inquirer";
import fetch from "node-fetch";
import userSettings from "user-settings";
import { FormData } from "formdata-node";
import { getEndpoint } from "../utils.js";

const settings = userSettings.file(".confly");

(async () => {
  console.log(path.resolve());

  const endPoint = getEndpoint();

  const configPath = path.join(process.cwd(), "confly.structure.json");

  const args = process.argv.slice(2, process.argv.length);

  if (args.length == 0) {
    console.log(
      chalk.redBright("Please specify a sub command. ") +
        chalk.yellow("confly help")
    );
    process.exit(0);
  }

  if (args[0].toLowerCase() == "help") {
    console.log(chalk.green.bold("Confly Help"));
    console.log(`
confly <command>

Usage:

confly init     - create a new confly project or use an existing one
confly push     - push local structure to server
confly pull     - update local structure from server
confly login    - login with username and password
confly logout   - forget token created by login
confly version  - show the version of confly
`);
  } else if (args[0].toLowerCase() == "init") {
    if (!settings.get("token")) {
      console.log(
        chalk.yellow("Not logged in. Please use 'npx confly login' to login.")
      );
      process.exit(0);
    }
    if (fs.existsSync(configPath)) {
      console.log(chalk.yellow("confly.structure.json already exists."));
      process.exit(0);
    }

    inquirer
      .prompt([
        {
          type: "list",
          name: "createNew",
          message: "Do you want to create a new project?",
          choices: ["Yes", "Use existing"],
        },
      ])
      .then((answers) => {
        if (answers.createNew == "Yes") {
          inquirer
            .prompt([
              {
                name: "projectName",
                message: "Please enter a project name: ",
              },
            ])
            .then(async (answers) => {
              const form = new FormData();
              form.set("name", answers.projectName);
              let res = await fetch(`${getEndpoint()}api/projects`, {
                method: "POST",
                headers: {
                  authorization: `Bearer ${settings.get("token")}`,
                },
                body: form,
              }).then((res) => res.json());
              if (res.status == 200) {
                console.log(res);
                settings.set("project", res.project.id);
                console.log(chalk.green.bold("Created new confly project"));
                createConfig(configPath);
              } else {
                console.log(
                  chalk.redBright(
                    `${res.status} Failed to create new confly project: ${res.message}`
                  )
                );
                process.exit(0);
              }
            });
        } else {
          inquirer
            .prompt([
              {
                name: "projectId",
                message: "Please enter an existing project id: ",
              },
            ])
            .then(async (answers) => {
              const res = await fetch(
                `${getEndpoint()}api/projects?projectId=${answers.projectId}`,
                {
                  method: "GET",
                  headers: {
                    authorization: `Bearer ${settings.get("token")}`,
                  },
                }
              ).then((res) => res.json());
              if (res.status == 200) {
                settings.set("project", answers.projectId);
                console.log(
                  chalk.green.bold("Confirmed existing confly project")
                );
                createConfig(configPath);
              } else
                console.log(chalk.redBright(`${res.status}: ${res.message}`));
            });
        }
      });
  } else if (args[0].toLowerCase() == "push") {
    if (!settings.get("token")) {
      console.log("Not logged in. Please use 'npx confly login' to login.");
      process.exit(0);
    }
    if (!fs.existsSync(configPath) || !settings.get("project")) {
      console.log(chalk.red("Project not found. Use 'npx confly init' first."));
      process.exit(0);
    }

    const { structure } = JSON.parse(fs.readFileSync(configPath));

    const res = await fetch(
      `${endPoint}api/projects/${settings.get("project")}/structure`,
      {
        method: "POST",
        body: JSON.stringify(structure),
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${settings.get("token")}`,
        },
      }
    ).then((res) => res.json());

    if (res.status == 200)
      console.log(chalk.green.bold("Structure pushed to server"));
    else console.log(chalk.redBright(`${res.status}: ${res.message}`));
  } else if (args[0].toLowerCase() == "pull") {
    if (!settings.get("token")) {
      console.log(
        chalk.yellow("Not logged in. Please use 'npx confly login' to login.")
      );
      process.exit(0);
    }
    if (!fs.existsSync(configPath) || !settings.get("project")) {
      console.log(chalk.red("Project not found. Use 'npx confly init' first."));
      process.exit(0);
    }

    const res = await fetch(
      `${endPoint}api/projects/${settings.get("project")}/structure`,
      {
        method: "GET",
        headers: {
          authorization: `Bearer ${settings.get("token")}`,
        },
      }
    ).then((res) => res.json());

    if (res.status == 200) {
      fs.writeFileSync(
        configPath,
        JSON.stringify({ structure: res.structure })
      );
      console.log(chalk.green.bold("Structure pulled from server"));
    } else console.log(chalk.redBright(`${res.status}: ${res.message}`));
  } else if (args[0].toLowerCase() == "login") {
    if (settings.get("token")) {
      console.log(chalk.red("Already logged in"));
      process.exit(0);
    }
    inquirer
      .prompt([
        {
          name: "identifier",
          message: "Enter your email or username: ",
        },
        {
          type: "password",
          name: "password",
          message: "Enter your password: ",
        },
      ])
      .then(async (answers) => {
        const form = new FormData();
        form.set("identifier", answers.identifier);
        form.set("password", answers.password);

        const res = await fetch(`${endPoint}api/auth`, {
          method: "POST",
          body: form,
        }).then((res) => res.json());

        if (res.status == 200) {
          settings.set("token", res.token.token);
          console.log(chalk.green.bold("Logged in successfully"));
        } else console.log(chalk.redBright(`${res.status}: ${res.message}`));
      });
  } else if (args[0].toLowerCase() == "logout") {
    settings.unset("token");
    console.log(chalk.green("You are logged out."));
  } else if (args[0].toLowerCase() == "version") {
    var json = JSON.parse(fs.readFileSync("./package.json").toString());
    console.log(
      "Confly v" + chalk.green(json.version) + " using " + getEndpoint()
    );
  } else {
    console.log(
      chalk.red("Unknown command. Use 'npx confly help' to see all commands.")
    );
  }
})();

function createConfig(configPath) {
  const gitignorePath = path.join(process.cwd(), ".gitignore");

  //TODO: fix structure
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      structure: {
        general: {},
      },
    })
  );

  const gitignoreAppendix = "\n# confly.dev cache\n.confly.cache";

  if (fs.existsSync(gitignorePath)) {
    fs.appendFileSync(gitignorePath, gitignoreAppendix);
  } else {
    fs.writeFileSync(gitignorePath, gitignoreAppendix);
  }

  console.log(
    chalk.green(
      "confly.structure.json created. Use " +
        chalk.yellow.bold("npx confly push") +
        " to update."
    )
  );
}
