import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    page: { type: String, required: true, trim: true, index: true },
    question: { type: String, required: true, trim: true, maxlength: 300 },
    answer: { type: String, required: true, trim: true, maxlength: 5000 },
    displayOrder: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

faqSchema.index({ page: 1, displayOrder: 1 });

export default mongoose.models.Faq || mongoose.model("Faq", faqSchema);
