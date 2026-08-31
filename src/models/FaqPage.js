import mongoose from "mongoose";

const faqPageSchema = new mongoose.Schema(
  {
    page: { type: String, required: true, unique: true, trim: true },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.models.FaqPage || mongoose.model("FaqPage", faqPageSchema);
