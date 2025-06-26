const fs = require("fs");
const path = require("path");

function loadFromFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to load file:", err);
    return [];
  }
}

function saveToFile(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    // Sync to secondary volume if it exists
    const secondaryPath =
      process.env.FLY_REGION === "arn"
        ? "/app/data_2/entries.json"
        : "/app/data_1/entries.json";

    if (fs.existsSync(path.dirname(secondaryPath))) {
      fs.writeFileSync(secondaryPath, JSON.stringify(data, null, 2));
    }

    return true;
  } catch (err) {
    console.error("Failed to save file:", err);
    return false;
  }
}

module.exports = {
  loadFromFile,
  saveToFile,
};
