const fs = require("fs");
const path = require("path");

function getEndpoint() {
  return fs.existsSync(path.join(__dirname, "../.prod"))
    ? "http://localhost:3000/"
    : "https://confly.dev/";
}

module.exports = getEndpoint;
