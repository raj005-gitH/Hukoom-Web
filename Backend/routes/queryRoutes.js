const express = require("express");
const router = express.Router();
const ServiceQuery = require("../models/ServiceQuery");
const Hero = require("../models/Hero");

// Middleware to check authentication and authorization roles
function checkRole(allowedRoles, allowSelfUser = false) {
  return (req, res, next) => {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];

    if (!userId || !userRole) {
      return res.status(401).json({ message: "Unauthorized. Missing session headers." });
    }

    // If the role is allowed, proceed
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // If user is accessing their own queries, and allowSelfUser is true
    if (allowSelfUser && userRole === "user" && req.params.userId === userId) {
      return next();
    }

    return res.status(403).json({ message: "Forbidden. Access denied." });
  };
}

// Predefined areas for supported cities
const CITY_AREAS = {
  noida: [
    "Unavailable :)",    
  ],
  "greater noida": [    
    "Delta 2"    
  ]
};

// Helper: expire stale queries
async function expireStaleQueries() {
  const now = new Date();
  
  // 1. Expire open queries that haven't been picked up
  await ServiceQuery.updateMany(
    { status: "open", expiresAt: { $lt: now } },
    { $set: { status: "expired" } }
  );

  // 2. Auto-complete in-progress queries that reached expiry
  await ServiceQuery.updateMany(
    { status: "in_progress", expiresAt: { $lt: now } },
    { $set: { status: "completed" } }
  );
}

// GET /api/city-areas/:city — Get predefined areas for a city
router.get("/city-areas/:city", (req, res) => {
  const city = req.params.city.toLowerCase().trim();
  const areas = CITY_AREAS[city];
  if (!areas) {
    return res.status(404).json({ message: "City not supported yet", supportedCities: Object.keys(CITY_AREAS) });
  }
  res.json({ city, areas });
});

// GET /api/supported-cities — Get list of supported cities
router.get("/supported-cities", (req, res) => {
  res.json({ cities: Object.keys(CITY_AREAS).map(c => c.charAt(0).toUpperCase() + c.slice(1)) });
});

// POST /api/queries — Create a new service query
router.post("/queries", checkRole(["user"]), async (req, res) => {
  try {
    const { userName, userId, city, area, houseNumber, workDescription, price, expiryMinutes } = req.body;

    // Validate required fields
    if (!userName || !userId || !city || !area || !houseNumber || !workDescription || !price || !expiryMinutes) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate expiry (15 min to 15 days = 21600 min)
    const minutes = Number(expiryMinutes);
    if (minutes < 15 || minutes > 21600) {
      return res.status(400).json({ message: "Expiry must be between 15 minutes and 15 days" });
    }

    // Validate city
    const cityLower = city.toLowerCase().trim();
    if (!CITY_AREAS[cityLower]) {
      return res.status(400).json({ message: "City not supported", supportedCities: Object.keys(CITY_AREAS) });
    }

    // Validate area
    if (!CITY_AREAS[cityLower].includes(area)) {
      return res.status(400).json({ message: "Area not found in this city" });
    }

    const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

    const query = new ServiceQuery({
      userName,
      userId,
      city: cityLower,
      area,
      houseNumber,
      workDescription,
      price: Number(price),
      expiresAt,
    });

    await query.save();

    res.status(201).json({ message: "Query posted successfully", query });
  } catch (error) {
    console.log("Error creating query:", error);
    res.status(500).json({ message: "Error creating query", error: error.message });
  }
});

// GET /api/queries/areas/:city — Get areas with active query counts for a city (hero view)
router.get("/queries/areas/:city", checkRole(["hero"]), async (req, res) => {
  try {
    await expireStaleQueries();

    const city = req.params.city.toLowerCase().trim();
    if (!CITY_AREAS[city]) {
      return res.status(404).json({ message: "City not supported" });
    }

    const areaCounts = await ServiceQuery.aggregate([
      { $match: { city, status: { $in: ["open", "in_progress"] } } },
      { $group: { _id: "$area", count: { $sum: 1 }, openCount: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } } } },
      { $sort: { count: -1 } }
    ]);

    res.json({ city, areas: areaCounts });
  } catch (error) {
    console.log("Error fetching areas:", error);
    res.status(500).json({ message: "Error fetching areas", error: error.message });
  }
});

// GET /api/queries/user/:userId — Get all queries posted by a specific user
router.get("/queries/user/:userId", checkRole(["hero"], true), async (req, res) => {
  try {
    await expireStaleQueries();

    const queries = await ServiceQuery.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ queries });
  } catch (error) {
    console.log("Error fetching user queries:", error);
    res.status(500).json({ message: "Error fetching user queries", error: error.message });
  }
});

// GET /api/queries/hero/:heroId — Get all queries accepted by a specific hero
router.get("/queries/hero/:heroId", checkRole(["hero"]), async (req, res) => {
  try {
    // Ensure the logged-in hero can only view their own jobs
    if (req.headers["x-user-id"] !== req.params.heroId) {
      return res.status(403).json({ message: "Forbidden. Access denied." });
    }

    await expireStaleQueries();

    const queries = await ServiceQuery.find({ heroId: req.params.heroId }).sort({ createdAt: -1 });
    res.json({ queries });
  } catch (error) {
    console.log("Error fetching hero queries:", error);
    res.status(500).json({ message: "Error fetching hero queries", error: error.message });
  }
});

// GET /api/queries/city/:city — Get all active queries in a city (hero dashboard view)
router.get("/queries/city/:city", checkRole(["hero"]), async (req, res) => {
  try {
    await expireStaleQueries();

    const city = req.params.city.toLowerCase().trim();
    if (!CITY_AREAS[city]) {
      return res.status(404).json({ message: "City not supported" });
    }

    const queries = await ServiceQuery.find({
      city,
      status: "open",
    }).sort({ createdAt: -1 });

    res.json(queries);
  } catch (error) {
    console.log("Error fetching queries for city:", error);
    res.status(500).json({ message: "Error fetching queries for city", error: error.message });
  }
});

// GET /api/queries/all — Get ALL open queries across all cities (hero dashboard view)
router.get("/queries/all", checkRole(["hero"]), async (req, res) => {
  try {
    await expireStaleQueries();

    const queries = await ServiceQuery.find({
      status: "open",
    }).sort({ createdAt: -1 });

    res.json(queries);
  } catch (error) {
    console.log("Error fetching all queries:", error);
    res.status(500).json({ message: "Error fetching all queries", error: error.message });
  }
});

// GET /api/queries/:city/:area — Get all active queries for an area (hero chatroom view)
// NOTE: This wildcard route MUST come AFTER all specific /queries/... routes
router.get("/queries/:city/:area", checkRole(["hero"]), async (req, res) => {
  try {
    await expireStaleQueries();

    const city = req.params.city.toLowerCase().trim();
    const area = decodeURIComponent(req.params.area).trim();

    const queries = await ServiceQuery.find({
      city,
      area,
      status: { $in: ["open", "in_progress"] }
    }).sort({ createdAt: -1 });

    res.json({ city, area, queries });
  } catch (error) {
    console.log("Error fetching queries:", error);
    res.status(500).json({ message: "Error fetching queries", error: error.message });
  }
});

// PATCH /api/queries/:id/accept — Hero accepts a query
router.patch("/queries/:id/accept", checkRole(["hero"]), async (req, res) => {
  try {
    const { heroId, heroName } = req.body;

    if (!heroId || !heroName) {
      return res.status(400).json({ message: "heroId and heroName are required" });
    }

    // Ensure the heroId in request body matches the authorized user session
    if (req.headers["x-user-id"] !== heroId) {
      return res.status(403).json({ message: "Forbidden. Hero ID mismatch." });
    }

    const query = await ServiceQuery.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ message: "Query not found" });
    }

    // Check if already expired
    if (query.expiresAt < new Date()) {
      query.status = "expired";
      await query.save();
      return res.status(400).json({ message: "This query has expired" });
    }

    if (query.status !== "open") {
      return res.status(400).json({ message: `Query is already ${query.status}` });
    }

    // Check if hero is barred (3 cancellations in last 24h)
    const hero = await Hero.findById(heroId);
    if (!hero) return res.status(404).json({ message: "Hero not found" });

    if (hero.barredUntil && hero.barredUntil > new Date()) {
      const waitTime = Math.ceil((hero.barredUntil - new Date()) / (1000 * 60 * 60));
      return res.status(403).json({ 
        message: `You are temporarily barred from accepting new work due to frequent cancellations. Please try again in ${waitTime} hour(s).` 
      });
    }

    // Check if hero already has an active in-progress job
    const activeJob = await ServiceQuery.findOne({ heroId, status: "in_progress" });
    if (activeJob) {
      return res.status(400).json({
        message: "You already have an active job in progress. Complete or cancel it before accepting a new one.",
        activeJobId: activeJob._id,
      });
    }

    query.status = "in_progress";
    query.heroId = heroId;
    query.heroName = heroName;
    await query.save();

    res.json({ message: "Query accepted successfully", query });
  } catch (error) {
    console.log("Error accepting query:", error);
    res.status(500).json({ message: "Error accepting query", error: error.message });
  }
});

// PATCH /api/queries/:id/complete — User marks query as completed
router.patch("/queries/:id/complete", checkRole(["user"]), async (req, res) => {
  try {
    const query = await ServiceQuery.findById(req.params.id);

    if (!query) return res.status(404).json({ message: "Query not found" });
    if (query.userId.toString() !== req.headers["x-user-id"]) {
      return res.status(403).json({ message: "Only the user who posted this query can mark it as completed" });
    }
    if (query.status !== "in_progress") {
      return res.status(400).json({ message: `Cannot complete a query that is ${query.status}` });
    }

    query.status = "completed";
    await query.save();
    res.json({ message: "Work marked as completed successfully", query });
  } catch (error) {
    res.status(500).json({ message: "Error completing query", error: error.message });
  }
});

// PATCH /api/queries/:id/cancel — Hero cancels accepted work
router.patch("/queries/:id/cancel", checkRole(["hero"]), async (req, res) => {
  try {
    const query = await ServiceQuery.findById(req.params.id);

    if (!query) return res.status(404).json({ message: "Query not found" });
    if (!query.heroId || query.heroId.toString() !== req.headers["x-user-id"]) {
      return res.status(403).json({ message: "Only the hero who accepted this work can cancel it" });
    }
    if (query.status !== "in_progress") {
      return res.status(400).json({ message: "Only in-progress work can be cancelled" });
    }

    // Update Query: move back to open
    query.status = "open";
    query.heroId = null;
    query.heroName = null;
    await query.save();

    // Update Hero: record cancellation and check limit
    const hero = await Hero.findById(heroId);
    if (hero) {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Filter previous cancellations within last 24h
      hero.cancellations = hero.cancellations.filter(date => date > twentyFourHoursAgo);
      hero.cancellations.push(now);

      if (hero.cancellations.length >= 3) {
        hero.barredUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      }
      await hero.save();
    }

    res.json({ 
      message: "Work cancelled successfully. The query is now open for other heroes.",
      cancellationsCount: hero ? hero.cancellations.length : 0 
    });
  } catch (error) {
    res.status(500).json({ message: "Error cancelling query", error: error.message });
  }
});


// PATCH /api/queries/:id/reject — User rejects the accepted hero
router.patch("/queries/:id/reject", checkRole(["user"]), async (req, res) => {
  try {
    const query = await ServiceQuery.findById(req.params.id);

    if (!query) return res.status(404).json({ message: "Query not found" });
    if (query.userId.toString() !== req.headers["x-user-id"]) {
      return res.status(403).json({ message: "Only the user who posted this query can reject it" });
    }
    if (query.status !== "in_progress") {
      return res.status(400).json({ message: `Cannot reject a query that is ${query.status}` });
    }

    // Remove hero assignment and set back to open for other heroes
    query.status = "open";
    query.heroId = null;
    query.heroName = null;
    await query.save();

    res.json({ message: "Hero rejected. Your request is now open for other heroes.", query });
  } catch (error) {
    res.status(500).json({ message: "Error rejecting hero", error: error.message });
  }
});

// PATCH /api/queries/:id/user-cancel — User cancels the request before a hero accepts it
router.patch("/queries/:id/user-cancel", checkRole(["user"]), async (req, res) => {
  try {
    const query = await ServiceQuery.findById(req.params.id);

    if (!query) return res.status(404).json({ message: "Query not found" });
    if (query.userId.toString() !== req.headers["x-user-id"]) {
      return res.status(403).json({ message: "Only the user who posted this query can cancel it" });
    }
    if (query.status !== "open") {
      return res.status(400).json({ message: `Cannot cancel a request that is ${query.status}` });
    }

    query.status = "rejected";
    await query.save();

    res.json({ message: "Request cancelled successfully", query });
  } catch (error) {
    res.status(500).json({ message: "Error cancelling query", error: error.message });
  }
});

module.exports = router;
