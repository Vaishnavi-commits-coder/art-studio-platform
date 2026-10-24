import mongoose from "mongoose";

const configSchema = new mongoose.Schema({
  wallRatePerSqFt: { type: Number, default: 25 },
  potteryItems: [{ type: String }],
  potteryGlazes: [{ type: String }],
});

export default mongoose.model("Config", configSchema);