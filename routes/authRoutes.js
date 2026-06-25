const express = require("express");
const { login, logout, me } = require("../controllers/authControllers");

function authRoutes(db) {
  const router = express.Router();
  router.post("/login", login(db));
  router.post("/logout", logout());
  router.get("/me", me());
  return router;
}

module.exports = authRoutes;
