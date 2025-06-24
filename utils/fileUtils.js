const fs = require("fs");

function loadFromFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
}

function saveToFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = {
  loadFromFile,
  saveToFile,
};
