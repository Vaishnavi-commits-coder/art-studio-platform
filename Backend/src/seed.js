require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Painting = require("./models/Painting");
const Config = require("./models/Config");

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/art_studio";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB...");

    // Force drop paintings collection so no old titles remain
    try {
      await mongoose.connection.collection("paintings").drop();
    } catch (e) {
      // collection might not exist yet
    }
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

    // 3. 12 High-Reliability Paintings (Wikimedia & Verified Art CDN)
    const paintingsData = [
      {
        title: "Whispers of the Dunes",
        description: "Soft pastel on archival sanded board, 24x30 in. Sweeping sand formations under early dawn light.",
        price: 340,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Edvard_Munch_-_The_Sun_%281911%29.jpg/800px-Edvard_Munch_-_The_Sun_%281911%29.jpg",
        status: "available"
      },
      {
        title: "Azure Solitude",
        description: "Layered palette knife acrylic on heavyweight canvas, 36x48 in. Deep oceanic reflections and tidal turbulence.",
        price: 520,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Crashing_Wave_-_William_Trost_Richards.jpg/800px-Crashing_Wave_-_William_Trost_Richards.jpg",
        status: "available"
      },
      {
        title: "Eucalyptus at Dawn",
        description: "Botanical study in gouache and graphite on handmade cotton rag, 18x24 in. Sage and olive pigment layers.",
        price: 260,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Claude_Monet_-_Morning_on_the_Seine_near_Giverny_-_1929.6.72_-_Corcoran_Gallery_of_Art.jpg/800px-Claude_Monet_-_Morning_on_the_Seine_near_Giverny_-_1929.6.72_-_Corcoran_Gallery_of_Art.jpg",
        status: "available"
      },
      {
        title: "Terracotta Shadows",
        description: "Mineral earth pigments and Venetian plaster on wooden cradle panel, 30x40 in. Textured rustic geometry.",
        price: 480,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Paul_C%C3%A9zanne_-_Mont_Sainte-Victoire_-_Google_Art_Project.jpg/800px-Paul_C%C3%A9zanne_-_Mont_Sainte-Victoire_-_Google_Art_Project.jpg",
        status: "available"
      },
      {
        title: "Alpine Mist",
        description: "Cold wax and oil on Belgian linen, 40x40 in. Atmospheric mountain elevation and veiled spruce ridgelines.",
        price: 610,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Caspar_David_Friedrich_-_Wanderer_%C3%BCber_dem_Nebelmeer.jpg/800px-Caspar_David_Friedrich_-_Wanderer_%C3%BCber_dem_Nebelmeer.jpg",
        status: "available"
      },
      {
        title: "Sienna Reverie",
        description: "Raw umber, ochre, and warm tempera wash on raw canvas, 20x28 in. Minimalist geometric balance study.",
        price: 290,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Twelve_Sunflowers_in_a_Vase.jpg/800px-Van_Gogh_-_Twelve_Sunflowers_in_a_Vase.jpg",
        status: "available"
      },
      {
        title: "Crystalline Waters",
        description: "Translucent glaze layers and impasto highlights on stretched cotton, 32x44 in. Shallow coastal coral light.",
        price: 440,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Winslow_Homer_-_The_Gulf_Stream_-_Metropolitan_Museum_of_Art.jpg/800px-Winslow_Homer_-_The_Gulf_Stream_-_Metropolitan_Museum_of_Art.jpg",
        status: "available"
      },
      {
        title: "Verdant Canopy",
        description: "Deep forest oil study on primed birch wood, 22x30 in. Canopy sunbeams filtering through dense pine leaves.",
        price: 380,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Gustav_Klimt_047.jpg/800px-Gustav_Klimt_047.jpg",
        status: "available"
      },
      {
        title: "Midnight Monochrome",
        description: "Charcoal, powdered graphite, and sumi ink wash on French rag paper, 24x36 in. High-contrast abstract lines.",
        price: 310,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Whistler-Arrangement_in_Grey_and_Black%2C_No._1.jpg/800px-Whistler-Arrangement_in_Grey_and_Black%2C_No._1.jpg",
        status: "available"
      },
      {
        title: "Golden Hour Bloom",
        description: "Heavy impasto acrylic and gold leaf flakes on structured canvas, 28x28 in. Warm floral expressionism.",
        price: 395,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Vincent_van_Gogh_-_Almond_blossom_-_Google_Art_Project.jpg/800px-Vincent_van_Gogh_-_Almond_blossom_-_Google_Art_Project.jpg",
        status: "available"
      },
      {
        title: "Slate & Ochre",
        description: "Mixed media with marble dust and acrylic binder on canvas, 36x36 in. Earthy architectural composition.",
        price: 450,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Camille_Pissarro_-_The_Garden_at_Pontoise_-_Google_Art_Project.jpg/800px-Camille_Pissarro_-_The_Garden_at_Pontoise_-_Google_Art_Project.jpg",
        status: "available"
      },
      {
        title: "Celestial Quiet",
        description: "Deep Prussian blue and titanium white oil wash on oval linen, 24x32 in. Midnight celestial horizon.",
        price: 360,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/800px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",
        status: "available"
      }
    ];

    await Painting.insertMany(paintingsData);
    console.log(`✓ Cleanly seeded ${paintingsData.length} paintings`);
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedDatabase();