import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Painting from "../models/Painting.js";
import Order from "../models/Order.js";
import WallBooking from "../models/WallBooking.js";
import PotteryRequest from "../models/PotteryRequest.js";
import Config from "../models/Config.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// --- Auth Routes ---
router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role: "customer" });
    res.status(201).json({ message: "Customer account created", userId: user._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Seeded Config Route ---
router.get("/config", async (req, res) => {
  try {
    let cfg = await Config.findOne();
    if (!cfg) {
      cfg = await Config.create({
        wallRatePerSqFt: 25,
        potteryItems: ["Ceramic Mug", "Flower Vase", "Serving Bowl", "Planter"],
        potteryGlazes: ["Matte White", "Cobalt Blue", "Rustic Terracotta", "Emerald Gloss"],
      });
    }
    res.json(cfg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Paintings Routes ---
router.get("/paintings", async (req, res) => {
  try {
    const paintings = await Painting.find().sort({ createdAt: -1 });
    res.json(paintings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/paintings", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { title, description, price, imageUrl } = req.body;
    const painting = await Painting.create({ title, description, price, imageUrl });
    res.status(201).json(painting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/paintings/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const painting = await Painting.findById(req.params.id);
    if (!painting) return res.status(404).json({ message: "Painting not found" });
    if (painting.status !== "available") return res.status(400).json({ message: "Cannot edit sold painting" });
    Object.assign(painting, req.body);
    await painting.save();
    res.json(painting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/paintings/:id/buy", requireAuth, requireRole("customer"), async (req, res) => {
  try {
    const painting = await Painting.findOneAndUpdate(
      { _id: req.params.id, status: "available" },
      { $set: { status: "sold" } },
      { new: true }
    );
    if (!painting) {
      return res.status(400).json({ message: "Painting already sold or unavailable" });
    }
    const order = await Order.create({
      customer: req.user._id,
      painting: painting._id,
      price: painting.price,
      status: "placed",
    });
    res.status(201).json({ message: "Order placed successfully", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Orders Routes ---
router.get("/orders", requireAuth, async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { customer: req.user._id };
    const orders = await Order.find(filter).populate("painting").populate("customer", "name email");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/orders/:id/cancel", requireAuth, requireRole("customer"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || order.customer.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.status === "cancelled") {
      return res.status(400).json({ message: "Order already cancelled" });
    }
    order.status = "cancelled";
    await order.save();
    await Painting.findByIdAndUpdate(order.painting, { status: "available" });
    res.json({ message: "Order cancelled, painting restored to available", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Public endpoint: returns list of booked date strings so frontend can block them
router.get("/wall-bookings/booked-dates", async (req, res) => {
  try {
    const bookings = await WallBooking.find(
      { status: { $in: ["requested", "confirmed"] } },
      "date"
    );
    const dates = bookings.map((b) => b.date);
    res.json(dates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// --- Wall Bookings Routes ---
router.post("/wall-bookings", requireAuth, requireRole("customer"), async (req, res) => {
  try {
    const { date, wallSize, address } = req.body;
    if (wallSize < 10 || wallSize > 500) {
      return res.status(400).json({ message: "Wall size must be 10 to 500 sq ft" });
    }

    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((bookingDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 7 || diffDays > 90) {
      return res.status(400).json({ message: "Booking date must be 7 to 90 days away" });
    }

    const conflict = await WallBooking.findOne({
      date,
      status: { $in: ["requested", "confirmed"] },
    });
    if (conflict) {
      return res.status(400).json({ message: "Date is already booked" });
    }

    const cfg = await Config.findOne();
    const rate = cfg?.wallRatePerSqFt || 25;
    const price = wallSize * rate;

    const booking = await WallBooking.create({
      customer: req.user._id,
      date,
      wallSize,
      address,
      price,
      status: "requested",
    });
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/wall-bookings", requireAuth, async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { customer: req.user._id };
    const bookings = await WallBooking.find(filter).populate("customer", "name email");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/wall-bookings/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { status } = req.body;
    if (!["confirmed", "declined"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    const booking = await WallBooking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/wall-bookings/:id/cancel", requireAuth, requireRole("customer"), async (req, res) => {
  try {
    const booking = await WallBooking.findById(req.params.id);
    if (!booking || booking.customer.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const bookingDate = new Date(booking.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((bookingDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 3) {
      return res.status(400).json({ message: "Cannot cancel within 3 days of booking" });
    }

    booking.status = "cancelled";
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Pottery Requests Routes ---
router.post("/pottery-requests", requireAuth, requireRole("customer"), async (req, res) => {
  try {
    const { item, glaze, quantity, neededByDate } = req.body;
    if (quantity < 1 || quantity > 12) {
      return res.status(400).json({ message: "Quantity must be between 1 and 12" });
    }

    const neededDate = new Date(neededByDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((neededDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 14) {
      return res.status(400).json({ message: "Needed date must be at least 14 days away" });
    }

    const request = await PotteryRequest.create({
      customer: req.user._id,
      item,
      glaze,
      quantity,
      neededByDate,
      status: "requested",
    });
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/pottery-requests", requireAuth, async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { customer: req.user._id };
    const requests = await PotteryRequest.find(filter).populate("customer", "name email");
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/pottery-requests/:id", requireAuth, requireRole("customer"), async (req, res) => {
  try {
    const request = await PotteryRequest.findById(req.params.id);
    if (!request || request.customer.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.status !== "requested") {
      return res.status(400).json({ message: "Can only edit while status is 'requested'" });
    }
    Object.assign(request, req.body);
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/pottery-requests/:id/cancel", requireAuth, requireRole("customer"), async (req, res) => {
  try {
    const request = await PotteryRequest.findById(req.params.id);
    if (!request || request.customer.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.status !== "requested") {
      return res.status(400).json({ message: "Can only cancel while status is 'requested'" });
    }
    request.status = "cancelled";
    await request.save();
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/pottery-requests/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { status } = req.body;
    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    const request = await PotteryRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;