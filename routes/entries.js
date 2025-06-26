const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");
const { loadFromFile, saveToFile } = require("../utils/fileUtils");
const checkAPIKey = require("../utils/auth").checkAPIKey;

const filePath = path.join(process.cwd(), "data", "entries.json");

// GET all entries
router.get("/", checkAPIKey, (req, res) => {
  const entries = loadFromFile(filePath);
  res.json(entries);
});

// GET entries by month
router.get("/month/:year/:month", checkAPIKey, (req, res) => {
  const { year, month } = req.params;
  const entries = loadFromFile(filePath);

  const monthEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    return (
      entryDate.getFullYear() === parseInt(year) &&
      entryDate.getMonth() === parseInt(month) - 1
    );
  });

  res.json(monthEntries);
});

// GET by date
router.get("/:date", checkAPIKey, (req, res) => {
  const { date } = req.params;
  const entries = loadFromFile(filePath);
  const entry = entries.find((e) => e.date === date);
  if (entry) {
    res.json(entry);
  } else {
    res.status(404).json({ error: "Entry not found" });
  }
});

// POST
router.post("/", checkAPIKey, (req, res) => {
  const { date, scheduledHabits, completedHabits, additionalData } = req.body;

  if (!date || !scheduledHabits) {
    return res
      .status(400)
      .json({ error: "Date and scheduledHabits are required" });
  }

  const entries = loadFromFile(filePath);
  const exists = entries.find((e) => e.date === date);

  if (exists) {
    return res
      .status(400)
      .json({ error: "Entry for this date already exists" });
  }

  const stats = calculateDailyStats(
    scheduledHabits,
    completedHabits,
    additionalData
  );

  const newEntry = {
    date,
    scheduledHabits,
    completedHabits: completedHabits || [],
    stats,
    metadata: {
      weather: additionalData?.weather,
      mood: additionalData?.mood,
      notes: additionalData?.notes,
    },
  };

  entries.push(newEntry);
  saveToFile(filePath, entries);
  res.status(201).json(newEntry);
});

function calculateDailyStats(scheduled, completed, additionalData = {}) {
  const completionRate = (completed?.length / scheduled.length) * 100 || 0;

  const timeBasedCompletions = {
    morning: 0,
    afternoon: 0,
    evening: 0,
  };

  completed?.forEach((habit) => {
    const hour = new Date(habit.completedAt).getHours();
    if (hour < 12) timeBasedCompletions.morning++;
    else if (hour < 18) timeBasedCompletions.afternoon++;
    else timeBasedCompletions.evening++;
  });

  return {
    completionRate,
    ...timeBasedCompletions,
    totalMinutesSpent: additionalData.minutesSpent || 0,
    mood: additionalData.mood,
    energy: additionalData.energy,
    streak: Math.max(...(completed?.map((h) => h.streak) || [0])),
    weather: additionalData.weather,
  };
}

// Patch update entry by date
router.patch("/:date", async (req, res) => {
  const { date } = req.params;
  const newHabits = req.body.habits;

  if (!Array.isArray(newHabits)) {
    return res.status(400).json({ error: "Habits must be an array" });
  }

  try {
    const data = await fs.readFile("./data/entries.json", "utf8");
    const entries = JSON.parse(data);
    const entryIndex = entries.findIndex((e) => e.date === date);

    if (entryIndex === -1) {
      // New entry if not found
      entries.push({ date, habits: newHabits });
    } else {
      const existingHabits = entries[entryIndex].habits;

      // Update existing habits or add new ones
      newHabits.forEach((newHabit) => {
        const index = existingHabits.findIndex((h) => h.id === newHabit.id);
        if (index !== -1) {
          existingHabits[index] = newHabit;
        } else {
          existingHabits.push(newHabit);
        }
      });

      entries[entryIndex].habits = existingHabits;
    }

    await fs.writeFile(
      "./data/entries.json",
      JSON.stringify(entries, null, 2),
      "utf8"
    );

    const updatedEntry = entries.find((e) => e.date === date);
    res.json(updatedEntry);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create or update entry
router.put("/:date", checkAPIKey, (req, res) => {
  try {
    const { date } = req.params;
    const updatedEntry = req.body;

    console.log(`Updating entry for date: ${date}`);
    console.log("Entry data:", updatedEntry);

    const entries = loadFromFile(filePath) || [];
    const index = entries.findIndex((e) => e.date === date);

    if (index === -1) {
      entries.push(updatedEntry);
    } else {
      entries[index] = updatedEntry;
    }

    const saved = saveToFile(filePath, entries);
    if (!saved) {
      throw new Error("Failed to save entries");
    }

    console.log("Successfully saved entries");
    res.json(updatedEntry);
  } catch (error) {
    console.error("Error saving entry:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE by date
router.delete("/:date", checkAPIKey, (req, res) => {
  const { date } = req.params;
  const entries = loadFromFile(filePath);
  const index = entries.findIndex((e) => e.date === date);
  if (index === -1) {
    return res.status(404).json({ error: "Entry not found" });
  }

  const deleted = entries.splice(index, 1)[0];
  saveToFile(filePath, entries);
  res.json(deleted);
});

module.exports = router;
