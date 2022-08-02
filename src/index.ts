import "dotenv/config";
import fs from "fs";
import chalk from "chalk";
import { getCachePath, getEndpoint } from "./utils.js";
import fetch, { Headers } from "node-fetch";

interface Response {
  success: boolean;
  status: number;
  message: string;
  error: string;
  headers: Headers;
  values: any;
}

export async function getConfig(
  instance: string | undefined,
  token: string | undefined
) {
  return new Promise(async (resolve, reject) => {
    if (!token) {
      if (process.env.confly_token) token = process.env.confly_token;
      else reject("No confly token provided");
    }

    if (!instance) {
      if (process.env.confly_instance) instance = process.env.confly_instance;
      else reject("No confly instance id provided");
    }

    const res: Response = (await fetch(
      `${getEndpoint()}api/instance/${instance}/values.json`,
      {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    ).then((res) => res.json())) as Response;

    if (res.status !== 200) {
      if (res.status == 404) {
        console.error(chalk.red("Invalid confly token"));
        reject("Invalid confly token");
      } else {
        if (fs.existsSync(getCachePath())) {
          console.error(
            chalk.red(`Failed to fetch config, using cache. (${res.status})`)
          );

          const cache = JSON.parse(fs.readFileSync(getCachePath()).toString());

          resolve(cache);
        } else {
          reject(
            "Fetch failed and no cache found. " +
              res.status +
              ": " +
              (await res.message)
          );
        }
      }
    } else {
      fs.writeFile(
        getCachePath(),
        JSON.stringify({
          ...res.values,
          _meta: {
            lastUpdated: new Date().toISOString(),
            timestamp: Date.now(),
          },
        }),
        () => {}
      );
      resolve(res.values);
    }
  });
}
