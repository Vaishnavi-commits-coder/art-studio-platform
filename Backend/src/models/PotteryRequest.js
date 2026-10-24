import mongoose from "mongoose";

const potteryRequestSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    item: { type: String, required: true },
    glaze: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, max: 12 },
    neededByDate: { type: String, required: true },
    status: {
      type: String,
      enum: ["requested", "accepted", "declined", "cancelled"],
      default: "requested",
    },
  },
  { timestamps: true }
);

export default mongoose.model("PotteryRequest", potteryRequestSchema);