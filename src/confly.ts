import "dotenv/config";
import { getEndpoint } from "./utils.js";
import axios from "axios";

export async function getConfig(
  token?: string
): Promise<Record<string, unknown>> {
  if (!token) {
    if (process.env.CONFLY_INSTANCE) token = process.env.CONFLY_INSTANCE;
    else throw new Error("No confly token provided for getConfig");
  }

  const res = await axios.get(
    `${getEndpoint()}api/v1/config.json?token=${encodeURIComponent(token)}`
  );

  switch (res.status) {
    case 404:
      throw new Error("Confly instance not found");
    case 401:
      throw new Error("Invalid confly token");
  }

  return res.data.values;
}
