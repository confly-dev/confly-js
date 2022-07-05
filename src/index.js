require("dotenv").config();
const fs = require("fs");
const getEndpoint = require("./endpoint");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const chalk = require("chalk");
const { getConfigPath, getCachePath } = require("./integrationPaths");

async function getConfig(instance, token) {
  return new Promise(async (resolve, reject) => {
    const configPath = getConfigPath();

    if (!token) {
      token = process.env.confly_token;
      if (!token) reject("No confly token provided");
    }

    if (!instance) {
      instance = process.env.confly_instance;
      if (!instance) reject("No confly instance id provided");
    }
    const endpoint = `${getEndpoint()}api/${instance}/values.json`;
    const headers = {
      authentication: `Bearer ${token}`,
    };

    let req;

    try {
      req = await fetch(endpoint, { method: "GET", headers: headers });
    } catch (e) {
      req = {
        status: e,
      };
    }

    if (req.status !== 200) {
      if (req.status == 404) {
        console.error(chalk.red("Invalid confly token"));
        reject("Invalid confly token");
      } else {
        if (fs.existsSync(getCachePath())) {
          console.error(
            chalk.red(`Failed to fetch config, using cache. (${req.status})`)
          );

          const cache = JSON.parse(fs.readFileSync(getCachePath()));

          resolve(cache);
        } else {
          reject(
            "Fetch failed and no cache found. " +
              req.status +
              ": " +
              (await req.text())
          );
        }
      }
    } else {
      const res = await req.json();

      fs.writeFile(
        getCachePath(),
        JSON.stringify({
          ...res,
          _meta: {
            lastUpdated: new Date().toISOString(),
            timestamp: Date.now(),
          },
        }),
        () => {}
      );

      resolve(res);
    }
  });
}

module.exports = {
  getConfig,
};
