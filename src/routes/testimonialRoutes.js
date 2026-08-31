import { Router } from "express";
import { createTestimonial, deleteTestimonial, getAdminTestimonials, getPublicTestimonials, reorderTestimonials, updateTestimonial } from "../controllers/testimonialController.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const publicTestimonialRouter = Router();
export const adminTestimonialRouter = Router();

publicTestimonialRouter.get("/", getPublicTestimonials);
adminTestimonialRouter.get("/testimonials", requireAdmin, getAdminTestimonials);
adminTestimonialRouter.post("/testimonials", requireAdmin, createTestimonial);
adminTestimonialRouter.patch("/testimonials/reorder", requireAdmin, reorderTestimonials);
adminTestimonialRouter.put("/testimonials/:id", requireAdmin, updateTestimonial);
adminTestimonialRouter.delete("/testimonials/:id", requireAdmin, deleteTestimonial);
