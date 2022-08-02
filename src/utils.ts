import path from "path";
import fs from "fs";

export function getCachePath() {
  return path.join(process.cwd(), ".confly.cache");
}

export function getEndpoint() {
  console.log(path.join(process.cwd(), "/.dev"));
  return fs.existsSync(path.join(process.cwd(), "/.dev"))
    ? "http://localhost:3000/"
    : "https://confly.dev/";
}
