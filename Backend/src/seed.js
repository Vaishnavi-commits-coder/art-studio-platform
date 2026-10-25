import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "./models/User.js";
import Painting from "./models/Painting.js";
import Config from "./models/Config.js";

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/art_studio";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB...");

    try {
      await mongoose.connection.collection("paintings").drop();
    } catch (e) {}
    await User.deleteMany({});
    await Config.deleteMany({});

    // 1. Studio Configuration
    await Config.create({
      wallRatePerSqFt: 25,
      potteryItems: ["Ceramic Mug", "Flower Vase", "Serving Bowl", "Succulent Planter"],
      potteryGlazes: ["Cobalt Blue", "Rustic Terracotta", "Emerald Gloss", "Matte White"]
    });

    // 2. Default Accounts
    const adminPasswordHash = await bcrypt.hash("admin123", 10);
    const customerPasswordHash = await bcrypt.hash("password123", 10);

    await User.create([
      {
        name: "Studio Admin",
        email: "studio@artstudio.com",
        password: adminPasswordHash,
        role: "admin"
      },
      {
        name: "Alice Collector",
        email: "alice@example.com",
        password: customerPasswordHash,
        role: "customer"
      }
    ]);

    // 3. 12 Verified Fine-Art & Canvas Paintings
    const paintingsData = [
      {
        title: "Whispers of the Dunes",
        description: "Soft pastel on archival sanded board, 24x30 in. Sweeping sand formations under early dawn light.",
        price: 340,
        imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80",
        status: "available"
      },
      {
        title: "Azure Solitude",
        description: "Layered palette knife acrylic on heavyweight canvas, 36x48 in. Deep oceanic reflections and tidal turbulence.",
        price: 520,
        imageUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=80",
        status: "available"
      },
      {
        title: "Eucalyptus at Dawn",
        description: "Botanical study in gouache and graphite on handmade cotton rag, 18x24 in. Sage and olive pigment layers.",
        price: 260,
        imageUrl: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=800&auto=format&fit=crop&q=80",
        status: "available"
      },
      {
        title: "Terracotta Shadows",
        description: "Mineral earth pigments and Venetian plaster on wooden cradle panel, 30x40 in. Textured rustic geometry.",
        price: 480,
        imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80",
        status: "available"
      },
      {
        title: "Alpine Mist",
        description: "Cold wax and oil on Belgian linen, 40x40 in. Atmospheric mountain elevation and veiled spruce ridgelines.",
        price: 610,
        imageUrl: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&auto=format&fit=crop&q=80",
        status: "available"
      },
      {
        title: "Sienna Reverie",
        description: "Raw umber, ochre, and warm tempera wash on raw canvas, 20x28 in. Minimalist geometric balance study.",
        price: 290,
        imageUrl: "https://images.unsplash.com/photo-1582561424760-0321d75e81fa?w=800&auto=format&fit=crop&q=80",
        status: "available"
      },
      {
        title: "Crystalline Waters",
        description: "Translucent glaze layers and impasto highlights on stretched cotton, 32x44 in. Shallow coastal coral light.",
        price: 440,
        imageUrl: "https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?w=800&auto=format&fit=crop&q=80",
        status: "available"
      },
      {
        title: "Verdant Canopy",
        description: "Deep forest oil study on primed birch wood, 22x30 in. Canopy sunbeams filtering through dense pine leaves.",
        price: 380,
        imageUrl: "https://images.unsplash.com/photo-1576769267415-9642010aa962?w=800&auto=format&fit=crop&q=80",
        status: "available"
      },
      {
        title: "Midnight Monochrome",
        description: "Charcoal, powdered graphite, and sumi ink wash on French rag paper, 24x36 in. High-contrast abstract lines.",
        price: 310,
        imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=80",
        status: "available"
      },
      {
        title: "Golden Hour Bloom",
        description: "Heavy impasto acrylic and gold leaf flakes on structured canvas, 28x28 in. Warm floral expressionism.",
        price: 395,
        imageUrl: "https://images.unsplash.com/photo-1579783901586-7880cb4cd59a?w=800&auto=format&fit=crop&q=80",
        status: "available"
      },
      {
        title: "Slate & Ochre",
        description: "Mixed media with marble dust and acrylic binder on canvas, 36x36 in. Earthy architectural composition.",
        price: 450,
        imageUrl: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=800&auto=format&fit=crop&q=80",
        status: "available"
      },
      {
        title: "Celestial Quiet",
        description: "Deep Prussian blue and titanium white oil wash on oval linen, 24x32 in. Midnight celestial horizon.",
        price: 360,
        imageUrl: "https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=800&auto=format&fit=crop&q=80",
        status: "available"
      }
    ];

    await Painting.insertMany(paintingsData);
    console.log(`✓ Seeded ${paintingsData.length} museum/art paintings successfully!`);
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedDatabase();