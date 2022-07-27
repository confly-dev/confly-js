import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function getCachePath() {
  return path.join(
    require.main.filename || process.mainModule.filename,
    ".confly.cache"
  );
}

export function getEndpoint() {
  return fs.existsSync(path.join(__dirname, "../.prod"))
    ? "http://localhost:3000/"
    : "https://confly.dev/";
}
