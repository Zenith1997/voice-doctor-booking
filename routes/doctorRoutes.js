const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { getAllDoctors, createDoctor, updateDoctor, deleteDoctor } = require("../controllers/doctorControllers");

function doctorRoutes(db) {
  const router = express.Router();
  router.get("/doctors", getAllDoctors(db));
  router.post("/doctors", requireAuth, requireAdmin, createDoctor(db));
  router.put("/doctors/:id", requireAuth, requireAdmin, updateDoctor(db));
  router.delete("/doctors/:id", requireAuth, requireAdmin, deleteDoctor(db));
  return router;
}

module.exports = doctorRoutes;
