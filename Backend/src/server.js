import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import apiRoutes from "./routes/api.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", apiRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/art_studio";

console.log("Connecting to MongoDB at:", MONGO_URI);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully");
    app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Database connection failed:", err.message);
  });