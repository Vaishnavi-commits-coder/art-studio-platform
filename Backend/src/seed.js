import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Painting from "./models/Painting.js";
import Config from "./models/Config.js";

dotenv.config();

const paintingsCatalog = [
  {
    title: "Crimson Horizon",
    description: "Oil on canvas, 24x36 in. A dramatic sunset over coastal bluffs layered with warm vermilion, cadmium orange, and deep umber.",
    price: 450,
    imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=700",
    status: "available",
  },
  {
    title: "Indigo Depths",
    description: "Acrylic abstract on heavy cotton paper, 18x24 in. Captures fluid ocean swells and underwater currents with cobalt and deep indigo glazes.",
    price: 320,
    imageUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=700",
    status: "available",
  },
  {
    title: "Earthy Impressions",
    description: "Textured palette knife with natural mineral pigments, 30x40 in. Inspired by weathered sedimentary rock formations and terracotta soil.",
    price: 580,
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=700",
    status: "available",
  },
  {
    title: "Marigold Reverie",
    description: "Gouache and gold leaf on stretched linen, 20x20 in. Geometric botanical motifs celebrating monsoon marigold harvests.",
    price: 290,
    imageUrl: "https://images.unsplash.com/photo-1578926375605-eaf7559b1458?w=700",
    status: "available",
  },
  {
    title: "Solar Flare Study",
    description: "Encaustic hot beeswax and dry pigment on wood panel, 16x20 in. Radiant amber and copper textures emulating volcanic fissures.",
    price: 410,
    imageUrl: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=700",
    status: "available",
  },
  {
    title: "Whispers of the Dunes",
    description: "Soft pastel on archival sanded board, 24x30 in. Sweeping sand formations under early dawn ambient light.",
    price: 340,
    imageUrl: "https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?w=700",
    status: "available",
  },
  {
    title: "Cerulean Tide",
    description: "Mixed media with mica flake inclusions, 36x48 in. Energetic gestures representing ocean spray and coastal winds.",
    price: 680,
    imageUrl: "https://images.unsplash.com/photo-1579783901586-7882245b7803?w=700",
    status: "available",
  },
  {
    title: "Autumnal Resonance",
    description: "Oil on panel, 22x28 in. Heavy impasto strokes evoking rustling beechwood groves and falling amber foliage.",
    price: 475,
    imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=700",
    status: "available",
  },
  {
    title: "Nocturne in Clay",
    description: "Raw umber, soot, and terracotta pigment wash, 24x24 in. A minimalist atmospheric study of twilight shadows in an ancient kiln.",
    price: 385,
    imageUrl: "https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?w=700",
    status: "available",
  },
  {
    title: "Terracotta Geometry",
    description: "Casein paint on unprimed heavy duck canvas, 28x34 in. Architectural angles inspired by Jaipur stone stepwells.",
    price: 525,
    imageUrl: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=700",
    status: "available",
  },
  {
    title: "Ochre Symphony",
    description: "Glazed watercolor and ink on handmade rag paper, 16x24 in. Spontaneous wash techniques exploring sunlight through monsoon rain clouds.",
    price: 260,
    imageUrl: "https://images.unsplash.com/photo-1582561121116-276686002f5a?w=700",
    status: "available",
  },
  {
    title: "The Kiln Fire",
    description: "Dense oil palette on gallery-wrapped canvas, 40x40 in. Abstract fiery illumination capturing wood smoke and glowing embers.",
    price: 720,
    imageUrl: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=700",
    status: "available",
  },
];

async function seed() {
  try {
    const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/art_studio";
    console.log("Connecting to MongoDB for seeding...");
    await mongoose.connect(MONGO_URI);

    await User.deleteMany();
    await Painting.deleteMany();
    await Config.deleteMany();

    const adminPass = await bcrypt.hash("admin123", 10);
    const custPass = await bcrypt.hash("password123", 10);

    await User.create([
      { name: "Studio Admin", email: "studio@artstudio.com", password: adminPass, role: "admin" },
      { name: "Alice Customer", email: "alice@example.com", password: custPass, role: "customer" },
    ]);

    await Config.create({
      wallRatePerSqFt: 25,
      potteryItems: ["Ceramic Mug", "Flower Vase", "Serving Bowl", "Planter"],
      potteryGlazes: ["Matte White", "Cobalt Blue", "Rustic Terracotta", "Emerald Gloss"],
    });

    await Painting.create(paintingsCatalog);

    console.log(`Seed complete! 12 unique paintings inserted into the gallery.`);
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();