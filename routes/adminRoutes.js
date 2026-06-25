const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const {
  getAdminSummary,
  getAdminActions,
  getAdminPatients,
  getAdminDoctors
} = require("../controllers/adminControllers");

function adminRoutes(db) {
  const router = express.Router();

  router.get("/summary", requireAuth, requireAdmin, getAdminSummary(db));
  router.get("/actions", requireAuth, requireAdmin, getAdminActions(db));
  router.get("/patients", requireAuth, requireAdmin, getAdminPatients(db));
  router.get("/doctors", requireAuth, requireAdmin, getAdminDoctors(db));

  return router;
}

module.exports = adminRoutes;
