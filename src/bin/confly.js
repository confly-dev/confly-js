#!/usr/bin/env node

import fs from "fs";
import path from "path";
import chalk from "chalk";
import inquirer from "inquirer";
import fetch from "node-fetch";
import userSettings from "user-settings";
import FormData from "form-data";
import { getEndpoint } from "../utils.js";

const settings = userSettings.file(".confly");

(async () => {
  console.log(path.resolve());

  const cwd = process.cwd();

  const endPoint = getEndpoint();

  const configPath = path.join(cwd, "confly.config.json");
  const gitignorePath = path.join(cwd, ".gitignore");

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
    console.log(
      chalk.yellow("confly init") +
        chalk.redBright("- Create a new confly project or use an existing one")
    );
    console.log(
      chalk.yellow("confly push ") +
        chalk.redBright("- Push local structure to server.")
    );
    console.log(
      chalk.yellow("confly pull ") +
        chalk.redBright("- Update local structure from server.")
    );
    console.log(
      chalk.yellow("confly login") +
        chalk.redBright("- Login with username and password")
    );
    console.log(
      chalk.yellow("confly logout") +
        chalk.redBright("- Forget token created by login")
    );
  } else if (args[0].toLowerCase() == "init") {
    if (fs.existsSync(configPath)) {
      console.log("confly.structure.json already exists.");
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
          }
          ])
          .then((answers) => {
            const form = new FormData();
            form.append("identifier", answers.projectName);
            const res = await fetch(
              `${getEndpoint()}api/projects`, 
              { 
                method: "POST", 
                headers: {
                  authorization: `Bearer ${token}`,
                },
                body: form,
            });
            if (res.status == 200) {
              settings.set("project", login_res.token);
              createConfig();
              console.log(chalk.green.bold("Created new confly project"));
            }
            else {
              console.log(chalk.redBright(`${res.status} Failed to create new confly project: ${res.message}`));
              process.exit(0);
            }
          });
      }
      else {
        inquirer
          .prompt([
            {         
            name: "projectId",
            message: "Please enter an existing project id: ",
          }
          ])
          .then((answers) => {
            const req = await fetch(
              `${getEndpoint()}api/projects?projectId=${answers.projectId}`, 
              { 
                method: "GET", 
                headers: {
                  authorization: `Bearer ${token}`,
                },
            });
          });
          if (req.status == 200) {
            settings.set("project", answers.projectId);
            createConfig();
            console.log(chalk.green.bold("Confirmed existing confly project"));
          }
          else {
            console.log(chalk.redBright(`${req.status}: ${req.message}`));
            process.exit(0);
          }
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

    const res = await fetch(`${endPoint}api/${settings.get("project")}/structure`, {
      method: "POST",
      body: JSON.stringify(structure),
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${settings.get("token")}`,
      },
    });

    if (res.status == 200) {
      console.log(chalk.green("Config structure updated successfully."));
    } else {
      console.log(chalk.redBright(`${res.status}: ${res.message}`));

    }
  } else if (args[0].toLowerCase() == "login") {
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
        form.append("identifier", answers.identifier);
        form.append("password", answers.password);
        const login_res = await fetch(`${endPoint}api/auth`, {
          method: "POST",
          body: form,
        });

        if (login_res.status == 200) {
          settings.set("token", login_res.token);
          console.log(chalk.green("You are logged in."));
        } else {
          console.log(login_res);
        }
      });
  } else if (args[0].toLowerCase() == "logout") {
    settings.unset("token");
    console.log(chalk.green("You are logged out."));
  } else if (args[0].toLowerCase() == "version") {
    console.log(
      "Confly v" +
        chalk.green(require("../../package.json").version) +
        " using " +
        getEndpoint()
    );
  } else {
    console.log(
      chalk.red("Unknown command. Use 'npx confly help' to see all commands.")
    );
  }
})();

function createConfig() {
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
