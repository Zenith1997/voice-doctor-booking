const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const {
  createAppointment,
  getAllAppointments,
  updateAppointmentStatus
} = require("../controllers/appointmentControllers");

function appointmentRoutes(db) {
  const router = express.Router();
  router.post("/appointments", createAppointment(db));
  router.get("/appointments", requireAuth, requireAdmin, getAllAppointments(db));
  router.put("/appointments/:id/status", requireAuth, requireAdmin, updateAppointmentStatus(db));
  return router;
}

module.exports = appointmentRoutes;
