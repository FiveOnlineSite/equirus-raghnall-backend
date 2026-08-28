import { Router } from "express";
import {
  getAdminBanner,
  getPublicBanner,
  updateBanner,
} from "../controllers/bannerController.js";
import { createUploadPolicy } from "../controllers/uploadController.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const publicBannerRouter = Router();
export const adminBannerRouter = Router();

publicBannerRouter.get("/:page", getPublicBanner);
adminBannerRouter.get("/banners/:page", requireAdmin, getAdminBanner);
adminBannerRouter.put("/banners/:page", requireAdmin, updateBanner);
adminBannerRouter.post("/upload", requireAdmin, createUploadPolicy);
