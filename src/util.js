const path = require("path");
const fs = require("fs");

function getCachePath() {
  return path.join(
    require.main.filename || process.mainModule.filename,
    ".discordcp.cache"
  );
}

function getEndpoint() {
  return fs.existsSync(path.join(__dirname, "../.prod"))
    ? "http://localhost:3000/"
    : "https://confly.dev/";
}

module.exports = {
  getCachePath,
  getEndpoint,
};
