const express = require("express");
const router = express.Router();
const { loadFromFile, saveToFile } = require("../utils/fileUtils");
const checkAPIKey = require("../utils/auth").checkAPIKey;

const filePath = "./data/habits.json";

// GET
router.get("/", (req, res) => {
  const habits = loadFromFile(filePath);
  res.json(habits);
});

// POST
router.post("/", checkAPIKey, (req, res) => {
  const habits = loadFromFile(filePath);
  const newHabit = {
    ...req.body,
    completed: false,
    done: false,
    stats: {
      totalCompleted: 0,
      lastCompletedDate: null,
      streak: 0,
      ...req.body.stats,
    },
  };

  const maxId =
    habits.length === 0 ? 0 : Math.max(...habits.map((h) => h.id || 0));
  newHabit.id = maxId + 1;

  habits.push(newHabit);
  saveToFile(filePath, habits);
  res.status(201).json(newHabit);
});

// PUT
router.put("/:id", checkAPIKey, (req, res) => {
  const id = Number(req.params.id);
  const habits = loadFromFile(filePath);

  const index = habits.findIndex((h) => h.id === id);
  if (index === -1) return res.status(404).json({ error: "Habit not found" });

  const existingHabit = habits[index];
  const updated = {
    ...existingHabit,
    ...req.body,
    id,
    stats: {
      ...existingHabit.stats,
      ...req.body.stats,
    },
  };

  habits[index] = updated;
  saveToFile(filePath, habits);
  res.json(updated);
});

// DELETE
router.delete("/:id", checkAPIKey, (req, res) => {
  const id = Number(req.params.id);
  let habits = loadFromFile(filePath);

  const index = habits.findIndex((h) => h.id === id);
  if (index === -1) return res.status(404).json({ error: "Vane ikke funnet" });

  const deleted = habits.splice(index, 1)[0];
  saveToFile(filePath, habits);
  res.json(deleted);
});

module.exports = router;
