import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    quote: { type: String, required: true, trim: true, maxlength: 3000 },
    imageKey: { type: String, required: true, trim: true },
    displayOrder: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

testimonialSchema.index({ displayOrder: 1 });

export default mongoose.models.Testimonial || mongoose.model("Testimonial", testimonialSchema);
