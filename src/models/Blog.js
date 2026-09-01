import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  metaTitle: { type: String, trim: true, maxlength: 200 },
  metaDescription: { type: String, trim: true, maxlength: 320 },
  slug: { type: String, required: true, unique: true, trim: true, index: true },
  imageKey: { type: String, required: true, trim: true },
  imageAlt: { type: String, trim: true, maxlength: 200 },
  category: { type: String, required: true, trim: true, enum: ["Blogs", "Risk Reports", "Market Updates", "Case Studies"] },
  readTime: { type: String, required: true, trim: true, maxlength: 30 },
  content: { type: String, required: true, trim: true, maxlength: 20000 },
}, { timestamps: true });

blogSchema.index({ createdAt: -1 });
export default mongoose.models.Blog || mongoose.model("Blog", blogSchema);
