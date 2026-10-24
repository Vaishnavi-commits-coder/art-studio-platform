# Art Studio Platform

A full-stack studio management and e-commerce application built with the MERN stack (MongoDB, Express, React, Node.js). The platform handles one-of-a-kind art purchases with atomic concurrency protection, on-site wall mural scheduling with dynamic aspect-ratio sizing, and custom pottery commissions with live SVG glaze rendering.

---

## Key Features

- **One-of-a-Kind Canvas Acquisitions:** Atomic database updates (`findOneAndUpdate`) guarantee a piece can only ever be claimed once, eliminating double-purchase race conditions. Cancelled orders automatically restore the painting to the catalog.
- **Wall Mural Commissions:** Interactive aspect-ratio calculator ($10$ to $500\text{ sq ft}$) with dynamic cost calculation ($\$25/\text{sq ft}$). Strict date scheduling prevents overlapping bookings and enforces the $7$-to-$90$-day lead-time boundary ($3$-day cancellation limit).
- **Custom Ceramic Commissions:** Wheel-thrown pottery requests with real-time SVG glaze and oxide rendering, strict $1$-to-$12$ quantity validation, and minimum $14$-day kiln curing schedule verification.
- **Role-Based Access Control (RBAC):** Strict separation between `customer` and `admin` roles, returning explicit HTTP status codes (`401 Unauthorized`, `403 Forbidden`, and `404 Not Found` for cross-user resource privacy).
- **Studio Admin Suite:** Dedicated portal for studio staff to confirm/decline mural reservations, accept/decline pottery requests, and curate gallery pieces.

---

## Tech Stack

- **Frontend:** React 18, Vite, Plain CSS (Theme: Forest & Sage Green), Canvas-Confetti
- **Backend:** Node.js, Express.js, JSON Web Tokens (JWT), Bcryptjs
- **Database:** MongoDB with Mongoose ODM

---

## Project Structure
WebDev/
├── Backend/
│   ├── src/
│   │   ├── middleware/    # Auth and RBAC middleware (401, 403, 404 guards)
│   │   ├── models/        # Painting, WallBooking, Pottery, User, Config
│   │   ├── routes/        # Auth and operational APIs
│   │   ├── server.js      # Express server entry point
│   │   └── seed.js        # Seed database script
│   ├── .env.example       # Environment template
│   ├── .gitignore
│   └── package.json
├── Frontend/
│   ├── src/
│   │   ├── App.jsx        # Complete reactive UI and role-based workflows
│   │   ├── index.css      # Forest & Sage design tokens
│   │   └── main.jsx
│   ├── .gitignore
│   └── package.json
├── DESIGN.md              # Technical design choices and architectural trade-offs
└── README.md
Getting Started (Clean Machine Setup)
Follow these steps to run the complete platform locally:
1. PrerequisitesNode.js (v18.0.0 or later installed)
MongoDB running locally on default port 270172. Backend SetupOpen a terminal and navigate to Backend:
cd BackendInstall dependencies:
npm install
Set up environment variables:
Create a .env file from the example template:
Windows PowerShellcopy .env.example .envMac/Linuxcp .env.example .env(Default port is 5000 and default MongoDB URI is mongodb://127.0.0.1:27017/art_studio).Seed the initial catalog and studio configuration:
npm run seed
Start the backend development server:
npm run dev
The API will be live at http://localhost:5000.3. Frontend SetupOpen a second terminal window and navigate to Frontend:
cd Frontend
Install dependencies:
npm install
Start the client application:
npm run dev
The interface will run at http://localhost:5173.Pre-Configured Test Accounts
Use the one-click autofill buttons on the login portal, or log in with these credentials:
Role            Customer                             Studio Admin 
Email           alice@example.com                    studio@artstudio.com
Password        password123                          admin123
Permissions     Buy paintings,                       
                book walls, commission ceramics, 
                cancel own orders
Single-Buy Guarantee: 
Enforced atomically via Painting.findOneAndUpdate({ _id, status: "available" }, { $set: { status: "sold" } }).Wall 
Booking Constraints: Enforces 7–90 days ahead, only 1 booking per date across the platform, cancellation permitted up to 3 days prior.
Pottery Rules: Minimum 14 days lead time, quantity 1–12, editable/cancellable strictly while in requested status.