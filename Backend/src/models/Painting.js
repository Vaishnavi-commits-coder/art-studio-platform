import mongoose from "mongoose";

const paintingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    imageUrl: { type: String, default: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600" },
    status: { type: String, enum: ["available", "sold"], default: "available" },
  },
  { timestamps: true }
);

export default mongoose.model("Painting", paintingSchema);