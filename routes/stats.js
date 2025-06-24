const express = require("express");
const router = express.Router();
const { loadFromFile } = require("../utils/fileUtils");
const checkAPIKey = require("../utils/auth").checkAPIKey;

router.get("/insights", checkAPIKey, (req, res) => {
  const entries = loadFromFile("./data/entries.json");

  const insights = {
    bestDays: calculateBestDays(entries),
    bestTime: calculateBestTimeOfDay(entries),
    longestStreaks: calculateLongestStreaks(entries),
    completionTrends: calculateCompletionTrends(entries),
    moodCorrelations: calculateMoodCorrelations(entries),
    weatherImpact: calculateWeatherImpact(entries),
  };

  res.json(insights);
});

router.get("/monthly/:year/:month", checkAPIKey, (req, res) => {
  const { year, month } = req.params;
  const entries = loadFromFile("./data/entries.json");

  const monthEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    return (
      entryDate.getFullYear() === parseInt(year) &&
      entryDate.getMonth() === parseInt(month) - 1
    );
  });

  const stats = {
    monthlyCompletion: calculateMonthlyCompletion(monthEntries),
    longestStreak: calculateLongestStreak(monthEntries),
    perfectDays: calculatePerfectDays(monthEntries),
    mostConsistent: calculateMostConsistentHabit(monthEntries),
    weeklyTrend: calculateWeeklyTrend(monthEntries),
    bestTimeOfDay: calculateBestTimeOfDay(monthEntries),
  };
  res.json(stats);
});

function calculateBestDays(entries) {
  const dayStats = entries.reduce((acc, entry) => {
    const day = new Date(entry.date).getDay();
    acc[day] = acc[day] || { total: 0, completed: 0 };
    acc[day].total += entry.scheduledHabits?.length || 0;
    acc[day].completed += entry.completedHabits?.length || 0;
    return acc;
  }, {});

  return Object.entries(dayStats)
    .map(([day, stats]) => ({
      day: [
        "Søndag",
        "Mandag",
        "Tirsdag",
        "Onsdag",
        "Torsdag",
        "Fredag",
        "Lørdag",
      ][day],
      completionRate: (stats.completed / stats.total) * 100,
    }))
    .sort((a, b) => b.completionRate - a.completionRate);
}

function calculateBestTimeOfDay(entries) {
  const timeStats = entries.reduce(
    (acc, entry) => {
      const { morning, afternoon, evening } = entry.stats || {};
      acc.morning += morning || 0;
      acc.afternoon += afternoon || 0;
      acc.evening += evening || 0;
      return acc;
    },
    { morning: 0, afternoon: 0, evening: 0 }
  );

  return Object.entries(timeStats)
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => b.count - a.count);
}

function calculateMonthlyCompletion(entries) {
  if (!entries.length) return 0;

  const totalScheduled = entries.reduce(
    (sum, entry) => sum + (entry.scheduledHabits?.length || 0),
    0
  );
  const totalCompleted = entries.reduce(
    (sum, entry) => sum + (entry.completedHabits?.length || 0),
    0
  );

  return totalScheduled ? (totalCompleted / totalScheduled) * 100 : 0;
}

function calculateLongestStreak(entries) {
  if (!entries.length) return 0;

  const streaks = entries.flatMap((entry) =>
    entry.completedHabits.map((habit) => habit.streak || 0)
  );

  return Math.max(...streaks, 0);
}

function calculatePerfectDays(entries) {
  if (!entries.length) return 0;

  return entries.filter(
    (entry) =>
      entry.scheduledHabits?.length > 0 &&
      entry.scheduledHabits.length === entry.completedHabits?.length
  ).length;
}

function calculateMostConsistentHabit(entries) {
  if (!entries.length) return null;

  const habitStats = {};

  // Count scheduled and completed for each habit
  entries.forEach((entry) => {
    entry.scheduledHabits?.forEach((habit) => {
      if (!habitStats[habit.name]) {
        habitStats[habit.name] = { scheduled: 0, completed: 0 };
      }
      habitStats[habit.name].scheduled++;
    });

    entry.completedHabits?.forEach((habit) => {
      if (habitStats[habit.name]) {
        habitStats[habit.name].completed++;
      }
    });
  });

  // Find habit with highest completion percentage
  const mostConsistent = Object.entries(habitStats)
    .map(([name, stats]) => ({
      name,
      percentage: stats.scheduled
        ? (stats.completed / stats.scheduled) * 100
        : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage)[0];

  return mostConsistent || null;
}

function calculateWeeklyTrend(entries) {
  const last7Days = [];
  const today = new Date();

  // Create array of last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const entry = entries.find(
      (e) => new Date(e.date).toDateString() === date.toDateString()
    );

    last7Days.push({
      date: date.toISOString(),
      percentage: entry
        ? (entry.completedHabits?.length / entry.scheduledHabits?.length) *
            100 || 0
        : 0,
    });
  }

  return last7Days;
}

module.exports = router;
