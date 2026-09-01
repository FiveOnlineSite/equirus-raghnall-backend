import { Router } from "express";
import { createFaq, deleteFaq, getAdminFaqs, getPublicFaqs, reorderFaqs, updateFaq } from "../controllers/faqController.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const publicFaqRouter = Router();
export const adminFaqRouter = Router();

publicFaqRouter.get("/:page", getPublicFaqs);
adminFaqRouter.get("/faqs/:page", requireAdmin, getAdminFaqs);
adminFaqRouter.post("/faqs/:page", requireAdmin, createFaq);
adminFaqRouter.patch("/faqs/:page/reorder", requireAdmin, reorderFaqs);
adminFaqRouter.put("/faqs/:page/:id", requireAdmin, updateFaq);
adminFaqRouter.delete("/faqs/:page/:id", requireAdmin, deleteFaq);
