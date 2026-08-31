import mongoose from "mongoose";

const statisticSchema = new mongoose.Schema(
  {
    value: { type: Number, required: true, min: 0 },
    suffix: { type: String, default: "", trim: true, maxlength: 10 },
    label: { type: String, required: true, trim: true, maxlength: 80 },
  },
  { _id: false },
);

const bottomSectionSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true, maxlength: 3000 },
  },
  { _id: false },
);

const homePageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "home" },
    stats: {
      type: [statisticSchema],
      validate: {
        validator: (stats) => !stats?.length || stats.length === 4,
        message: "Statistics must contain exactly four items when configured.",
      },
    },
    bottomSection: { type: bottomSectionSchema },
  },
  { timestamps: true },
);

export default mongoose.models.HomePage || mongoose.model("HomePage", homePageSchema);
