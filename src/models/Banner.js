import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    page: { type: String, required: true, unique: true, trim: true },
    logoKey: { type: String, required: true, trim: true },
    altText: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

export default mongoose.models.Banner || mongoose.model("Banner", bannerSchema);
