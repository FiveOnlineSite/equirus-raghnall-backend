import { Router } from "express";
import { getBottomSection, getHomeStats, updateBottomSection, updateHomeStats } from "../controllers/homePageController.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const publicHomePageRouter = Router();
export const adminHomePageRouter = Router();

publicHomePageRouter.get("/stats", getHomeStats);
publicHomePageRouter.get("/bottom-section", getBottomSection);
adminHomePageRouter.get("/home/stats", requireAdmin, getHomeStats);
adminHomePageRouter.put("/home/stats", requireAdmin, updateHomeStats);
adminHomePageRouter.get("/home/bottom-section", requireAdmin, getBottomSection);
adminHomePageRouter.put("/home/bottom-section", requireAdmin, updateBottomSection);
