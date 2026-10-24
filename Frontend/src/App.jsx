import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";

const API = "http://localhost:5000/api";

const GLAZE_PROPERTIES = {
  "Matte White": { color: "#F3F4F6", text: "#1F2937", border: "#D1D5DB" },
  "Cobalt Blue": { color: "#1D4ED8", text: "#FFFFFF", border: "#1E40AF" },
  "Rustic Terracotta": { color: "#C25E38", text: "#FFFFFF", border: "#9A3412" },
  "Emerald Gloss": { color: "#047857", text: "#FFFFFF", border: "#065F46" }
};

export default function App() {
  const [token, setToken] = useState(() => {
    if (!sessionStorage.getItem("app_visited")) {
      localStorage.clear();
      sessionStorage.setItem("app_visited", "true");
      return "";
    }
    return localStorage.getItem("token") || "";
  });

  const [user, setUser] = useState(() => {
    return localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
  });

  const [view, setView] = useState("paintings");

  // Catalog States
  const [paintings, setPaintings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wallBookings, setWallBookings] = useState([]);
  const [bookedDates, setBookedDates] = useState([]);
  const [potteryRequests, setPotteryRequests] = useState([]);
  const [config, setConfig] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Feedback & Interactive Modals
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [cancellationModal, setCancellationModal] = useState({ open: false, title: "", message: "" });
  const [selectedPainting, setSelectedPainting] = useState(null);
  const [previewInRoom, setPreviewInRoom] = useState(false);

  // Auth Modes & Form
  const [authRole, setAuthRole] = useState("customer");
  const [isRegister, setIsRegister] = useState(false);
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });

  // Input Forms
  const [paintingForm, setPaintingForm] = useState({ title: "", description: "", price: "", imageUrl: "" });
  
  // Wall Aspect-Ratio State: Width x Height
  const [wallDimensions, setWallDimensions] = useState({ width: 10, height: 10 });
  const [wallDate, setWallDate] = useState("");
  const [wallAddress, setWallAddress] = useState("");

  // Pottery Interactive State
  const [potteryForm, setPotteryForm] = useState({
    item: "Ceramic Mug",
    glaze: "Cobalt Blue",
    quantity: 2,
    neededByDate: ""
  });

  const triggerGreenConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#2D6A4F", "#52B788", "#74C69D", "#D8F3DC", "#E8F5E9"]
    });
  };

  const notify = (msg, isErr = false) => {
    if (isErr) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(""), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(""), 4000);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const endpoint = isRegister ? `${API}/auth/register` : `${API}/auth/login`;
    const payload = isRegister
      ? { name: authForm.name, email: authForm.email, password: authForm.password }
      : { email: authForm.email, password: authForm.password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (isRegister) {
        notify("Account created! Please sign in.");
        setIsRegister(false);
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setView(data.user.role === "admin" ? "orders" : "paintings");
        triggerGreenConfetti();
        notify(`Welcome, ${data.user.name}!`);
      }
    } catch (err) {
      notify(err.message, true);
    }
  };

  const logout = () => {
    localStorage.clear();
    setToken("");
    setUser(null);
    setPaintings([]);
    setOrders([]);
    setWallBookings([]);
    setPotteryRequests([]);
    setView("paintings");
  };

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [cfgRes, pRes, oRes, wRes, potRes, datesRes] = await Promise.all([
        fetch(`${API}/config`),
        fetch(`${API}/paintings`),
        fetch(`${API}/orders`, { headers }),
        fetch(`${API}/wall-bookings`, { headers }),
        fetch(`${API}/pottery-requests`, { headers }),
        fetch(`${API}/wall-bookings/booked-dates`)
      ]);

      if (cfgRes.ok) setConfig(await cfgRes.json());
      if (pRes.ok) setPaintings(await pRes.json());
      if (oRes.ok) setOrders(await oRes.json());
      if (wRes.ok) setWallBookings(await wRes.json());
      if (potRes.ok) setPotteryRequests(await potRes.json());
      if (datesRes.ok) setBookedDates(await datesRes.json());
    } catch (err) {
      notify("Could not load studio data", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const buyPainting = async (id, title) => {
    try {
      const res = await fetch(`${API}/paintings/${id}/buy`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      triggerGreenConfetti();
      notify(`Successfully acquired "${title}"!`);
      setSelectedPainting(null);
      loadData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const cancelOrder = async (id, title) => {
    try {
      const res = await fetch(`${API}/orders/${id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCancellationModal({
        open: true,
        title: "Order Cancelled",
        message: `Your acquisition for "${title}" has been cancelled. The painting is now restored to the gallery.`
      });
      loadData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const computedArea = wallDimensions.width * wallDimensions.height;
  const computedPrice = computedArea * (config?.wallRatePerSqFt || 25);
  const isDateAlreadyBooked = bookedDates.includes(wallDate);

  const submitWallBooking = async (e) => {
    e.preventDefault();
    if (computedArea < 10 || computedArea > 500) {
      return notify("Total wall area must be between 10 and 500 sq ft", true);
    }
    if (isDateAlreadyBooked) {
      return notify("This date has already been booked by another customer. Please choose another.", true);
    }

    try {
      const res = await fetch(`${API}/wall-bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          date: wallDate,
          wallSize: computedArea,
          address: wallAddress
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      triggerGreenConfetti();
      notify("Wall commission requested successfully!");
      setWallDate("");
      setWallAddress("");
      loadData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const cancelWallBooking = async (id, date) => {
    try {
      const res = await fetch(`${API}/wall-bookings/${id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCancellationModal({
        open: true,
        title: "Booking Cancelled",
        message: `Your mural painting booking for ${date} has been cancelled.`
      });
      loadData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const submitPotteryRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/pottery-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(potteryForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      triggerGreenConfetti();
      notify("Ceramic commission submitted to kiln queue!");
      loadData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const cancelPotteryRequest = async (id, item) => {
    try {
      const res = await fetch(`${API}/pottery-requests/${id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCancellationModal({
        open: true,
        title: "Request Cancelled",
        message: `Your ceramic commission for "${item}" has been withdrawn.`
      });
      loadData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      const res = await fetch(`${API}/wall-bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      notify(`Booking status updated to ${status}`);
      loadData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const updatePotteryStatus = async (id, status) => {
    try {
      const res = await fetch(`${API}/pottery-requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      notify(`Pottery request status marked as ${status}`);
      loadData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const addPainting = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/paintings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(paintingForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      triggerGreenConfetti();
      notify("New artwork published!");
      setPaintingForm({ title: "", description: "", price: "", imageUrl: "" });
      loadData();
    } catch (err) {
      notify(err.message, true);
    }
  };

  const fillSample = (role) => {
    if (role === "admin") {
      setAuthRole("admin");
      setIsRegister(false);
      setAuthForm({ name: "", email: "studio@artstudio.com", password: "admin123" });
    } else {
      setAuthRole("customer");
      setIsRegister(false);
      setAuthForm({ name: "", email: "alice@example.com", password: "password123" });
    }
  };

  const getMinMaxWallDates = () => {
    const today = new Date();
    const minD = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const maxD = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
    return {
      min: minD.toISOString().split("T")[0],
      max: maxD.toISOString().split("T")[0]
    };
  };

  const getMinPotteryDate = () => {
    const minD = new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000);
    return minD.toISOString().split("T")[0];
  };

  const displayedPaintings = paintings.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" ? true : p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderCeramicSVG = (item, glazeName) => {
    const glaze = GLAZE_PROPERTIES[glazeName] || GLAZE_PROPERTIES["Cobalt Blue"];
    
    if (item === "Flower Vase") {
      return (
        <svg viewBox="0 0 100 130" width="100" height="130" style={{ filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.15))" }}>
          <path d="M 35 10 L 65 10 L 60 40 Q 85 75 70 120 L 30 120 Q 15 75 40 40 Z" fill={glaze.color} stroke={glaze.border} strokeWidth="2.5" />
          <ellipse cx="50" cy="10" rx="15" ry="3" fill="#ffffff" fillOpacity="0.4" />
          <path d="M 40 50 Q 55 75 48 115" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />
        </svg>
      );
    } else if (item === "Serving Bowl") {
      return (
        <svg viewBox="0 0 140 80" width="140" height="80" style={{ filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.15))" }}>
          <path d="M 10 20 Q 70 100 130 20 Z" fill={glaze.color} stroke={glaze.border} strokeWidth="2.5" />
          <ellipse cx="70" cy="20" rx="60" ry="10" fill={glaze.border} opacity="0.2" />
          <path d="M 25 35 Q 70 80 115 35" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.3" />
        </svg>
      );
    } else if (item === "Succulent Planter" || item === "Planter") {
      return (
        <svg viewBox="0 0 100 100" width="100" height="100" style={{ filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.15))" }}>
          <path d="M 20 20 L 80 20 L 70 90 L 30 90 Z" fill={glaze.color} stroke={glaze.border} strokeWidth="2.5" />
          <line x1="20" y1="20" x2="80" y2="20" stroke={glaze.border} strokeWidth="3" />
          <circle cx="50" cy="55" r="10" fill="#ffffff" opacity="0.25" />
        </svg>
      );
    } else {
      return (
        <svg viewBox="0 0 120 100" width="120" height="100" style={{ filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.15))" }}>
          <rect x="20" y="20" width="60" height="70" rx="8" fill={glaze.color} stroke={glaze.border} strokeWidth="2.5" />
          <path d="M 80 35 C 105 35 105 75 80 75" fill="none" stroke={glaze.border} strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="50" cy="22" rx="28" ry="4" fill="#ffffff" opacity="0.35" />
          <path d="M 32 30 L 32 80" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
        </svg>
      );
    }
  };

  // ----------------------------------------------------
  // GUEST SCREEN (Fresh Launch)
  // ----------------------------------------------------
  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div className="card" style={{ maxWidth: 460, width: "100%", padding: 36, borderTop: "6px solid var(--green-primary)" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <span style={{ fontSize: 44 }}>🌿</span>
            <h2 style={{ margin: "8px 0 4px", fontSize: 28, color: "var(--green-primary)" }}>Art Studio</h2>
            <p style={{ margin: 0, color: "var(--taupe)", fontSize: 14 }}>
              Sign in to explore paintings, book wall art, and order custom pottery.
            </p>
          </div>

          <div style={{ display: "flex", background: "var(--green-light)", padding: 4, borderRadius: 12, marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => { setAuthRole("customer"); setIsRegister(false); }}
              style={{
                flex: 1,
                background: authRole === "customer" ? "white" : "transparent",
                color: authRole === "customer" ? "var(--green-primary)" : "var(--taupe)",
                boxShadow: authRole === "customer" ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
              }}
            >
              Customer Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthRole("admin"); setIsRegister(false); }}
              style={{
                flex: 1,
                background: authRole === "admin" ? "white" : "transparent",
                color: authRole === "admin" ? "var(--green-primary)" : "var(--taupe)",
                boxShadow: authRole === "admin" ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
              }}
            >
              Studio Staff Sign In
            </button>
          </div>

          {errorMsg && (
            <div style={{ background: "#FDE8E8", color: "#C53030", padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 13, border: "1px solid #FEB2B2" }}>
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div style={{ background: "#D8F3DC", color: "#1B4332", padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 13, border: "1px solid #B7E4C7" }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {isRegister && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--taupe)" }}>Full Name</label>
                <input
                  required
                  placeholder="e.g. Maya Patel"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--taupe)" }}>Email Address</label>
              <input
                type="email"
                required
                placeholder={authRole === "admin" ? "studio@artstudio.com" : "alice@example.com"}
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--taupe)" }}>Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: 8, padding: "12px 18px" }}>
              {isRegister ? "Create Customer Account" : (authRole === "admin" ? "Sign In as Studio Admin" : "Sign In to Studio")}
            </button>

            {authRole === "customer" && (
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                style={{ background: "none", color: "var(--green-primary)", padding: 6, fontSize: 13 }}
              >
                {isRegister ? "Already have an account? Sign In" : "Need an account? Register as Customer"}
              </button>
            )}
          </form>

          <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--border-soft)", textAlign: "center" }}>
            <span style={{ fontSize: 12, color: "var(--taupe)", display: "block", marginBottom: 8 }}>
              ⚡ <strong>One-Click Auto Fill:</strong>
            </span>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button type="button" className="btn-secondary" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => fillSample("customer")}>
                👤 Alice (Customer)
              </button>
              <button type="button" className="btn-secondary" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => fillSample("admin")}>
                🎨 Studio (Admin)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // LOGGED IN DASHBOARD
  // ----------------------------------------------------
  return (
    <div style={{ minHeight: "100vh", paddingBottom: 60 }}>
      {/* Cancellation Modal */}
      {cancellationModal.open && (
        <div className="modal-overlay" onClick={() => setCancellationModal({ ...cancellationModal, open: false })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FDE8E8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24, color: "#C53030" }}>
              ✕
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 22 }}>{cancellationModal.title}</h3>
            <p style={{ margin: "0 0 24px", color: "var(--taupe)", fontSize: 14, lineHeight: 1.5 }}>
              {cancellationModal.message}
            </p>
            <button className="btn-primary" style={{ width: "100%" }} onClick={() => setCancellationModal({ ...cancellationModal, open: false })}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Details & "View in Room" Modal */}
      {selectedPainting && (
        <div className="modal-overlay" onClick={() => { setSelectedPainting(null); setPreviewInRoom(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640, textAlign: "left", padding: 28 }}>
            <div style={{ position: "relative", width: "100%", height: 320, borderRadius: 14, overflow: "hidden", marginBottom: 18, background: "#E8F5E9" }}>
              {previewInRoom ? (
                <div style={{ position: "relative", width: "100%", height: "100%", background: "#E2ECE5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img
                    src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900"
                    alt="Interior Wall Mockup"
                    style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.9)" }}
                  />
                  <div style={{ position: "absolute", top: "25%", width: 140, boxShadow: "0 14px 28px rgba(0,0,0,0.45)", border: "4px solid #1E2D24" }}>
                    <img src={selectedPainting.imageUrl} alt={selectedPainting.title} style={{ width: "100%", display: "block" }} />
                  </div>
                  <span style={{ position: "absolute", bottom: 10, left: 14, background: "rgba(0,0,0,0.6)", color: "white", padding: "4px 8px", borderRadius: 6, fontSize: 11 }}>
                    Living Room Scale Preview
                  </span>
                </div>
              ) : (
                <>
                  <img src={selectedPainting.imageUrl} alt={selectedPainting.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <span className={`badge badge-${selectedPainting.status}`} style={{ position: "absolute", top: 12, right: 12 }}>
                    {selectedPainting.status}
                  </span>
                </>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 24 }}>{selectedPainting.title}</h3>
                <button
                  type="button"
                  onClick={() => setPreviewInRoom(!previewInRoom)}
                  style={{ background: "none", border: "none", color: "var(--green-primary)", padding: 0, fontSize: 13, textDecoration: "underline" }}
                >
                  {previewInRoom ? "← View Original Artwork" : "🖼️ Simulate 'View in a Room'"}
                </button>
              </div>
              <span style={{ fontSize: 24, fontWeight: 700, color: "var(--green-primary)" }}>
                ${selectedPainting.price}
              </span>
            </div>

            <div style={{ background: "var(--green-light)", padding: 14, borderRadius: 12, margin: "14px 0" }}>
              <h5 style={{ margin: "0 0 4px", fontSize: 12, textTransform: "uppercase", color: "var(--taupe)", letterSpacing: 0.5 }}>
                Artwork Specifications:
              </h5>
              <p style={{ margin: 0, fontSize: 14, color: "var(--charcoal)", lineHeight: 1.6 }}>
                {selectedPainting.description}
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              {user.role === "customer" && selectedPainting.status === "available" && (
                <button
                  className="btn-primary"
                  style={{ flex: 1.3, padding: "12px 18px" }}
                  onClick={() => buyPainting(selectedPainting._id, selectedPainting.title)}
                >
                  Acquire This Artwork
                </button>
              )}
              <button
                className="btn-secondary"
                style={{ flex: 1, padding: "12px 18px" }}
                onClick={() => { setSelectedPainting(null); setPreviewInRoom(false); }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header style={{ background: "white", borderBottom: "1px solid var(--border-soft)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1150, margin: "0 auto", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 30 }}>🌿</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, color: "var(--green-primary)" }}>Art Studio</h2>
              <small style={{ color: "var(--taupe)", fontSize: 12 }}>Paintings · Wall Murals · Custom Pottery</small>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
              <span className={`badge ${user.role === "admin" ? "badge-available" : "badge-placed"}`} style={{ fontSize: 10, padding: "2px 8px" }}>
                {user.role === "admin" ? "Studio Staff" : "Customer"}
              </span>
            </div>
            <button onClick={logout} className="btn-secondary" style={{ padding: "8px 14px", fontSize: 13 }}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main style={{ maxWidth: 1150, margin: "28px auto", padding: "0 24px" }}>
        {errorMsg && (
          <div style={{ background: "#FDE8E8", color: "#C53030", padding: 14, borderRadius: 12, marginBottom: 20, border: "1px solid #FEB2B2" }}>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ background: "#D8F3DC", color: "#1B4332", padding: 14, borderRadius: 12, marginBottom: 20, border: "1px solid #B7E4C7" }}>
            {successMsg}
          </div>
        )}

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, overflowX: "auto" }}>
          <button onClick={() => setView("paintings")} className={view === "paintings" ? "btn-primary" : "btn-secondary"}>
            🎨 Gallery Artworks ({paintings.length})
          </button>
          <button onClick={() => setView("wall")} className={view === "wall" ? "btn-primary" : "btn-secondary"}>
            🖌️ Wall Mural Simulator
          </button>
          <button onClick={() => setView("pottery")} className={view === "pottery" ? "btn-primary" : "btn-secondary"}>
            🏺 Custom Ceramic Studio
          </button>
          <button onClick={() => setView("orders")} className={view === "orders" ? "btn-primary" : "btn-secondary"}>
            {user.role === "admin" ? "📋 Studio Management & Logs" : "📦 My Orders & Bookings"}
          </button>
        </div>

        {loading && <p style={{ color: "var(--taupe)", fontStyle: "italic" }}>Synchronizing studio database...</p>}

        {/* VIEW 1: PAINTINGS */}
        {view === "paintings" && (
          <div>
            {user.role === "admin" && (
              <div className="card" style={{ marginBottom: 32, background: "var(--green-light)" }}>
                <h3 style={{ margin: "0 0 6px", fontSize: 20 }}>Studio Admin: Add New Artwork</h3>
                <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--taupe)" }}>
                  Each painting is strictly one-of-a-kind and can be bought only once.
                </p>
                <form onSubmit={addPainting} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <input
                    placeholder="Painting Title"
                    required
                    value={paintingForm.title}
                    onChange={(e) => setPaintingForm({ ...paintingForm, title: e.target.value })}
                  />
                  <input
                    placeholder="Price ($)"
                    type="number"
                    required
                    value={paintingForm.price}
                    onChange={(e) => setPaintingForm({ ...paintingForm, price: e.target.value })}
                  />
                  <input
                    placeholder="Description (Medium, dimensions, palette)"
                    style={{ gridColumn: "span 2" }}
                    value={paintingForm.description}
                    onChange={(e) => setPaintingForm({ ...paintingForm, description: e.target.value })}
                  />
                  <input
                    placeholder="Image URL"
                    style={{ gridColumn: "span 2" }}
                    value={paintingForm.imageUrl}
                    onChange={(e) => setPaintingForm({ ...paintingForm, imageUrl: e.target.value })}
                  />
                  <button type="submit" className="btn-primary" style={{ gridColumn: "span 2" }}>
                    Publish to Gallery
                  </button>
                </form>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 280 }}>
                <input
                  placeholder="🔎 Search by title or medium..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ maxWidth: 320 }}
                />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 160 }}>
                  <option value="all">All Pieces</option>
                  <option value="available">Available Only</option>
                  <option value="sold">Sold Pieces</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 22 }}>
              {displayedPaintings.map((p) => (
                <div key={p._id} className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div
                    style={{ position: "relative", height: 210, background: "#E8F5E9", cursor: "pointer" }}
                    onClick={() => setSelectedPainting(p)}
                  >
                    <img src={p.imageUrl} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <span className={`badge badge-${p.status}`} style={{ position: "absolute", top: 12, right: 12 }}>
                      {p.status}
                    </span>
                  </div>

                  <div style={{ padding: 18, display: "flex", flexDirection: "column", flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <h4 style={{ margin: 0, fontSize: 17 }}>{p.title}</h4>
                      <span style={{ fontSize: 18, fontWeight: 700, color: "var(--green-primary)" }}>${p.price}</span>
                    </div>

                    <p style={{ fontSize: 13, color: "var(--taupe)", margin: "10px 0 16px", flex: 1, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {p.description}
                    </p>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ flex: 1, padding: "8px 10px", fontSize: 12 }}
                        onClick={() => setSelectedPainting(p)}
                      >
                        🔍 Details
                      </button>

                      {user.role === "customer" && p.status === "available" && (
                        <button
                          onClick={() => buyPainting(p._id, p.title)}
                          className="btn-primary"
                          style={{ flex: 1.4, padding: "8px 12px", fontSize: 12 }}
                        >
                          Acquire
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: WALL MURAL SIMULATOR */}
        {view === "wall" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
            <div className="card" style={{ textAlign: "center" }}>
              <h4 style={{ margin: "0 0 4px", fontSize: 18 }}>Live Wall Aspect-Ratio Preview</h4>
              <p style={{ fontSize: 13, color: "var(--taupe)", margin: "0 0 16px" }}>
                Proportional scaling of your wall surface ({wallDimensions.width} ft &times; {wallDimensions.height} ft)
              </p>

              <div style={{
                height: 260,
                background: "#E2ECE5",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed var(--border-soft)",
                padding: 16
              }}>
                <div style={{
                  width: `${Math.min(260, wallDimensions.width * 11)}px`,
                  height: `${Math.min(220, wallDimensions.height * 11)}px`,
                  background: "linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)",
                  borderRadius: 6,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  boxShadow: "0 10px 25px rgba(45, 106, 79, 0.3)",
                  transition: "all 0.2s ease"
                }}>
                  <strong style={{ fontSize: 16 }}>{computedArea} sq ft</strong>
                  <span style={{ fontSize: 12, opacity: 0.9 }}>${computedPrice}</span>
                </div>
              </div>

              <div style={{ marginTop: 14, background: "var(--green-light)", padding: 12, borderRadius: 10, fontSize: 13 }}>
                Formula: {wallDimensions.width} ft &times; {wallDimensions.height} ft = <strong>{computedArea} sq ft</strong> &times; ${config?.wallRatePerSqFt || 25}/sq ft = <strong style={{ color: "var(--green-primary)" }}>${computedPrice}</strong>
              </div>
            </div>

            <div className="card">
              <h3 style={{ margin: "0 0 6px", fontSize: 22 }}>Commission a Wall Mural</h3>
              <p style={{ margin: "0 0 18px", color: "var(--taupe)", fontSize: 13 }}>
                Dates must be 7 to 90 days away. Each date can be booked only once.
              </p>

              {user.role === "customer" ? (
                <form onSubmit={submitWallBooking} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600 }}>Width (ft): {wallDimensions.width}</label>
                      <input
                        type="range"
                        min="2"
                        max="25"
                        value={wallDimensions.width}
                        onChange={(e) => setWallDimensions({ ...wallDimensions, width: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600 }}>Height (ft): {wallDimensions.height}</label>
                      <input
                        type="range"
                        min="2"
                        max="20"
                        value={wallDimensions.height}
                        onChange={(e) => setWallDimensions({ ...wallDimensions, height: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Service Date (7–90 Days Away)</label>
                    <input
                      type="date"
                      required
                      min={getMinMaxWallDates().min}
                      max={getMinMaxWallDates().max}
                      value={wallDate}
                      onChange={(e) => setWallDate(e.target.value)}
                    />
                    {isDateAlreadyBooked && (
                      <small style={{ color: "#C53030", fontWeight: 600, display: "block", marginTop: 4 }}>
                        ⚠️ This date is already booked! Please select another date.
                      </small>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Installation Address</label>
                    <input
                      placeholder="Street address for mural painting"
                      required
                      value={wallAddress}
                      onChange={(e) => setWallAddress(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isDateAlreadyBooked || computedArea < 10 || computedArea > 500}
                    className="btn-primary"
                    style={{ opacity: isDateAlreadyBooked ? 0.5 : 1 }}
                  >
                    {isDateAlreadyBooked ? "Date Unavailable" : "Reserve Wall Date"}
                  </button>
                </form>
              ) : (
                <div style={{ padding: 18, background: "var(--green-light)", borderRadius: 12, textAlign: "center", color: "var(--taupe)" }}>
                  Studio Admins confirm or decline requests under <strong>Studio Management & Logs</strong>.
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: CERAMIC STUDIO CUSTOMIZER */}
        {view === "pottery" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
            <div className="card" style={{ textAlign: "center" }}>
              <h4 style={{ margin: "0 0 6px", fontSize: 18 }}>Wheel-Thrown Vessel Customizer</h4>
              <p style={{ fontSize: 13, color: "var(--taupe)", margin: "0 0 20px" }}>
                Real-time mineral glaze and oxide rendering
              </p>

              <div style={{
                height: 240,
                background: "#E8F5E9",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed var(--border-soft)",
                marginBottom: 16
              }}>
                {renderCeramicSVG(potteryForm.item, potteryForm.glaze)}
              </div>

              <div style={{ textAlign: "left", background: "#FDFEFD", border: "1px solid var(--border-soft)", padding: 14, borderRadius: 10 }}>
                <strong style={{ fontSize: 12, textTransform: "uppercase", color: "var(--taupe)", display: "block", marginBottom: 8 }}>
                  Kiln & Curing Schedule (14-Day Minimum Lead Time):
                </strong>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <div>⏳ <strong>Day 1:</strong> Wheel Shaping</div>
                  <div>🔥 <strong>Day 7:</strong> Bisque Fire</div>
                  <div>✨ <strong>Day 14+:</strong> Glaze & Delivery</div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ margin: "0 0 6px", fontSize: 22 }}>Custom Pottery Request</h3>
              <p style={{ margin: "0 0 18px", color: "var(--taupe)", fontSize: 13 }}>
                Select an item and glaze from seed data. Quantity: 1–12 pieces.
              </p>

              {user.role === "customer" ? (
                <form onSubmit={submitPotteryRequest} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Ceramic Item</label>
                    <select
                      required
                      value={potteryForm.item}
                      onChange={(e) => setPotteryForm({ ...potteryForm, item: e.target.value })}
                    >
                      {config?.potteryItems.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Glaze Finish</label>
                    <select
                      required
                      value={potteryForm.glaze}
                      onChange={(e) => setPotteryForm({ ...potteryForm, glaze: e.target.value })}
                    >
                      {config?.potteryGlazes.map((glaze) => (
                        <option key={glaze} value={glaze}>{glaze}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Quantity (1–12 pieces): {potteryForm.quantity}</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={potteryForm.quantity}
                      onChange={(e) => setPotteryForm({ ...potteryForm, quantity: Number(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Needed-by Date (At least 14 days out)</label>
                    <input
                      type="date"
                      required
                      min={getMinPotteryDate()}
                      value={potteryForm.neededByDate}
                      onChange={(e) => setPotteryForm({ ...potteryForm, neededByDate: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>
                    Submit Ceramic Commission
                  </button>
                </form>
              ) : (
                <div style={{ padding: 18, background: "var(--green-light)", borderRadius: 12, textAlign: "center", color: "var(--taupe)" }}>
                  Studio Admins accept or decline pottery orders under <strong>Studio Management & Logs</strong>.
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: ORDERS & LOGS */}
        {view === "orders" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <h3 style={{ margin: 0, fontSize: 24 }}>
              {user.role === "admin" ? "Studio Management & Fulfillment Logs" : "My Orders & Bookings"}
            </h3>

            <div>
              <h4 style={{ margin: "0 0 14px", fontSize: 18 }}>Art Acquisitions</h4>
              {orders.length === 0 ? (
                <div className="card" style={{ color: "var(--taupe)", padding: 20 }}>No painting orders placed yet.</div>
              ) : (
                orders.map((o) => (
                  <div key={o._id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>{o.painting?.title || "Canvas Artwork"}</div>
                      <div style={{ fontSize: 13, color: "var(--taupe)", marginTop: 4 }}>
                        Collector: {o.customer?.name} ({o.customer?.email}) · Amount: <strong>${o.price}</strong>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span className={`badge badge-${o.status}`}>{o.status}</span>
                      {user.role === "customer" && o.status === "placed" && (
                        <button onClick={() => cancelOrder(o._id, o.painting?.title)} className="btn-danger">
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div>
              <h4 style={{ margin: "0 0 14px", fontSize: 18 }}>Wall Painting Bookings</h4>
              {wallBookings.length === 0 ? (
                <div className="card" style={{ color: "var(--taupe)", padding: 20 }}>No wall bookings recorded.</div>
              ) : (
                wallBookings.map((b) => (
                  <div key={b._id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>Mural on {b.date} ({b.wallSize} sq ft)</div>
                      <div style={{ fontSize: 13, color: "var(--taupe)", marginTop: 4 }}>
                        Address: {b.address} · Total: <strong>${b.price}</strong> · Client: {b.customer?.name}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className={`badge badge-${b.status}`}>{b.status}</span>
                      {user.role === "admin" && b.status === "requested" && (
                        <>
                          <button onClick={() => updateBookingStatus(b._id, "confirmed")} className="btn-primary">
                            Confirm
                          </button>
                          <button onClick={() => updateBookingStatus(b._id, "declined")} className="btn-danger">
                            Decline
                          </button>
                        </>
                      )}
                      {user.role === "customer" && b.status !== "cancelled" && (
                        <button onClick={() => cancelWallBooking(b._id, b.date)} className="btn-danger">
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div>
              <h4 style={{ margin: "0 0 14px", fontSize: 18 }}>Custom Ceramics & Pottery</h4>
              {potteryRequests.length === 0 ? (
                <div className="card" style={{ color: "var(--taupe)", padding: 20 }}>No pottery requests found.</div>
              ) : (
                potteryRequests.map((p) => (
                  <div key={p._id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>
                        {p.quantity}x {p.item} ({p.glaze})
                      </div>
                      <div style={{ fontSize: 13, color: "var(--taupe)", marginTop: 4 }}>
                        Needed by: {p.neededByDate} · Client: {p.customer?.name}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className={`badge badge-${p.status}`}>{p.status}</span>
                      {user.role === "admin" && p.status === "requested" && (
                        <>
                          <button onClick={() => updatePotteryStatus(p._id, "accepted")} className="btn-primary">
                            Accept
                          </button>
                          <button onClick={() => updatePotteryStatus(p._id, "declined")} className="btn-danger">
                            Decline
                          </button>
                        </>
                      )}
                      {user.role === "customer" && p.status === "requested" && (
                        <button onClick={() => cancelPotteryRequest(p._id, p.item)} className="btn-danger">
                          Cancel Commission
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}