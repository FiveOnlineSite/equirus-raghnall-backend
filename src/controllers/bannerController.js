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
  const logoKey = banner.logoKey || "";

  return {
    ...banner.toObject(),
    logoKey,
    logoUrl: logoKey && cdnUrl ? `${cdnUrl}/${logoKey.replace(/^\//, "")}` : "",
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

    const logoKey = typeof request.body.logoKey === "string"
      ? request.body.logoKey.trim()
      : "";
    const altText = typeof request.body.altText === "string"
      ? request.body.altText.trim().slice(0, 300)
      : "";
    const expectedPrefix = `service-logos/${request.params.page}/`;

    if (!logoKey || !logoKey.startsWith(expectedPrefix)) {
      return response.status(400).json({
        success: false,
        message: "A valid service logo key is required.",
      });
    }

    await connectDatabase();
    const banner = await Banner.findOneAndUpdate(
      { page: request.params.page },
      { page: request.params.page, logoKey, altText },
      { new: true, upsert: true, runValidators: true },
    );

    response.json({ success: true, banner: serializeBanner(banner) });
  } catch (error) {
    next(error);
  }
}
