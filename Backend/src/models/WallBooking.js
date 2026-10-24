import mongoose from "mongoose";

const wallBookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    wallSize: { type: Number, required: true, min: 10, max: 500 },
    address: { type: String, required: true },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ["requested", "confirmed", "declined", "cancelled"],
      default: "requested",
    },
  },
  { timestamps: true }
);

export default mongoose.model("WallBooking", wallBookingSchema);