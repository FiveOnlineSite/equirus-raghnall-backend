import Banner from "../models/Banner.js";
import { connectDatabase } from "../config/database.js";
import { isServicePage } from "../config/servicePages.js";

function validatePage(request, response) {
  if (!isServicePage(request.params.page)) {
    response.status(400).json({ success: false, message: "Invalid service page." });
    return false;
  }

  return true;
}

function serializeBanner(banner) {
  if (!banner) return null;

  const cdnUrl = (process.env.AWS_CDN_URL || "").replace(/\/$/, "");
  const imageKey = banner.imageKey || "";

  return {
    ...banner.toObject(),
    imageKey,
    imageUrl: imageKey && cdnUrl ? `${cdnUrl}/${imageKey.replace(/^\//, "")}` : "",
    altText: banner.altText || "",
  };
}

export async function getPublicBanner(request, response, next) {
  try {
    if (!validatePage(request, response)) return;

    await connectDatabase();
    const banner = await Banner.findOne({ page: request.params.page });
    response.json({ success: true, banner: serializeBanner(banner) });
  } catch (error) {
    next(error);
  }
}

export async function getAdminBanner(request, response, next) {
  return getPublicBanner(request, response, next);
}

export async function updateBanner(request, response, next) {
  try {
    if (!validatePage(request, response)) return;

    const imageKey = typeof request.body.imageKey === "string"
      ? request.body.imageKey.trim()
      : "";
    const altText = typeof request.body.altText === "string"
      ? request.body.altText.trim().slice(0, 300)
      : "";
    const expectedPrefix = `banners/${request.params.page}/`;

    if (!imageKey || !imageKey.startsWith(expectedPrefix)) {
      return response.status(400).json({
        success: false,
        message: "A valid banner image key is required.",
      });
    }

    await connectDatabase();
    const banner = await Banner.findOneAndUpdate(
      { page: request.params.page },
      { page: request.params.page, imageKey, altText },
      { new: true, upsert: true, runValidators: true },
    );

    response.json({ success: true, banner: serializeBanner(banner) });
  } catch (error) {
    next(error);
  }
}
