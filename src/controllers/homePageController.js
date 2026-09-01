import HomePage from "../models/HomePage.js";
import { connectDatabase } from "../config/database.js";

const defaultStats = [
  { value: 20, suffix: "+", label: "Years Of Experience" },
  { value: 10, suffix: "M+", label: "Satisfied Customers" },
  { value: 360, suffix: "\u00B0", label: "Risk Protection" },
  { value: 300, suffix: "+", label: "Insurance Professionals" },
];

const defaultBottomSection = {
  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Duis aute irure dolor in reprehenderit in voluptate velit esse...",
};

function getStats(homePage) {
  return homePage?.stats?.length === 4 ? homePage.stats : defaultStats;
}

function getBottomSectionContent(homePage) {
  return homePage?.bottomSection?.description
    ? homePage.bottomSection
    : defaultBottomSection;
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
      !stat.suffix ||
      !stat.label ||
      stat.label.length > 80 ||
      stat.suffix.length > 10
    ));

    if (invalid) {
      return response.status(400).json({
        success: false,
        message: "Each statistic needs a non-negative whole number, a suffix of at most 10 characters, and a label.",
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

export async function getBottomSection(request, response, next) {
  try {
    await connectDatabase();
    const homePage = await HomePage.findOne({ key: "home" }).lean();
    response.json({ success: true, bottomSection: getBottomSectionContent(homePage) });
  } catch (error) {
    next(error);
  }
}

export async function updateBottomSection(request, response, next) {
  try {
    const description = typeof request.body.description === "string" ? request.body.description.trim() : "";
    if (!description || description.length > 3000) {
      return response.status(400).json({ success: false, message: "Description is required." });
    }

    await connectDatabase();
    const homePage = await HomePage.findOneAndUpdate(
      { key: "home" },
      { key: "home", bottomSection: { description } },
      { new: true, upsert: true, runValidators: true },
    );
    response.json({ success: true, bottomSection: homePage.bottomSection });
  } catch (error) {
    next(error);
  }
}
