const express = require("express");
const { parseVoiceCommand, getVoiceLogs } = require("../controllers/voiceControllers");
const { requireAuth, requireAdmin } = require("../middleware/auth");

function voiceRoutes(db, openai) {
  const router = express.Router();
  router.post("/voice/parse", parseVoiceCommand(db, openai));
  router.get("/voice/logs", requireAuth, requireAdmin, getVoiceLogs(db));
  return router;
}

module.exports = voiceRoutes;
