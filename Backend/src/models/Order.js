import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    painting: { type: mongoose.Schema.Types.ObjectId, ref: "Painting", required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: ["placed", "cancelled"], default: "placed" },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);