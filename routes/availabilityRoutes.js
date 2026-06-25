const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { getAvailability, createAvailability } = require("../controllers/availabilityControllers");

function availabilityRoutes(db) {
  const router = express.Router();
  router.get("/availability", getAvailability(db));
  router.post("/availability", requireAuth, requireAdmin, createAvailability(db));
  return router;
}

module.exports = availabilityRoutes;
