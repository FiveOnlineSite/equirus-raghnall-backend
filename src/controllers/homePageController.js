import HomePage from "../models/HomePage.js";
import { connectDatabase } from "../config/database.js";

const defaultStats = [
  { value: 20, suffix: "+", label: "Years Of Experience" },
  { value: 10, suffix: "M+", label: "Satisfied Customers" },
  { value: 360, suffix: "\u00B0", label: "Risk Protection" },
  { value: 300, suffix: "+", label: "Insurance Professionals" },
];

function getStats(homePage) {
  return homePage?.stats?.length === 4 ? homePage.stats : defaultStats;
}

export async function getHomeStats(request, response, next) {
  try {
    await connectDatabase();
    const homePage = await HomePage.findOne({ key: "home" }).lean();
    response.json({ success: true, stats: getStats(homePage) });
  } catch (error) {
    next(error);
  }
}

export async function updateHomeStats(request, response, next) {
  try {
    if (!Array.isArray(request.body.stats) || request.body.stats.length !== 4) {
      return response.status(400).json({
        success: false,
        message: "Exactly four statistics are required.",
      });
    }

    const stats = request.body.stats.map((stat) => ({
      value: Number(stat.value),
      suffix: typeof stat.suffix === "string" ? stat.suffix.trim() : "",
      label: typeof stat.label === "string" ? stat.label.trim() : "",
    }));
    const invalid = stats.some((stat) => (
      !Number.isSafeInteger(stat.value) ||
      stat.value < 0 ||
      !stat.label ||
      stat.label.length > 80 ||
      stat.suffix.length > 10
    ));

    if (invalid) {
      return response.status(400).json({
        success: false,
        message: "Each statistic needs a non-negative whole number, a label, and a suffix of at most 10 characters.",
      });
    }

    await connectDatabase();
    const homePage = await HomePage.findOneAndUpdate(
      { key: "home" },
      { key: "home", stats },
      { new: true, upsert: true, runValidators: true },
    );

    response.json({ success: true, stats: homePage.stats });
  } catch (error) {
    next(error);
  }
}
