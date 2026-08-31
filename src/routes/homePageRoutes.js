import { Router } from "express";
import { getHomeStats, updateHomeStats } from "../controllers/homePageController.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const publicHomePageRouter = Router();
export const adminHomePageRouter = Router();

publicHomePageRouter.get("/stats", getHomeStats);
adminHomePageRouter.get("/home/stats", requireAdmin, getHomeStats);
adminHomePageRouter.put("/home/stats", requireAdmin, updateHomeStats);
