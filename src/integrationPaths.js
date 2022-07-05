const path = require("path");

function getRootPath() {
  return path.dirname(require.main.filename || process.mainModule.filename);
}

function getConfigPath() {
  return path.join(getRootPath(), "discord.config.json");
}

function getCachePath() {
  return path.join(getRootPath(), ".discordcp.cache");
}

module.exports = {
  getRootPath,
  getConfigPath,
  getCachePath,
};
