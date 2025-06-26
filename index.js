require("dotenv").config({
  path:
    process.env.NODE_ENV === "production"
      ? ".env.production"
      : ".env.development",
});

const express = require("express");
const cors = require("cors");
const habitsRouter = require("./routes/habits");
const entriesRouter = require("./routes/entries");
const statsRouter = require("./routes/stats");
const path = require("path");
const fs = require("fs");

// Add this line to verify env loading
console.log("API Key loaded:", process.env.API_KEY ? "Yes" : "No");

const app = express();
const PORT = process.env.PORT || 8080;

const allowedOrigins = [
  "http://localhost:5173",
  "https://habits.olavelnan.no",
  "https://habit-api.fly.dev",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize entries.json if it doesn't exist
const entriesPath = path.join(dataDir, "entries.json");
if (!fs.existsSync(entriesPath)) {
  fs.writeFileSync(entriesPath, "[]", "utf8");
}

// Add a root route to verify API is running
app.get("/", (req, res) => {
  res.json({ status: "API is running" });
});

// Add health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/habits", habitsRouter);
app.use("/api/entries", entriesRouter);
app.use("/api/stats", statsRouter);

// Add error handling
app.use((err, req, res, next) => {
  res.status(500).json({ error: "Internal Server Error" });
});

app.get("/api/habits", (req, res) => {
  console.log(
    "Loading habits from:",
    path.join(__dirname, "data", "habits.json")
  );
  const habits = loadHabits();
  console.log("Loaded habits:", habits);
  res.json(habits);
});

function loadHabits() {
  try {
    const habitsPath = path.join(__dirname, "data", "habits.json");
    console.log("Loading habits from:", habitsPath);

    if (!fs.existsSync(habitsPath)) {
      console.error("habits.json does not exist at:", habitsPath);
      return [];
    }

    const data = fs.readFileSync(habitsPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading habits:", error);
    return [];
  }
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
