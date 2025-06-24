"use strict";

const express = require("express");
const cors = require("cors");
const habitsRouter = require("./routes/habits");
const entriesRouter = require("./routes/entries");
const statsRouter = require("./routes/stats");

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = ["http://localhost:5173", "https://habits.olavelnan.no"];

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

app.use("/api/habits", habitsRouter);
app.use("/api/entries", entriesRouter);
app.use("/api/stats", statsRouter);

app.get("/", (req, res) => {
  res.send("API er oppe og går!");
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: "Internal Server Error" });
});

const startServer = () => {
  try {
    const server = app.listen(PORT);

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        process.exit(1);
      }
      process.exit(1);
    });
  } catch (err) {
    process.exit(1);
  }
};

startServer();
